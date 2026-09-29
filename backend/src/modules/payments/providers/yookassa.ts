import type { CreatePaymentRequest, PaymentProvider, ProviderPayment, VerifyWebhookResult } from './types'

const BASE_URL = process.env.YOOKASSA_API_URL || 'https://api.yookassa.ru/v3'
const shopId = process.env.YOOKASSA_SHOP_ID || ''
const secretKey = process.env.YOOKASSA_SECRET_KEY || ''
const returnUrl = process.env.YOOKASSA_RETURN_URL || ''

function configured() {
  return Boolean(shopId && secretKey)
}

function authHeader() {
  return `Basic ${Buffer.from(`${shopId}:${secretKey}`).toString('base64')}`
}

async function request<T>(path: string, init: RequestInit = {}) {
  const timeoutMs = Number(process.env.YOOKASSA_API_TIMEOUT_MS || '15000')
  if (!configured()) throw new Error('YOOKASSA_NOT_CONFIGURED')
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        Authorization: authHeader(),
        'Content-Type': 'application/json',
        ...(init.headers || {}),
      },
      signal: controller.signal,
    })
    const text = await response.text()
    let body: unknown = null
    try { body = text ? JSON.parse(text) : null } catch { body = null }
    if (!response.ok) throw new Error(`YOOKASSA_HTTP_${response.status}`)
    return body as T
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw new Error(`YOOKASSA_TIMEOUT_${timeoutMs}`)
    throw error
  } finally {
    clearTimeout(timer)
  }
}

type YooPayment = {
  id: string
  status: 'pending' | 'waiting_for_capture' | 'succeeded' | 'canceled'
  paid?: boolean
  amount: { value: string; currency: string }
  metadata?: Record<string, string>
  confirmation?: { type?: string; confirmation_url?: string }
  cancellation_details?: { reason?: string }
}

function mapStatus(payment: YooPayment): ProviderPayment['status'] {
  if (payment.status === 'succeeded') return 'succeeded'
  if (payment.status === 'canceled') return 'failed'
  if (payment.status === 'waiting_for_capture') return 'processing'
  return 'requires_payment'
}

function toProviderPayment(payment: YooPayment): ProviderPayment {
  return {
    id: payment.id,
    status: mapStatus(payment),
    checkoutUrl: payment.confirmation?.confirmation_url,
    amount: Number(payment.amount.value),
    currency: payment.amount.currency,
  }
}

export class YooKassaPaymentProvider implements PaymentProvider {
  readonly id = 'yookassa'

  async createPayment(input: CreatePaymentRequest): Promise<ProviderPayment> {
    if (input.currency !== 'RUB') throw new Error('YOOKASSA_CURRENCY_UNSUPPORTED')
    const payment = await request<YooPayment>('/payments', {
      method: 'POST',
      headers: { 'Idempotence-Key': input.paymentIntentId.slice(0, 64) },
      body: JSON.stringify({
        amount: { value: input.amount.toFixed(2), currency: input.currency },
        capture: true,
        confirmation: { type: 'redirect', return_url: input.returnUrl || returnUrl },
        description: `Оплата поездки Trove ${input.paymentIntentId}`,
        metadata: { payment_intent_id: input.paymentIntentId },
      }),
    })
    return toProviderPayment(payment)
  }

  async getPayment(providerPaymentId: string) {
    const payment = await request<YooPayment>(`/payments/${encodeURIComponent(providerPaymentId)}`)
    return toProviderPayment(payment)
  }

  async cancelPayment(providerPaymentId: string) {
    const payment = await request<YooPayment>(`/payments/${encodeURIComponent(providerPaymentId)}/cancel`, {
      method: 'POST',
      headers: { 'Idempotence-Key': `cancel-${providerPaymentId}`.slice(0, 64) },
      body: JSON.stringify({}),
    })
    return toProviderPayment(payment)
  }

  async verifyWebhook(rawBody: string): Promise<VerifyWebhookResult> {
    let notification: { event?: string; object?: YooPayment } | null = null
    try { notification = JSON.parse(rawBody) } catch { return { valid: false } }
    const remote = notification?.object
    if (!notification?.event || !remote?.id) return { valid: false }

    // YooKassa webhook authenticity is established by retrieving the payment
    // from YooKassa over authenticated API rather than trusting the callback body.
    let authoritative: YooPayment
    try { authoritative = await request<YooPayment>(`/payments/${encodeURIComponent(remote.id)}`) } catch { return { valid: false } }
    const paymentIntentId = authoritative.metadata?.payment_intent_id
    if (!paymentIntentId) return { valid: false }

    const status = authoritative.status === 'succeeded' ? 'succeeded' : authoritative.status === 'canceled' ? 'failed' : undefined
    if (!status) return { valid: false }
    return {
      valid: true,
      eventId: `yookassa:${notification.event}:${authoritative.id}`,
      paymentIntentId,
      status,
      providerPaymentId: authoritative.id,
      failureReason: authoritative.cancellation_details?.reason,
      amount: Number(authoritative.amount.value),
      currency: authoritative.amount.currency,
    }
  }
}

export const yookassaPaymentProvider = new YooKassaPaymentProvider()
export const yookassaPaymentProviderConfigured = configured()
