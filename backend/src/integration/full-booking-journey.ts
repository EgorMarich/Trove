import { register } from '../modules/auth/service'
import { previewBooking, confirmBooking } from '../modules/bookings/orchestrator'
import { createPaymentIntent, confirmPayment } from '../modules/payments/service'
import { bookingStore } from '../modules/bookings/store'
import { paymentStore } from '../modules/payments/store'

async function main() {
  const suffix = Date.now()
  const email = `journey-${suffix}@trove.local`
  const registered = await register({
    firstName: 'Journey',
    email,
    password: 'TroveDemo123!',
    marketingEmailConsent: false,
    marketingSmsConsent: false,
  })
  const userId = registered.user.id

  const preview = await previewBooking(userId, {
    offerId: 'mediterranean-01',
    providerId: 'mock-a',
    passengers: [{ firstName: 'Journey', lastName: 'Tester', birthDate: '2002-03-24' }],
    contact: { email },
    idempotencyKey: `journey-${suffix}`,
    consent: { termsAccepted: true, termsVersion: '2026-09-21', privacyVersion: '2026-09-21' },
  })

  if (preview.status !== 'previewed') throw new Error(`Expected previewed, got ${preview.status}`)
  if (!preview.previewToken) throw new Error('Missing Trove preview token')
  if (preview.providerPreviewToken === undefined) throw new Error('Missing provider preview token')

  const payment = await createPaymentIntent(userId, preview.id)
  if (payment.status !== 'requires_payment') throw new Error(`Expected requires_payment, got ${payment.status}`)

  const paid = await confirmPayment(userId, payment.id)
  if (paid.status !== 'succeeded') throw new Error(`Expected succeeded payment, got ${paid.status}`)

  const confirmed = await confirmBooking(userId, preview.id, preview.previewToken)
  if (confirmed.status !== 'confirmed') throw new Error(`Expected confirmed booking, got ${confirmed.status}`)
  if (!confirmed.providerOrderId) throw new Error('Missing provider order id')

  const storedBooking = await bookingStore.find(confirmed.id)
  const storedPayment = paymentStore.find(payment.id)
  const events = await bookingStore.events(confirmed.id)

  const cancelPreview = await previewBooking(userId, {
    offerId: 'mediterranean-01',
    providerId: 'mock-a',
    passengers: [{ firstName: 'Cancel', lastName: 'Tester', birthDate: '2002-03-24' }],
    contact: { email },
    idempotencyKey: `cancel-${suffix}`,
    consent: { termsAccepted: true, termsVersion: '2026-09-21', privacyVersion: '2026-09-21' },
  })
  const cancelled = await bookingStore.cancel(userId, cancelPreview.id)
  if (cancelled?.status !== 'cancelled') throw new Error(`Expected cancelled booking, got ${cancelled?.status}`)

  console.log(JSON.stringify({
    ok: true,
    journey: ['registered', 'previewed', 'payment_intent_created', 'payment_succeeded', 'provider_booking_created', 'confirmed', 'cancelled_draft'],
    bookingId: confirmed.id,
    providerOrderId: confirmed.providerOrderId,
    paymentIntentId: payment.id,
    paymentStatus: storedPayment?.status,
    bookingStatus: storedBooking?.status,
    lifecycleEvents: events.map((event) => event.type),
  }, null, 2))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error)
  process.exitCode = 1
})
