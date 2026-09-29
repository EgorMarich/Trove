export type PromotionType = 'fixed' | 'percent'

export interface Promotion {
  id: string
  code: string
  title: string
  description: string
  type: PromotionType
  value: number
  minBookingAmount?: number
  maxDiscount?: number
  startsAt: string
  expiresAt: string
  maxUses?: number
  userLimit?: number
  destinations?: string[]
  newCustomersOnly?: boolean
  active: boolean
}

export interface PromotionUsage {
  promotionId: string
  userId: string
  bookingId: string
  discount: number
  usedAt: string
}

export interface LoyaltyProfile {
  level: 'explorer' | 'traveler' | 'voyager'
  label: string
  bookingsCount: number
  personalDiscountPercent: number
  totalSavings: number
  nextLevelBookings?: number
}

export interface PromotionQuote {
  valid: boolean
  promotion?: Promotion
  discount: number
  finalPrice: number
  reason?: string
}
