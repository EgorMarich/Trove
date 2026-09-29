export type PaymentIntentStatus = 'requires_payment' | 'processing' | 'succeeded' | 'failed' | 'expired' | 'unknown'
export interface PaymentIntent { id:string; bookingId:string; userId:string; amount:number; currency:string; status:PaymentIntentStatus; provider:'mock-payment'|'yookassa'; clientSecret:string; providerPaymentId?:string; checkoutUrl?:string; failureReason?:string; createdAt:string; updatedAt:string; expiresAt:string }
export interface PaymentEvent { id:string; paymentIntentId:string; type:string; status:PaymentIntentStatus; metadata?:Record<string,unknown>; createdAt:string }
