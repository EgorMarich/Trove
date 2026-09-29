import { logger } from '../observability/logger'
import { incrementMetric } from '../observability/metrics'
import { bookingStore } from '../../modules/bookings/store'
import { reconcileBooking } from '../../modules/bookings/recovery'
import { paymentStore } from '../../modules/payments/store'
import { reconcilePayment } from '../../modules/payments/service'
import { providerOrderRepository } from '../../modules/providers/orders'

const intervalMs = Number(process.env.RECONCILIATION_INTERVAL_MS || 30_000)
const batchSize = Number(process.env.RECONCILIATION_BATCH_SIZE || 20)

let timer: NodeJS.Timeout | undefined
let running = false

export async function runReconciliationOnce() {
  if (running) return { skipped: true, bookings: 0, payments: 0 }
  running = true
  let bookings = 0
  let payments = 0
  try {
    const bookingCandidates = await providerOrderRepository.listReconciliationCandidates(batchSize)
    for (const item of bookingCandidates) {
      try {
        const result = await reconcileBooking(item.userId, item.bookingId)
        bookings += 1
        incrementMetric(`reconciliation.booking.${result.status}`)
      } catch (error) {
        incrementMetric('reconciliation.booking.error')
        logger.error('booking reconciliation failed', { bookingId: item.bookingId, error: error instanceof Error ? error.message : String(error) })
      }
    }

    const paymentCandidates = await paymentStore.listReconciliationCandidates(batchSize)
    for (const item of paymentCandidates) {
      try {
        const result = await reconcilePayment(item.userId, item.id)
        payments += 1
        incrementMetric(`reconciliation.payment.${result.status}`)
      } catch (error) {
        incrementMetric('reconciliation.payment.error')
        logger.error('payment reconciliation failed', { paymentIntentId: item.id, error: error instanceof Error ? error.message : String(error) })
      }
    }
    return { skipped: false, bookings, payments }
  } finally {
    running = false
  }
}

export function startReconciliationWorker() {
  if (process.env.RECONCILIATION_WORKER_ENABLED !== 'true') {
    logger.info('reconciliation worker disabled')
    return () => undefined
  }
  timer = setInterval(() => void runReconciliationOnce(), intervalMs)
  timer.unref()
  logger.info('reconciliation worker started', { intervalMs, batchSize })
  return () => {
    if (timer) clearInterval(timer)
    timer = undefined
  }
}
