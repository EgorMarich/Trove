const base = (process.argv[2] || 'http://localhost:3001').replace(/\/$/, '')
const suffix = Date.now()
const email = `beta-${suffix}@trove.local`
const password = 'TroveBeta123!'
let cookieJar = new Map()

function storeCookies(response) {
  const values = response.headers.getSetCookie?.() ?? []
  for (const value of values) {
    const pair = value.split(';', 1)[0]
    const index = pair.indexOf('=')
    if (index > 0) cookieJar.set(pair.slice(0, index), pair.slice(index + 1))
  }
}
function cookies() { return [...cookieJar].map(([k,v]) => `${k}=${v}`).join('; ') }
async function request(path, options = {}) {
  const headers = new Headers(options.headers)
  if (options.body !== undefined) headers.set('content-type', 'application/json')
  const currentCookies = cookies()
  if (currentCookies) headers.set('cookie', currentCookies)
  const response = await fetch(`${base}${path}`, { ...options, headers })
  storeCookies(response)
  const text = await response.text()
  let body = null
  try { body = text ? JSON.parse(text) : null } catch { body = text }
  if (!response.ok) throw new Error(`${options.method || 'GET'} ${path} -> ${response.status}: ${text}`)
  return body
}
async function post(path, body) {
  const csrf = cookieJar.get('trove_csrf')
  return request(path, { method: 'POST', body: JSON.stringify(body), headers: csrf ? { 'X-CSRF-Token': csrf } : {} })
}

const health = await request('/api/health')
if (!health.ok || health.payment?.provider !== 'mock-payment') throw new Error('Beta payment provider is not mock-payment')
const ready = await request('/api/ready')
if (ready.status !== 'ready') throw new Error('Backend is not ready')
const tours = await request('/api/tours?limit=10')
const offer = tours.items?.find(item => item.id === 'mediterranean-01')
if (!offer) throw new Error('Demo offer mediterranean-01 is unavailable')

const registration = await post('/api/auth/register', { firstName: 'Beta', email, password, marketingEmailConsent: false, marketingSmsConsent: false })
if (!registration.demoOnlyVerificationCode) throw new Error('Expected beta verification code')
await post('/api/auth/verify', { code: registration.demoOnlyVerificationCode, type: registration.verificationType })
await post('/api/auth/login', { identifier: email, password })

const csrf = cookieJar.get('trove_csrf')
const consent = { termsAccepted: true, termsVersion: '2026-09-21', privacyVersion: '2026-09-21' }
const preview = await request('/api/bookings/preview', {
  method: 'POST',
  headers: { 'X-CSRF-Token': csrf, 'Idempotency-Key': `beta-${suffix}` },
  body: JSON.stringify({
    offerId: offer.id,
    providerId: 'mock-a',
    passengers: [{ firstName: 'Beta', lastName: 'Tester', birthDate: '2002-03-24' }],
    contact: { email },
    consent,
  }),
})
if (preview.item?.status !== 'previewed') throw new Error('Booking preview did not reach previewed')

const payment = await post('/api/payments/intents', { bookingId: preview.item.id })
if (payment.item?.status !== 'requires_payment') throw new Error('Payment intent was not created')
const paid = await post(`/api/payments/intents/${payment.item.id}/confirm`, {})
if (paid.item?.status !== 'succeeded') throw new Error('Mock payment did not succeed')
const confirmed = await request(`/api/bookings/${preview.item.id}/confirm`, {
  method: 'POST', headers: { 'X-CSRF-Token': csrf }, body: JSON.stringify({ previewToken: preview.item.previewToken }),
})
if (confirmed.item?.status !== 'confirmed' || !confirmed.item.providerOrderId) throw new Error('Booking was not confirmed')

const trips = await request('/api/me/bookings')
if (!trips.items?.some(item => item.id === confirmed.item.id && item.status === 'confirmed')) throw new Error('Confirmed booking missing from My Trips API')

console.log(JSON.stringify({ ok: true, checks: ['health','ready','search','register','verify','login','preview','payment','provider_booking','my_trips'], bookingId: confirmed.item.id, paymentIntentId: payment.item.id, providerOrderId: confirmed.item.providerOrderId }, null, 2))
