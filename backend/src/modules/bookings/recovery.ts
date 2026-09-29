import { bookingStore } from './store'
import { getAttempts, canRetryBooking, scheduleRetry } from './operations'
import { providerById, bookingProviderById } from '../providers'
import { providerOrderRepository } from '../providers/orders'

const MAX_ATTEMPTS = 3

export async function reconcileBooking(userId: string, bookingId: string) {
  const booking = await bookingStore.find(bookingId)
  if (!booking || booking.userId !== userId) throw new Error('NOT_FOUND')

  const providerOrder = await providerOrderRepository.findByBooking(bookingId)
  if (booking.providerOrderId) {
    if (providerOrder?.status === 'confirmed') return { booking, status: 'confirmed' as const, source: 'trove_record' as const }
  }

  const provider = providerById(booking.providerId)
  if (!provider) throw new Error('PROVIDER_NOT_FOUND')
  const bookingProvider = bookingProviderById(booking.providerId)

  // If we have a remote order ID, ask the provider for the authoritative state.
  if (providerOrder?.providerOrderId && bookingProvider?.reconcileBooking) {
    const remote = await bookingProvider.reconcileBooking(providerOrder.providerOrderId)
    if (remote.status === 'confirmed') {
      await providerOrderRepository.upsert({ ...providerOrder, status: 'confirmed', providerRequestId: remote.providerRequestId ?? providerOrder.providerRequestId })
      const updated = await bookingStore.patch(booking.id, { providerOrderId: providerOrder.providerOrderId, providerRequestId: remote.providerRequestId ?? providerOrder.providerRequestId, paymentStatus: 'paid' })!
      await bookingStore.transition(updated.id, 'confirmed', 'PROVIDER_RECONCILED', { providerOrderId: providerOrder.providerOrderId })
      return { booking: await bookingStore.find(booking.id), status: 'confirmed' as const, source: 'provider' as const }
    }
    if (remote.status === 'cancelled') {
      await providerOrderRepository.upsert({ ...providerOrder, status: 'cancelled', providerRequestId: remote.providerRequestId ?? providerOrder.providerRequestId })
      await bookingStore.transition(booking.id, 'failed', 'PROVIDER_ORDER_CANCELLED', { providerOrderId: providerOrder.providerOrderId })
      return { booking: await bookingStore.find(booking.id), status: 'provider_cancelled' as const, source: 'provider' as const }
    }
    return { booking: await bookingStore.find(booking.id), status: 'provider_pending' as const, source: 'provider' as const }
  }

  // No remote order ID means we cannot prove whether the provider created an order.
  // Do not retry blindly: this could create a duplicate reservation.
  if (providerOrder?.status === 'unknown' || booking.status === 'provider_failed') {
    return { booking, status: 'manual_review' as const, reason: 'PROVIDER_ORDER_UNKNOWN', attempts: await getAttempts(bookingId) }
  }

  const attempts = await getAttempts(bookingId)
  if (attempts.length >= MAX_ATTEMPTS || !await canRetryBooking(bookingId)) {
    return { booking, status: 'manual_review' as const, attempts }
  }
  const nextRetryAt = await scheduleRetry(bookingId, 2 ** attempts.length * 30_000)
  return { booking: await bookingStore.find(bookingId), status: 'retry_scheduled' as const, nextRetryAt, attempts }
}
