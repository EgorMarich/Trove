import { audit } from '../security/audit'
import { bookingStore } from '../bookings/store'
import { paymentStore } from './store'
import { getPaymentProvider } from './providers'

export async function handleVerifiedPaymentWebhook(input: { eventId: string; paymentIntentId: string; status: 'succeeded' | 'failed'; providerPaymentId?: string; failureReason?: string; amount?: number; currency?: string }) {
  if (await paymentStore.hasEvent(input.eventId)) return { duplicate: true, item: await paymentStore.find(input.paymentIntentId) }
  const intent = await paymentStore.find(input.paymentIntentId)
  if (!intent) throw new Error('NOT_FOUND')
  if (input.amount !== undefined && Math.abs(input.amount - intent.amount) > 0.009) throw new Error('PAYMENT_AMOUNT_MISMATCH')
  if (input.currency && input.currency !== intent.currency) throw new Error('PAYMENT_CURRENCY_MISMATCH')
  await paymentStore.patch(intent.id, { providerPaymentId: input.providerPaymentId ?? intent.providerPaymentId, failureReason: input.failureReason })
  const updated = await paymentStore.transition(intent.id, input.status, `PAYMENT_WEBHOOK_${input.status.toUpperCase()}`, { eventId: input.eventId }, input.eventId)
  if (input.status === 'succeeded') await bookingStore.patch(intent.bookingId, { paymentStatus: 'paid' })
  else await bookingStore.patch(intent.bookingId, { paymentStatus: 'failed', status: 'payment_failed' })
  audit({ type: input.status === 'succeeded' ? 'PAYMENT_SUCCEEDED' : 'PAYMENT_FAILED', userId: intent.userId, metadata: { bookingId: intent.bookingId, paymentIntentId: intent.id, eventId: input.eventId } })
  return { duplicate: false, item: updated }
}

export async function verifyAndHandleWebhook(providerId: string, rawBody: string, signature: string | undefined) {
  const provider = getPaymentProvider(providerId)
  if (!provider) throw new Error('PAYMENT_PROVIDER_UNAVAILABLE')
  const result = await provider.verifyWebhook(rawBody, signature)
  if (!result.valid || !result.eventId || !result.paymentIntentId || !result.status) throw new Error('INVALID_WEBHOOK_SIGNATURE')
  return await handleVerifiedPaymentWebhook(result as { eventId: string; paymentIntentId: string; status: 'succeeded' | 'failed'; providerPaymentId?: string; failureReason?: string; amount?: number; currency?: string })
}
