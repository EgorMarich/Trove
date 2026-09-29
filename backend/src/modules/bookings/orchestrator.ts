import { bookingStore } from './store'
import { providerOrderRepository } from '../providers/orders'
import type { BookingPreviewInput } from './types'
import type { BookingProviderPreview } from '../../shared/types/tour'
import { providerById, bookingProviderById } from '../providers'
import { promotionStore } from '../promotions/store'
import { applyPromotionUsage, getLoyaltyProfile, quotePromotion } from '../promotions/service'
import { randomToken } from '../security/crypto'
import { finishAttempt, recordAttempt } from './operations'
import { recordBookingConsent } from './consent'

function assertPassengers(passengers: BookingPreviewInput['passengers']) {
  if (passengers.length < 1 || passengers.length > 9) throw new Error('INVALID_PASSENGERS')
  if (passengers.some((p) => !p.firstName?.trim() || !p.lastName?.trim())) throw new Error('INVALID_PASSENGERS')
}

export async function previewBooking(userId: string, input: BookingPreviewInput) {
  const existing = await bookingStore.findByIdempotency(userId, input.idempotencyKey)
  if (existing?.previewToken && existing.previewExpiresAt && new Date(existing.previewExpiresAt) > new Date()) return existing
  const provider = providerById(input.providerId)
  if (!provider) throw new Error('PROVIDER_NOT_FOUND')
  const offer = await provider.getOffer(input.offerId)
  if (!offer) throw new Error('OFFER_NOT_FOUND')
  if (!provider.capabilities.priceCheck) throw new Error('PRICE_CHECK_UNAVAILABLE')
  assertPassengers(input.passengers)
  const check = await provider.checkPrice(input.offerId)
  if (!check?.available) throw new Error('OFFER_UNAVAILABLE')

  const existingBookings = await bookingStore.findByUser(userId)
  const loyalty = getLoyaltyProfile(existingBookings, userId)
  const promotion = input.promoCode ? promotionStore.findByCode(input.promoCode) : undefined
  const quote = input.promoCode
    ? quotePromotion(promotion, userId, check.price, `${offer.city}, ${offer.destination}`, existingBookings.filter((item) => item.status !== 'cancelled').length === 0)
    : { valid: true, discount: 0, finalPrice: check.price }
  if (input.promoCode && !quote.valid) throw new Error(`PROMO_INVALID:${quote.reason ?? 'Промокод недействителен'}`)
  const loyaltyDiscount = input.promoCode ? 0 : Math.min(Math.round(check.price * loyalty.personalDiscountPercent / 100), Math.max(0, check.price - 1))
  let providerPreview: BookingProviderPreview | undefined
  if (provider.capabilities.booking) {
    const bookingProvider = bookingProviderById(provider.id)
    if (bookingProvider?.previewBooking) {
      providerPreview = await bookingProvider.previewBooking({
        offerId: offer.id,
        customer: { firstName: input.passengers[0].firstName, lastName: input.passengers[0].lastName, email: input.contact.email, phone: input.contact.phone },
      })
      if (providerPreview.currency !== check.currency || Math.round(providerPreview.totalPrice) !== Math.round(check.price)) {
        throw new Error('PRICE_CHANGED')
      }
    }
  }
  const discount = (quote.discount ?? 0) + loyaltyDiscount
  const finalPrice = Math.max(1, check.price - discount)
  const now = new Date().toISOString()
  const expiresAt = providerPreview?.expiresAt || new Date(Date.now() + 15 * 60 * 1000).toISOString()
  const current = existing && ['draft','price_checked','previewed','pending_payment'].includes(existing.status) ? existing : await bookingStore.create({
    userId, offerId: offer.id, providerId: provider.id, title: offer.title, hotel: offer.hotel, destination: `${offer.city}, ${offer.destination}`,
    departureDate: offer.departureDate, duration: offer.duration, price: finalPrice, originalPrice: check.price, discount,
    promoCode: quote.promotion?.code, currency: check.currency, passengers: input.passengers, contact: input.contact,
    status:'draft', paymentStatus:'pending', priceSnapshot:{amount:check.price,currency:check.currency,checkedAt:check.checkedAt}, previewToken:randomToken(24), previewExpiresAt:expiresAt,
    providerPreviewToken:providerPreview?.token, providerPreviewExpiresAt:providerPreview?.expiresAt, providerPreviewPrice:providerPreview?.totalPrice,
    providerPreviewCurrency:providerPreview?.currency, providerPayment:providerPreview?.payment, providerCancellationPolicy:providerPreview?.policies,
  })
  await bookingStore.rememberIdempotency(userId, input.idempotencyKey, current.id)
  await recordBookingConsent(current.id, userId, input.consent)
  const updated = await bookingStore.patch(current.id, { price:finalPrice, originalPrice:check.price, discount, promoCode:quote.promotion?.code, passengers:input.passengers, contact:input.contact, priceSnapshot:{amount:check.price,currency:check.currency,checkedAt:check.checkedAt}, previewToken:current.previewToken || randomToken(24), previewExpiresAt:expiresAt,
    providerPreviewToken:providerPreview?.token, providerPreviewExpiresAt:providerPreview?.expiresAt, providerPreviewPrice:providerPreview?.totalPrice, providerPreviewCurrency:providerPreview?.currency,
    providerPayment:providerPreview?.payment, providerCancellationPolicy:providerPreview?.policies,
  })!
  if (updated.status !== 'previewed') await bookingStore.transition(updated.id, 'previewed', 'BOOKING_PREVIEWED', { price: finalPrice, currency: check.currency })
  return await bookingStore.find(updated.id)!
}

export async function confirmBooking(userId: string, bookingId: string, previewToken: string) {
  const booking = await bookingStore.find(bookingId)
  if (!booking || booking.userId !== userId) throw new Error('NOT_FOUND')
  if (booking.previewToken !== previewToken) throw new Error('INVALID_PREVIEW_TOKEN')
  if (!booking.previewExpiresAt || new Date(booking.previewExpiresAt) <= new Date()) { await bookingStore.transition(booking.id,'expired','PREVIEW_EXPIRED'); throw new Error('PREVIEW_EXPIRED') }
  if (!['previewed','pending_payment'].includes(booking.status)) return booking
  const provider = providerById(booking.providerId)
  if (!provider) throw new Error('PROVIDER_NOT_FOUND')
  const check = await provider.checkPrice(booking.offerId)
  if (!check?.available) { await bookingStore.transition(booking.id,'failed','OFFER_UNAVAILABLE'); throw new Error('OFFER_UNAVAILABLE') }
  const expected = booking.originalPrice
  if (check.price !== expected) { await bookingStore.transition(booking.id,'price_changed','PRICE_CHANGED',{expected,actual:check.price}); throw new Error('PRICE_CHANGED') }
  if (booking.paymentStatus !== 'paid') { await bookingStore.transition(booking.id,'pending_payment','PAYMENT_REQUIRED'); throw new Error('PAYMENT_REQUIRED') }
  const bookingProvider = bookingProviderById(booking.providerId)
  if (!bookingProvider || !provider.capabilities.booking) { await bookingStore.transition(booking.id,'failed','NATIVE_BOOKING_UNAVAILABLE'); throw new Error('NATIVE_BOOKING_UNAVAILABLE') }
  if (booking.providerPreviewExpiresAt && new Date(booking.providerPreviewExpiresAt) <= new Date()) { await bookingStore.transition(booking.id,'expired','PROVIDER_PREVIEW_EXPIRED'); throw new Error('PROVIDER_PREVIEW_EXPIRED') }
  if (booking.providerOrderId) return booking
  await bookingStore.transition(booking.id,'provider_booking','PROVIDER_BOOKING_STARTED')
  const attempt = await recordAttempt({bookingId:booking.id,providerId:booking.providerId,attempt:1,status:'started'})
  try {
    const passenger = booking.passengers[0]
    const result = await bookingProvider.createBooking({offerId:booking.offerId,providerPreviewToken:booking.providerPreviewToken,customer:{firstName:passenger.firstName,lastName:passenger.lastName,email:booking.contact.email,phone:booking.contact.phone,address:booking.contact.address}})
    await providerOrderRepository.upsert({
      bookingId: booking.id,
      providerId: booking.providerId,
      providerOrderId: result.bookingId,
      providerRequestId: result.providerRequestId,
      status: result.status === 'created' ? 'created' : 'pending',
    })
    if (result.status !== 'created' || !result.bookingId) throw new Error('PROVIDER_BOOKING_UNCONFIRMED')
    await finishAttempt(attempt.id,'succeeded',{providerRequestId:result.providerRequestId})
    const confirmed = await bookingStore.patch(booking.id,{providerOrderId:result.bookingId,providerRequestId:result.providerRequestId,paymentStatus:'paid'})!
    await bookingStore.transition(confirmed.id,'confirmed','PROVIDER_BOOKING_CONFIRMED',{providerOrderId:result.bookingId})
    const promotion = booking.promoCode ? promotionStore.findByCode(booking.promoCode) : undefined
    if (promotion && booking.discount > 0) applyPromotionUsage(promotion.id,userId,booking.id,booking.discount)
    return await bookingStore.find(confirmed.id)!
  } catch (error) {
    const message = error instanceof Error ? error.message : 'UNKNOWN'
    // A provider may have created an order before the network failed. Persist an unknown
    // provider-order boundary and never blindly create a second order during recovery.
    await providerOrderRepository.upsert({ bookingId: booking.id, providerId: booking.providerId, providerRequestId: booking.providerRequestId, status: 'unknown' })
    await finishAttempt(attempt.id,'unknown',{errorCode:'PROVIDER_BOOKING_FAILED',errorMessage:message})
    await bookingStore.transition(booking.id,'provider_failed','PROVIDER_BOOKING_FAILED',{message,reconciliationRequired:true})
    throw error
  }
}
