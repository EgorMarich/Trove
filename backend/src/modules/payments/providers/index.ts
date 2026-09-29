import type { PaymentProvider } from './types'
import { mockPaymentProvider } from './mock'
import { yookassaPaymentProvider, yookassaPaymentProviderConfigured } from './yookassa'

export const paymentProviders: PaymentProvider[] = [mockPaymentProvider, ...(yookassaPaymentProviderConfigured ? [yookassaPaymentProvider] : [])]

export function getPaymentProvider(id = process.env.PAYMENT_PROVIDER || 'mock-payment') {
  return paymentProviders.find((provider) => provider.id === id)
}
