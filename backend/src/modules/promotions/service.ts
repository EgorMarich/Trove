import type { Booking } from '../bookings/types'
import { promotionStore } from './store'
import type { LoyaltyProfile, Promotion, PromotionQuote } from './types'

export function getLoyaltyProfile(bookings: Booking[], userId: string): LoyaltyProfile {
  const count = bookings.filter((item) => item.userId === userId && item.status !== 'cancelled').length
  const level = count >= 5 ? 'voyager' : count >= 2 ? 'traveler' : 'explorer'
  const label = level === 'voyager' ? 'Voyager' : level === 'traveler' ? 'Traveler' : 'Explorer'
  const personalDiscountPercent = level === 'voyager' ? 5 : level === 'traveler' ? 3 : 0
  return {
    level,
    label,
    bookingsCount: count,
    personalDiscountPercent,
    totalSavings: promotionStore.getUserSavings(userId),
    nextLevelBookings: level === 'explorer' ? 2 : level === 'traveler' ? 5 : undefined,
  }
}

export function quotePromotion(promotion: Promotion | undefined, userId: string, price: number, destination: string, isNewCustomer: boolean): PromotionQuote {
  if (!promotion) return { valid: false, discount: 0, finalPrice: price, reason: 'Промокод не найден или больше не действует.' }
  const now = Date.now()
  if (!promotion.active || now < Date.parse(promotion.startsAt) || now > Date.parse(promotion.expiresAt)) return { valid: false, discount: 0, finalPrice: price, reason: 'Срок действия промокода закончился.' }
  if (promotion.newCustomersOnly && !isNewCustomer) return { valid: false, discount: 0, finalPrice: price, reason: 'Промокод доступен только для первого бронирования.' }
  if (promotion.maxUses !== undefined && promotionStore.totalUsage(promotion.id) >= promotion.maxUses) return { valid: false, discount: 0, finalPrice: price, reason: 'Лимит использований акции исчерпан.' }
  if (promotion.userLimit !== undefined && promotionStore.countUserUsage(promotion.id, userId) >= promotion.userLimit) return { valid: false, discount: 0, finalPrice: price, reason: 'Вы уже использовали эту акцию максимальное число раз.' }
  if (promotion.minBookingAmount !== undefined && price < promotion.minBookingAmount) return { valid: false, discount: 0, finalPrice: price, reason: `Минимальная сумма бронирования — ${promotion.minBookingAmount.toLocaleString('ru-RU')} ₽.` }
  if (promotion.destinations?.length && !promotion.destinations.some((item) => destination.toLowerCase().includes(item.toLowerCase()))) return { valid: false, discount: 0, finalPrice: price, reason: 'Акция не действует для этого направления.' }
  let discount = promotion.type === 'percent' ? Math.round(price * promotion.value / 100) : promotion.value
  if (promotion.maxDiscount !== undefined) discount = Math.min(discount, promotion.maxDiscount)
  discount = Math.min(discount, Math.max(0, price - 1))
  return { valid: true, promotion, discount, finalPrice: price - discount }
}

export function applyPromotionUsage(promotionId: string, userId: string, bookingId: string, discount: number) {
  promotionStore.addUsage({ promotionId, userId, bookingId, discount })
}
