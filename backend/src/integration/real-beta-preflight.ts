import assert from 'node:assert/strict'

const paymentProvider = process.env.PAYMENT_PROVIDER || 'mock-payment'
const bookingNative = process.env.BOOKING_NATIVE_BOOKING_ENABLED === 'true'
const bookingBase = process.env.BOOKING_API_BASE_URL || 'https://demandapi-sandbox.booking.com/3.2'
const yookassaBase = process.env.YOOKASSA_API_URL || 'https://api.yookassa.ru/v3'

function required(name: string, value: string | undefined) {
  if (!value) throw new Error(`${name} is required`)
}

function httpsOnly(name: string, value: string) {
  const url = new URL(value)
  if (url.protocol !== 'https:') throw new Error(`${name} must use HTTPS`)
}

async function probeYooKassa() {
  required('YOOKASSA_SHOP_ID', process.env.YOOKASSA_SHOP_ID)
  required('YOOKASSA_SECRET_KEY', process.env.YOOKASSA_SECRET_KEY)
  httpsOnly('YOOKASSA_API_URL', yookassaBase)
  const credentials = Buffer.from(`${process.env.YOOKASSA_SHOP_ID}:${process.env.YOOKASSA_SECRET_KEY}`).toString('base64')
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), Number(process.env.YOOKASSA_API_TIMEOUT_MS || 15000))
  try {
    const response = await fetch(`${yookassaBase}/payments?limit=1`, {
      headers: { Authorization: `Basic ${credentials}` },
      signal: controller.signal,
    })
    assert.ok(response.ok, `YooKassa credentials/API rejected: HTTP ${response.status}`)
    console.log('YooKassa API auth: PASS')
  } finally {
    clearTimeout(timer)
  }
}

async function main() {
  console.log('Trove real-beta preflight')
  assert.notEqual(paymentProvider, 'mock-payment', 'Real-beta preflight refuses mock payment provider')
  assert.equal(paymentProvider, 'yookassa', 'PAYMENT_PROVIDER must be yookassa for real-beta preflight')
  required('PAYMENT_RETURN_URL', process.env.PAYMENT_RETURN_URL)
  httpsOnly('PAYMENT_RETURN_URL', process.env.PAYMENT_RETURN_URL!)
  required('BOOKING_API_KEY', process.env.BOOKING_API_KEY)
  required('BOOKING_AFFILIATE_ID', process.env.BOOKING_AFFILIATE_ID)
  httpsOnly('BOOKING_API_BASE_URL', bookingBase)
  assert.ok(bookingNative, 'BOOKING_NATIVE_BOOKING_ENABLED=true is required for real booking integration')
  checkBookingPaymentModel()
  await probeYooKassa()
  console.log('Booking.com credentials/config: PASS')
  console.log('Real-beta preflight: PASS')
}


function checkBookingPaymentModel() {
  const timing = process.env.BOOKING_PAYMENT_TIMING || 'pay_at_property'
  const method = process.env.BOOKING_PAYMENT_METHOD || 'pay_at_property'
  const native = process.env.BOOKING_NATIVE_BOOKING_ENABLED === 'true'
  const trovePayment = process.env.PAYMENT_PROVIDER || 'mock-payment'
  if (!native) return
  if (timing === 'pay_at_property' && trovePayment === 'yookassa') {
    throw new Error('UNSAFE_PAYMENT_MODEL: YooKassa full-price collection cannot be combined with Booking.com pay_at_property. Use a provider-online payment model or disable Trove collection for that flow.')
  }
  if (timing.startsWith('pay_online') && method === 'card' && process.env.BOOKING_CARD_SOURCE !== 'psp-token-or-vcc') {
    throw new Error('BOOKING_ONLINE_CARD_SOURCE_REQUIRED: raw card data must not be collected by Trove without a compliant PSP/tokenized flow.')
  }
}

main().catch((error) => {
  console.error('Real-beta preflight: FAIL')
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
