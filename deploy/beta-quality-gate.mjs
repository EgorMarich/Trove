const base = (process.argv[2] || 'http://localhost:3001').replace(/\/$/, '')
const suffix = Date.now()

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function jar() {
  const values = new Map()
  return {
    set(response) {
      const cookies = response.headers.getSetCookie?.() ?? []
      for (const value of cookies) {
        const pair = value.split(';', 1)[0]
        const index = pair.indexOf('=')
        if (index > 0) values.set(pair.slice(0, index), pair.slice(index + 1))
      }
    },
    get(name) { return values.get(name) },
    header() { return [...values].map(([k, v]) => `${k}=${v}`).join('; ') },
  }
}

async function createClient(email, password) {
  const cookies = jar()
  async function request(path, options = {}) {
    const headers = new Headers(options.headers)
    if (options.body !== undefined) headers.set('content-type', 'application/json')
    const cookieHeader = cookies.header()
    if (cookieHeader) headers.set('cookie', cookieHeader)
    const response = await fetch(`${base}${path}`, { ...options, headers })
    cookies.set(response)
    const text = await response.text()
    let body = null
    try { body = text ? JSON.parse(text) : null } catch { body = text }
    return { response, body, text }
  }
  async function post(path, body, extraHeaders = {}) {
    const csrf = cookies.get('trove_csrf')
    return request(path, { method: 'POST', headers: { ...(csrf ? { 'X-CSRF-Token': csrf } : {}), ...extraHeaders }, body: JSON.stringify(body) })
  }
  return { request, post, cookies }
}

async function registerAndLogin(email) {
  const password = 'TroveBeta123!'
  const client = await createClient(email, password)
  let result = await client.post('/api/auth/register', { firstName: 'QA', email, password, marketingEmailConsent: false, marketingSmsConsent: false })
  assert(result.response.status === 201, `register failed: ${result.text}`)
  assert(result.body.demoOnlyVerificationCode, 'missing demo verification code')
  result = await client.post('/api/auth/verify', { code: result.body.demoOnlyVerificationCode, type: result.body.verificationType })
  assert(result.response.ok, `verify failed: ${result.text}`)
  result = await client.post('/api/auth/login', { identifier: email, password })
  assert(result.response.ok, `login failed: ${result.text}`)
  return client
}

async function main() {
  const checks = []
  const record = (name) => checks.push(name)

  let client = await createClient(`qa-a-${suffix}@trove.local`, 'TroveBeta123!')
  let result = await client.request('/api/health')
  assert(result.body?.ok === true && result.body?.payment?.provider === 'mock-payment', 'health/payment provider mismatch')
  record('health')
  result = await client.request('/api/ready')
  assert(result.body?.status === 'ready', 'backend not ready')
  record('ready')

  const tours = await client.request('/api/tours?limit=10')
  const offer = tours.body?.items?.find((item) => item.id === 'mediterranean-01')
  assert(offer, 'demo offer unavailable')
  record('search')

  client = await registerAndLogin(`qa-a-${suffix}@trove.local`)
  record('auth')

  // CSRF: authenticated mutation without the token must be rejected.
  result = await client.request('/api/bookings/preview', {
    method: 'POST',
    headers: { 'X-CSRF-Token': 'wrong-token', 'Idempotency-Key': `csrf-${suffix}` },
    body: JSON.stringify({ offerId: offer.id, providerId: 'mock-a', passengers: [{ firstName: 'QA', lastName: 'Tester', birthDate: '2002-03-24' }], contact: { email: `qa-a-${suffix}@trove.local` }, consent: { termsAccepted: true, termsVersion: '2026-09-21', privacyVersion: '2026-09-21' } }),
  })
  assert(result.response.status === 403 && result.body?.error === 'CSRF_TOKEN_REQUIRED', 'CSRF protection failed')
  record('csrf')

  const consent = { termsAccepted: true, termsVersion: '2026-09-21', privacyVersion: '2026-09-21' }
  const bookingBody = {
    offerId: offer.id,
    providerId: 'mock-a',
    passengers: [{ firstName: 'QA', lastName: 'Tester', birthDate: '2002-03-24' }],
    contact: { email: `qa-a-${suffix}@trove.local` },
    consent,
  }
  const idempotencyKey = `idempotency-${suffix}`
  const preview1 = await client.post('/api/bookings/preview', bookingBody, { 'Idempotency-Key': idempotencyKey })
  assert(preview1.response.ok && preview1.body?.item?.status === 'previewed', `preview failed: ${preview1.text}`)
  const preview2 = await client.post('/api/bookings/preview', bookingBody, { 'Idempotency-Key': idempotencyKey })
  assert(preview2.response.ok && preview2.body?.item?.id === preview1.body.item.id, 'preview idempotency failed')
  record('booking_idempotency')

  // Payment failure -> payment_failed -> new intent -> successful retry.
  let payment = await client.post('/api/payments/intents', { bookingId: preview1.body.item.id })
  assert(payment.response.ok && payment.body?.item?.status === 'requires_payment', `payment create failed: ${payment.text}`)
  const payment1 = payment.body.item
  const failedEvent = `qa-failed-${suffix}`
  result = await client.post('/api/payments/webhooks/mock', { eventId: failedEvent, paymentIntentId: payment1.id, status: 'failed', providerPaymentId: payment1.providerPaymentId, failureReason: 'QA_SIMULATED_FAILURE' })
  assert(result.response.ok && result.body?.duplicate === false && result.body?.item?.status === 'failed', 'failed payment webhook did not transition')
  result = await client.post('/api/payments/webhooks/mock', { eventId: failedEvent, paymentIntentId: payment1.id, status: 'failed', providerPaymentId: payment1.providerPaymentId, failureReason: 'QA_SIMULATED_FAILURE' })
  assert(result.response.ok && result.body?.duplicate === true, 'duplicate webhook was not idempotent')
  record('payment_failure_and_duplicate_webhook')

  payment = await client.post('/api/payments/intents', { bookingId: preview1.body.item.id })
  assert(payment.response.ok && payment.body?.item?.id !== payment1.id && payment.body?.item?.status === 'requires_payment', 'payment retry did not create a fresh intent')
  const payment2 = payment.body.item
  result = await client.post(`/api/payments/intents/${payment2.id}/confirm`, {})
  assert(result.response.ok && result.body?.item?.status === 'succeeded', `payment retry failed: ${result.text}`)
  record('payment_retry')

  const confirmed = await client.request(`/api/bookings/${preview1.body.item.id}/confirm`, {
    method: 'POST',
    headers: { 'X-CSRF-Token': client.cookies.get('trove_csrf') },
    body: JSON.stringify({ previewToken: preview1.body.item.previewToken }),
  })
  assert(confirmed.response.ok && confirmed.body?.item?.status === 'confirmed' && confirmed.body?.item?.providerOrderId, `provider booking failed: ${confirmed.text}`)
  record('provider_booking')

  // Confirmed bookings cannot be locally cancelled.
  result = await client.post(`/api/me/bookings/${confirmed.body.item.id}/cancel`, {})
  assert(result.response.status === 409 && result.body?.error === 'PROVIDER_CANCELLATION_REQUIRED', 'provider cancellation boundary failed')
  record('cancellation_boundary')

  // Recovery on an already authoritative booking should remain confirmed.
  result = await client.post(`/api/bookings/${confirmed.body.item.id}/recover`, {})
  assert(result.response.ok && result.body?.status === 'confirmed', 'confirmed booking recovery failed')
  record('booking_recovery')

  // Second user must not access first user's booking/payment.
  const clientB = await registerAndLogin(`qa-b-${suffix}@trove.local`)
  result = await clientB.request(`/api/me/bookings/${confirmed.body.item.id}`)
  assert(result.response.status === 404, 'cross-user booking access was not blocked')
  result = await clientB.post('/api/payments/intents', { bookingId: confirmed.body.item.id })
  assert(result.response.status === 404, 'cross-user payment intent access was not blocked')
  record('user_isolation')

  // Missing idempotency key is rejected at the boundary.
  result = await clientB.post('/api/bookings/preview', bookingBody)
  assert(result.response.status === 400 && result.body?.error === 'IDEMPOTENCY_KEY_REQUIRED', 'idempotency key validation failed')
  record('input_validation')

  // Security headers should be present on API responses.
  assert((await client.request('/api/health')).response.headers.get('x-content-type-options') === 'nosniff', 'security header missing')
  assert((await client.request('/api/health')).response.headers.get('x-frame-options') === 'DENY', 'frame protection missing')
  record('security_headers')

  console.log(JSON.stringify({ ok: true, checks, total: checks.length, bookingId: confirmed.body.item.id, paymentIntentId: payment2.id, providerOrderId: confirmed.body.item.providerOrderId }, null, 2))
}

main().catch((error) => {
  console.error(`BETA QUALITY GATE FAILED: ${error instanceof Error ? error.message : error}`)
  process.exit(1)
})
