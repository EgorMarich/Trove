import assert from 'node:assert/strict'
import { BookingComOrdersClient } from '../orders'
import type { BookingComTransport, BookingComTransportResponse } from '../transport'
import { fixtures } from './fixtures'

class FixtureTransport implements BookingComTransport {
  public calls: Array<{ path: string; body: Record<string, unknown> }> = []
  private readonly responses: Record<string, unknown>

  constructor(responses: Record<string, unknown>) { this.responses = responses }

  async post(path: string, body: Record<string, unknown>): Promise<BookingComTransportResponse> {
    this.calls.push({ path, body })
    const payload = this.responses[path]
    if (!payload) return { ok: false, status: 404, json: async () => ({}), text: async () => 'fixture not found' }
    return { ok: true, status: 200, json: async () => payload, text: async () => JSON.stringify(payload) }
  }
}

async function run() {
  process.env.BOOKING_NATIVE_BOOKING_ENABLED = 'true'
  process.env.BOOKING_API_KEY = 'test-key'
  process.env.BOOKING_AFFILIATE_ID = '12345'

  const transport = new FixtureTransport({
    '/orders/preview': fixtures.preview,
    '/orders/create': fixtures.create,
    '/orders/details/accommodations': fixtures.detailsConfirmed,
  })
  const client = new BookingComOrdersClient(transport)

  const preview = await client.preview({ accommodationId: 1001, checkin: '2026-10-01', checkout: '2026-10-05', productId: 'P-1', adults: 2, country: 'ru', currency: 'EUR' })
  assert.equal(preview.orderToken, 'ORDER-TOKEN-123')
  assert.equal(preview.totalPrice, 420)
  assert.equal(preview.currency, 'EUR')

  const created = await client.create({ orderToken: preview.orderToken, productId: 'P-1', guest: { name: 'Test User', email: 'test@example.com' }, paymentTiming: 'pay_at_property', paymentMethod: 'pay_at_property' })
  assert.equal(created.providerOrderId, 'ORDER-9001')
  assert.equal(created.reservationId, 'RES-9001')

  const details = await client.details(created.providerOrderId)
  assert.equal(details.status, 'confirmed')
  assert.equal(transport.calls.map((call) => call.path).join(','), '/orders/preview,/orders/create,/orders/details/accommodations')

  const missingTransport = new FixtureTransport({ '/orders/details/accommodations': fixtures.detailsMissing })
  const missingClient = new BookingComOrdersClient(missingTransport)
  assert.equal((await missingClient.details('UNKNOWN')).status, 'not_found')

  console.log('Booking.com sandbox contract harness: PASS')
}

run().catch((error) => { console.error(error); process.exitCode = 1 })
