import assert from 'node:assert/strict'

const baseUrl = process.env.BOOKING_API_BASE_URL || 'https://demandapi-sandbox.booking.com/3.2'
const apiKey = process.env.BOOKING_API_KEY
const affiliateId = process.env.BOOKING_AFFILIATE_ID
const accommodationId = Number(process.env.BOOKING_SANDBOX_ACCOMMODATION_ID || '10507360')
const country = (process.env.BOOKING_BOOKER_COUNTRY || 'nl').toLowerCase()
const currency = (process.env.BOOKING_CURRENCY || 'EUR').toUpperCase()
const adults = Number(process.env.BOOKING_SANDBOX_ADULTS || '2')
const checkin = process.env.BOOKING_SANDBOX_CHECKIN || futureDate(14)
const checkout = process.env.BOOKING_SANDBOX_CHECKOUT || futureDate(16)

function futureDate(days: number) {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function assertConfigured() {
  if (!apiKey || !affiliateId) {
    throw new Error('BOOKING_API_KEY and BOOKING_AFFILIATE_ID are required. Refusing to run sandbox integration without credentials.')
  }
  if (!Number.isInteger(accommodationId)) throw new Error('BOOKING_SANDBOX_ACCOMMODATION_ID must be an integer')
}

async function post(path: string, body: Record<string, unknown>) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'X-Affiliate-Id': String(affiliateId),
    },
    body: JSON.stringify(body),
  })
  const payload = await response.json().catch(() => ({})) as Record<string, any>
  if (!response.ok) {
    throw new Error(`Booking.com ${path} failed: HTTP ${response.status} ${JSON.stringify(payload).slice(0, 500)}`)
  }
  return payload
}

async function run() {
  assertConfigured()
  console.log(`Booking.com sandbox: ${baseUrl}`)
  console.log(`Accommodation: ${accommodationId}; ${checkin} → ${checkout}`)

  const search = await post('/accommodations/search', {
    booker: { country, platform: 'desktop' },
    checkin,
    checkout,
    accommodations: [accommodationId],
    currency,
    extras: ['products', 'extra_charges'],
    guests: { number_of_adults: adults, number_of_rooms: 1 },
  })
  const item = Array.isArray(search.data) ? search.data[0] : undefined
  assert.ok(item, 'Sandbox search returned no accommodation')
  const searchedProduct = Array.isArray(item.products) ? item.products[0] : undefined
  assert.ok(searchedProduct?.id, 'Sandbox search returned no product id')
  console.log(`Search: accommodation=${item.id}, product=${searchedProduct.id}`)

  const availability = await post('/accommodations/availability', {
    accommodation: accommodationId,
    booker: { country, platform: 'desktop' },
    checkin,
    checkout,
    currency,
    extras: ['products', 'extra_charges'],
    guests: { number_of_adults: adults, number_of_rooms: 1 },
  })
  const recommendation = availability?.data?.recommendation
  const availableProducts = Array.isArray(recommendation?.products)
    ? recommendation.products
    : Array.isArray(availability?.data?.products)
      ? availability.data.products
      : []
  const product = availableProducts.find((candidate: any) => String(candidate?.id) === String(searchedProduct.id)) || availableProducts[0]
  assert.ok(product?.id, 'Sandbox availability returned no bookable product')
  console.log(`Availability: product=${product.id}`)

  const preview = await post('/orders/preview', {
    currency,
    accommodation: {
      id: accommodationId,
      checkin,
      checkout,
      booker: { platform: 'desktop', country },
      products: [{ id: String(product.id), allocation: { number_of_adults: adults, children: [] } }],
    },
  })
  const orderToken = String(preview?.data?.order_token || '')
  assert.ok(orderToken, 'Sandbox preview returned no order_token')
  const previewAccommodation = preview?.data?.accommodation || {}
  console.log(`Preview: token received; total=${JSON.stringify(previewAccommodation.price?.display || previewAccommodation.price?.total || null)}`)

  const create = await post('/orders/create', {
    order_token: orderToken,
    accommodation: {
      products: [{
        id: String(product.id),
        guests: [{ name: 'Trove Sandbox Tester', email: process.env.BOOKING_SANDBOX_TEST_EMAIL || 'trove-sandbox@example.com' }],
      }],
      booker: {
        name: 'Trove Sandbox Tester',
        email: process.env.BOOKING_SANDBOX_TEST_EMAIL || 'trove-sandbox@example.com',
        telephone: process.env.BOOKING_SANDBOX_TEST_PHONE || '+31600000000',
        address: process.env.BOOKING_SANDBOX_TEST_ADDRESS || 'Sandbox Street 1',
        city: process.env.BOOKING_SANDBOX_TEST_CITY || 'Amsterdam',
        country,
      },
    },
    payment: { timing: process.env.BOOKING_PAYMENT_TIMING || 'pay_at_property', method: process.env.BOOKING_PAYMENT_METHOD || 'pay_at_property' },
  })
  const orderId = String(create?.data?.order || create?.data?.accommodation?.order || create?.data?.accommodation?.reservation || '')
  assert.ok(orderId, 'Sandbox create returned no order identifier')
  console.log(`Create: order=${orderId}`)

  const details = await post('/orders/details/accommodations', {
    orders: [orderId],
    extras: ['payment', 'policies', 'extra_charges'],
  })
  const detail = Array.isArray(details?.data) ? details.data[0] : undefined
  assert.ok(detail, 'Sandbox details returned no order')
  console.log(`Details: status=${detail.status || 'unknown'}`)
  console.log('Booking.com sandbox end-to-end journey: PASS')
}

run().catch((error) => {
  console.error('Booking.com sandbox end-to-end journey: FAIL')
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
