const production = process.env.NODE_ENV === 'production'

const requiredInProduction = ['DATABASE_URL', 'REDIS_URL', 'FRONTEND_ORIGIN', 'PAYMENT_PROVIDER'] as const

export function validateEnvironment() {
  const missing = production ? requiredInProduction.filter((key) => !process.env[key]) : []
  if (missing.length) throw new Error(`MISSING_PRODUCTION_ENV:${missing.join(',')}`)

  if (production && process.env.FRONTEND_ORIGIN?.startsWith('http://')) {
    throw new Error('INSECURE_FRONTEND_ORIGIN_IN_PRODUCTION')
  }

  if (production && process.env.PAYMENT_PROVIDER === 'mock-payment') {
    throw new Error('MOCK_PAYMENT_PROVIDER_FORBIDDEN_IN_PRODUCTION')
  }

  if (production && process.env.PAYMENT_PROVIDER === 'yookassa') {
    const paymentMissing = ['YOOKASSA_SHOP_ID', 'YOOKASSA_SECRET_KEY'].filter((key) => !process.env[key])
    if (paymentMissing.length) throw new Error(`MISSING_YOOKASSA_ENV:${paymentMissing.join(',')}`)
    const returnUrl = process.env.PAYMENT_RETURN_URL || process.env.YOOKASSA_RETURN_URL || `${process.env.FRONTEND_ORIGIN}/payment/return/`;
    if (!returnUrl.startsWith('https://')) throw new Error('INSECURE_YOOKASSA_RETURN_URL_IN_PRODUCTION')
  }

  if (production && process.env.DATABASE_SSL_REQUIRED !== 'false' && process.env.DATABASE_SSL !== 'true') {
    throw new Error('DATABASE_SSL_REQUIRED_IN_PRODUCTION')
  }

  return { production }
}
