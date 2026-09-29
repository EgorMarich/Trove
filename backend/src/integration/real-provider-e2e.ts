import assert from 'node:assert/strict'
import { BookingComOrdersClient } from '../modules/providers/booking-com/orders'

const runBooking = process.env.RUN_BOOKING_REAL_E2E === 'true'
const runYooKassa = process.env.RUN_YOOKASSA_TEST_PAYMENT === 'true'

function required(name: string, value: string | undefined) {
  if (!value) throw new Error(`${name} is required`)
  return value
}

async function runBookingJourney() {
  required('BOOKING_API_KEY', process.env.BOOKING_API_KEY)
  required('BOOKING_AFFILIATE_ID', process.env.BOOKING_AFFILIATE_ID)
  assert.equal(process.env.BOOKING_NATIVE_BOOKING_ENABLED, 'true')

  const accommodationId = Number(process.env.BOOKING_SANDBOX_ACCOMMODATION_ID || '10507360')
  const checkin = process.env.BOOKING_SANDBOX_CHECKIN || futureDate(14)
  const checkout = process.env.BOOKING_SANDBOX_CHECKOUT || futureDate(16)
  const country = (process.env.BOOKING_BOOKER_COUNTRY || 'nl').toLowerCase()
  const currency = (process.env.BOOKING_CURRENCY || 'EUR').toUpperCase()
  const adults = Number(process.env.BOOKING_SANDBOX_ADULTS || '2')

  const baseUrl = process.env.BOOKING_API_BASE_URL || 'https://demandapi-sandbox.booking.com/3.2'
  assert.match(baseUrl, /^https:\/\/demandapi-sandbox\.booking\.com\/3\.2$/)

  const client = new BookingComOrdersClient()
  const transport = await rawAvailability({ accommodationId, checkin, checkout, country, currency, adults })
  const productId = String(transport)

  const preview = await client.preview({ accommodationId, checkin, checkout, productId, adults, country, currency })
  assert.ok(preview.orderToken)
  assert.ok(preview.requestId)
  console.log(`Booking preview: request_id=${preview.requestId}`)

  const email = process.env.BOOKING_SANDBOX_TEST_EMAIL || 'trove-sandbox@example.com'
  const create = await client.create({
    orderToken: preview.orderToken,
    productId,
    guest: {
      name: 'Trove Sandbox Tester',
      email,
      phone: process.env.BOOKING_SANDBOX_TEST_PHONE || '+31600000000',
      address: {
        country,
        city: process.env.BOOKING_SANDBOX_TEST_CITY || 'Amsterdam',
        address: process.env.BOOKING_SANDBOX_TEST_ADDRESS || 'Sandbox Street 1',
      },
    },
    paymentTiming: process.env.BOOKING_PAYMENT_TIMING || 'pay_at_property',
    paymentMethod: process.env.BOOKING_PAYMENT_METHOD || 'pay_at_property',
  })
  assert.ok(create.providerOrderId)
  assert.ok(create.providerRequestId)
  console.log(`Booking create: order=${create.providerOrderId}; request_id=${create.providerRequestId}`)

  const details = await client.details(create.providerOrderId)
  assert.notEqual(details.status, 'not_found')
  console.log(`Booking details: status=${details.status}; request_id=${details.providerRequestId || 'n/a'}`)

  if (details.status === 'confirmed') {
    if (!create.reservationId) throw new Error('Booking create returned no reservationId; refusing to cancel unknown reservation')
    const cancelled = await client.cancel({
      orderId: create.providerOrderId,
      reservationId: create.reservationId,
      reason: 'Trove sandbox end-to-end test cleanup',
    })
    assert.equal(cancelled.status, 'cancelled')
    console.log(`Booking cancel: request_id=${cancelled.providerRequestId || 'n/a'}`)
  } else {
    console.log('Booking cancellation skipped because sandbox order was not confirmed.')
  }
}

async function rawAvailability(input: { accommodationId: number; checkin: string; checkout: string; country: string; currency: string; adults: number }) {
  const baseUrl = process.env.BOOKING_API_BASE_URL || 'https://demandapi-sandbox.booking.com/3.2'
  const apiKey = required('BOOKING_API_KEY', process.env.BOOKING_API_KEY)
  const affiliateId = required('BOOKING_AFFILIATE_ID', process.env.BOOKING_AFFILIATE_ID)
  const response = await fetch(`${baseUrl}/accommodations/availability`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'X-Affiliate-Id': affiliateId },
    body: JSON.stringify({
      accommodation: input.accommodationId,
      booker: { country: input.country, platform: 'desktop' },
      checkin: input.checkin,
      checkout: input.checkout,
      currency: input.currency,
      guests: { number_of_adults: input.adults, number_of_rooms: 1 },
      extras: ['products', 'extra_charges'],
    }),
  })
  const payload = await response.json().catch(() => ({})) as any
  if (!response.ok) throw new Error(`Booking availability failed: HTTP ${response.status} request_id=${payload?.request_id || 'n/a'}`)
  const products = Array.isArray(payload?.data?.recommendation?.products) ? payload.data.recommendation.products : Array.isArray(payload?.data?.products) ? payload.data.products : []
  const product = products[0]
  if (!product?.id) throw new Error('Booking availability returned no product')
  return String(product.id)
}

async function runYooKassaProbe() {
  required('YOOKASSA_SHOP_ID', process.env.YOOKASSA_SHOP_ID)
  required('YOOKASSA_SECRET_KEY', process.env.YOOKASSA_SECRET_KEY)
  const base = process.env.YOOKASSA_API_URL || 'https://api.yookassa.ru/v3'
  const credentials = Buffer.from(`${process.env.YOOKASSA_SHOP_ID}:${process.env.YOOKASSA_SECRET_KEY}`).toString('base64')
  const response = await fetch(`${base}/payments?limit=1`, { headers: { Authorization: `Basic ${credentials}` } })
  assert.ok(response.ok, `YooKassa API rejected credentials: HTTP ${response.status}`)
  console.log('YooKassa API authentication: PASS')

  if (process.env.RUN_YOOKASSA_TEST_PAYMENT !== 'true') return
  if (process.env.YOOKASSA_ALLOW_TEST_PAYMENT !== 'I_UNDERSTAND_TEST_PAYMENT') {
    throw new Error('Refusing to create a YooKassa payment. Set YOOKASSA_ALLOW_TEST_PAYMENT=I_UNDERSTAND_TEST_PAYMENT explicitly.')
  }
  const amount = process.env.YOOKASSA_TEST_AMOUNT_RUB || '1.00'
  const idempotence = `trove-real-e2e-${Date.now()}`
  const payment = await fetch(`${base}/payments`, {
    method: 'POST',
    headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/json', 'Idempotence-Key': idempotence },
    body: JSON.stringify({ amount: { value: amount, currency: 'RUB' }, capture: true, confirmation: { type: 'redirect', return_url: process.env.PAYMENT_RETURN_URL || 'https://example.com/payment/return/test' }, description: 'Trove explicit test payment', metadata: { trove_e2e: 'true' } }),
  })
  const payload = await payment.json().catch(() => ({})) as any
  assert.ok(payment.ok, `YooKassa payment creation failed: HTTP ${payment.status}`)
  assert.ok(payload?.id)
  console.log(`YooKassa test payment created: id=${payload.id}; status=${payload.status}`)
}

function futureDate(days: number) { const d = new Date(); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10) }

async function main() {
  if (!runBooking && !runYooKassa) throw new Error('Nothing to run. Set RUN_BOOKING_REAL_E2E=true and/or RUN_YOOKASSA_TEST_PAYMENT=true.')
  if (runBooking) await runBookingJourney()
  if (runYooKassa) await runYooKassaProbe()
  console.log('Real provider E2E: PASS')
}

main().catch((error) => { console.error('Real provider E2E: FAIL'); console.error(error instanceof Error ? error.message : error); process.exitCode = 1 })
