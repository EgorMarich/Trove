import { bookingStore } from './store'
import type { CreateBookingInput } from './types'
import { providerById } from '../providers'
import { promotionStore } from '../promotions/store'
import { applyPromotionUsage, getLoyaltyProfile, quotePromotion } from '../promotions/service'
import { recordBookingConsent } from './consent'

export async function createBooking(userId: string, input: CreateBookingInput) {
  const existing = await bookingStore.findByIdempotency(userId, input.idempotencyKey)
  if (existing) return existing
  const provider = providerById(input.providerId)
  if (!provider) throw new Error('PROVIDER_NOT_FOUND')
  const offer = await provider.getOffer(input.offerId)
  if (!offer) throw new Error('OFFER_NOT_FOUND')
  if (!provider.capabilities.priceCheck) throw new Error('PRICE_CHECK_UNAVAILABLE')
  const check = await provider.checkPrice(input.offerId)
  if (!check?.available) throw new Error('OFFER_UNAVAILABLE')
  if (check.price !== offer.price) throw new Error('PRICE_CHANGED')
  if (input.passengers.length < 1 || input.passengers.length > 9) throw new Error('INVALID_PASSENGERS')

  const existingBookings = await bookingStore.findByUser(userId)
  const loyalty = getLoyaltyProfile(existingBookings, userId)
  const promotion = input.promoCode ? promotionStore.findByCode(input.promoCode) : undefined
  const quote = input.promoCode
    ? quotePromotion(promotion, userId, check.price, `${offer.city}, ${offer.destination}`, existingBookings.filter((item) => item.status !== 'cancelled').length === 0)
    : { valid: true, discount: 0, finalPrice: check.price }
  if (input.promoCode && !quote.valid) throw new Error(`PROMO_INVALID:${quote.reason ?? 'Промокод недействителен'}`)

  // Loyalty discount is applied only when no explicit promotion is used, preventing stacked discounts in v0.8.
  const loyaltyDiscount = input.promoCode ? 0 : Math.min(Math.round(check.price * loyalty.personalDiscountPercent / 100), Math.max(0, check.price - 1))
  const discount = (quote.discount ?? 0) + loyaltyDiscount
  const finalPrice = Math.max(1, check.price - discount)

  const booking = await bookingStore.create({
    userId, offerId: offer.id, providerId: provider.id, title: offer.title, hotel: offer.hotel,
    destination: `${offer.city}, ${offer.destination}`, departureDate: offer.departureDate, duration: offer.duration,
    price: finalPrice, originalPrice: check.price, discount, promoCode: quote.promotion?.code, currency: check.currency,
    passengers: input.passengers, contact: input.contact, status: 'pending_payment', paymentStatus: 'pending',
  })
  if (quote.promotion && quote.discount > 0) applyPromotionUsage(quote.promotion.id, userId, booking.id, quote.discount)
  await bookingStore.rememberIdempotency(userId, input.idempotencyKey, booking.id)
  await recordBookingConsent(booking.id, userId, input.consent)
  return booking
}
