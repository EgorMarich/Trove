import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto'
import type { CreatePaymentRequest, PaymentProvider, ProviderPayment, VerifyWebhookResult } from './types'

const secret = process.env.MOCK_PAYMENT_WEBHOOK_SECRET || 'trove-dev-webhook-secret'
const payments = new Map<string, ProviderPayment>()
const links = new Map<string, string>()
const intentLinks = new Map<string, string>()

export class MockPaymentProvider implements PaymentProvider {
  readonly id = 'mock-payment'

  async createPayment(input: CreatePaymentRequest): Promise<ProviderPayment> {
    const existingId = links.get(input.paymentIntentId)
    if (existingId) return payments.get(existingId)!
    const id = `mock_pay_${randomUUID()}`
    const payment: ProviderPayment = { id, status: 'requires_payment', amount: input.amount, currency: input.currency, checkoutUrl: `/payment/mock/${id}` }
    payments.set(id, payment)
    links.set(input.paymentIntentId, id)
    intentLinks.set(id, input.paymentIntentId)
    return payment
  }

  async getPayment(providerPaymentId: string) { return payments.get(providerPaymentId) ?? null }

  async cancelPayment(providerPaymentId: string) {
    const payment = payments.get(providerPaymentId)
    if (!payment) return null
    if (payment.status === 'succeeded') return payment
    const updated = { ...payment, status: 'failed' as const }
    payments.set(providerPaymentId, updated)
    return updated
  }

  async verifyWebhook(rawBody: string, signature: string | undefined): Promise<VerifyWebhookResult> {
    if (!signature) return { valid: false }
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
    const a = Buffer.from(signature)
    const b = Buffer.from(expected)
    if (a.length !== b.length || !timingSafeEqual(a, b)) return { valid: false }
    try {
      const body = JSON.parse(rawBody) as { eventId: string; paymentIntentId: string; status: 'succeeded' | 'failed'; providerPaymentId?: string; failureReason?: string }
      if (!body.eventId || !body.paymentIntentId || !['succeeded', 'failed'].includes(body.status)) return { valid: false }
      return { valid: true, ...body }
    } catch { return { valid: false } }
  }

  /** Test helper: produces a signed webhook without exposing signing details to HTTP clients. */
  static signWebhook(payload: Record<string, unknown>) {
    const rawBody = JSON.stringify(payload)
    const signature = createHmac('sha256', secret).update(rawBody).digest('hex')
    return { rawBody, signature }
  }
}

export const mockPaymentProvider = new MockPaymentProvider()

export function signMockWebhook(payload: Record<string, unknown>) { return MockPaymentProvider.signWebhook(payload) }

export function completeMockPayment(providerPaymentId: string) {
  const payment = payments.get(providerPaymentId)
  const paymentIntentId = intentLinks.get(providerPaymentId)
  if (!payment || !paymentIntentId) return null
  const updated = { ...payment, status: 'succeeded' as const }
  payments.set(providerPaymentId, updated)
  return signMockWebhook({ eventId: `mock_evt_${randomUUID()}`, paymentIntentId, status: 'succeeded', providerPaymentId })
}
