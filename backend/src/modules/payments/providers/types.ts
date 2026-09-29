export interface CreatePaymentRequest {
  paymentIntentId: string
  amount: number
  currency: string
  returnUrl?: string
}

export interface ProviderPayment {
  id: string
  status: 'requires_payment' | 'processing' | 'succeeded' | 'failed'
  checkoutUrl?: string
  amount: number
  currency: string
}

export interface VerifyWebhookResult {
  valid: boolean
  eventId?: string
  paymentIntentId?: string
  status?: 'succeeded' | 'failed'
  providerPaymentId?: string
  failureReason?: string
  amount?: number
  currency?: string
}

export interface PaymentProvider {
  readonly id: string
  createPayment(input: CreatePaymentRequest): Promise<ProviderPayment>
  getPayment(providerPaymentId: string): Promise<ProviderPayment | null>
  cancelPayment(providerPaymentId: string): Promise<ProviderPayment | null>
  verifyWebhook(rawBody: string, signature?: string): Promise<VerifyWebhookResult>
}
