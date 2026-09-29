import { bookingStore } from '../bookings/store'
import { audit } from '../security/audit'
import { paymentStore } from './store'
import { getPaymentProvider } from './providers'
import { completeMockPayment } from './providers/mock'
import { verifyAndHandleWebhook } from './webhooks'

const PAYMENT_TTL_MS = 30 * 60 * 1000

export async function createPaymentIntent(userId: string, bookingId: string) {
  const booking = await bookingStore.find(bookingId)
  if (!booking || booking.userId !== userId) throw new Error('NOT_FOUND')
  if (['cancelled', 'failed', 'expired'].includes(booking.status)) throw new Error('BOOKING_NOT_PAYABLE')
  if (booking.paymentStatus === 'paid') throw new Error('ALREADY_PAID')
  const existing = await paymentStore.findByBooking(bookingId)
  if (existing && new Date(existing.expiresAt) > new Date() && !['failed', 'expired'].includes(existing.status)) return existing
  const provider = getPaymentProvider()
  if (!provider) throw new Error('PAYMENT_PROVIDER_UNAVAILABLE')
  const providerId = process.env.PAYMENT_PROVIDER || 'mock-payment'
  const intent = await paymentStore.create({ bookingId, userId, amount: booking.price, currency: booking.currency, status: 'requires_payment', provider: providerId as 'mock-payment'|'yookassa', expiresAt: new Date(Date.now() + PAYMENT_TTL_MS).toISOString() })
  const providerPayment = await provider.createPayment({ paymentIntentId: intent.id, amount: intent.amount, currency: intent.currency, returnUrl: process.env.PAYMENT_RETURN_URL || (process.env.FRONTEND_ORIGIN ? `${process.env.FRONTEND_ORIGIN}/payment/return/${intent.id}` : undefined) })
  await paymentStore.patch(intent.id, { providerPaymentId: providerPayment.id, checkoutUrl: providerPayment.checkoutUrl })
  await paymentStore.transition(intent.id, 'requires_payment', 'PAYMENT_INTENT_CREATED', { providerPaymentId: providerPayment.id, checkoutUrl: providerPayment.checkoutUrl })
  audit({ type: 'PAYMENT_INTENT_CREATED', userId, metadata: { bookingId, paymentIntentId: intent.id, providerPaymentId: providerPayment.id } })
  return (await paymentStore.find(intent.id))!
}

export async function confirmPayment(userId: string, paymentIntentId: string) {
  const intent = await paymentStore.find(paymentIntentId)
  if (!intent || intent.userId !== userId) throw new Error('NOT_FOUND')
  if (new Date(intent.expiresAt) <= new Date() && intent.status !== 'succeeded') { await paymentStore.transition(intent.id, 'expired', 'PAYMENT_EXPIRED'); throw new Error('PAYMENT_EXPIRED') }
  if (intent.status === 'succeeded') return intent
  if (!intent.providerPaymentId) throw new Error('PAYMENT_PROVIDER_REFERENCE_MISSING')
  // Hosted providers own the customer-facing confirmation step.
  // Trove only reconciles their authoritative status after the redirect/webhook.
  if (intent.provider === 'yookassa') return await reconcilePayment(userId, paymentIntentId)
  const paid = await paymentStore.transition(intent.id, 'processing', 'PAYMENT_PROCESSING')
  if (!paid) throw new Error('PAYMENT_NOT_CONFIRMABLE')
  if (intent.provider === 'mock-payment') {
    const mockWebhook = completeMockPayment(intent.providerPaymentId)
    if (mockWebhook) await verifyAndHandleWebhook('mock-payment', mockWebhook.rawBody, mockWebhook.signature)
    return (await paymentStore.find(intent.id))!
  }
  return await reconcilePayment(userId, paymentIntentId)
}

export async function reconcilePayment(userId: string, paymentIntentId: string) {
  const intent = await paymentStore.find(paymentIntentId)
  if (!intent || intent.userId !== userId) throw new Error('NOT_FOUND')
  if (intent.status === 'succeeded') return intent
  if (!intent.providerPaymentId) return await paymentStore.transition(intent.id, 'unknown', 'PAYMENT_RECONCILIATION_UNKNOWN')
  const provider = getPaymentProvider(intent.provider)
  if (!provider) throw new Error('PAYMENT_PROVIDER_UNAVAILABLE')
  const remote = await provider.getPayment(intent.providerPaymentId)
  if (!remote) return await paymentStore.transition(intent.id, 'unknown', 'PAYMENT_RECONCILIATION_UNKNOWN')
  if (remote.status === 'succeeded') {
    const paid = (await paymentStore.transition(intent.id, 'succeeded', 'PAYMENT_RECONCILED', { providerPaymentId: remote.id }))!
    await bookingStore.patch(intent.bookingId, { paymentStatus: 'paid' })
    return paid
  }
  if (remote.status === 'failed') {
    await paymentStore.transition(intent.id, 'failed', 'PAYMENT_RECONCILED_FAILED')
    await bookingStore.patch(intent.bookingId, { paymentStatus: 'failed', status: 'payment_failed' })
  }
  return (await paymentStore.find(intent.id))!
}
