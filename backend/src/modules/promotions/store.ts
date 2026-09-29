import { randomToken } from '../security/crypto'
import type { Promotion, PromotionUsage } from './types'

const promotions: Promotion[] = [
  {
    id: 'promo-welcome', code: 'WELCOME1500', title: 'Добро пожаловать в Trove',
    description: '1 500 ₽ скидки на первое бронирование.', type: 'fixed', value: 1500,
    minBookingAmount: 50000, startsAt: '2026-01-01T00:00:00.000Z', expiresAt: '2030-12-31T23:59:59.000Z',
    userLimit: 1, newCustomersOnly: true, active: true,
  },
  {
    id: 'promo-summer', code: 'TROVE5', title: 'Скидка Trove 5%',
    description: '5% на поездки от 70 000 ₽.', type: 'percent', value: 5,
    minBookingAmount: 70000, maxDiscount: 5000, startsAt: '2026-01-01T00:00:00.000Z', expiresAt: '2030-12-31T23:59:59.000Z',
    userLimit: 3, active: true,
  },
  {
    id: 'promo-turkey', code: 'ANTALYA3000', title: 'Анталья — минус 3 000 ₽',
    description: 'Персональная акция на поездки в Анталью.', type: 'fixed', value: 3000,
    minBookingAmount: 80000, startsAt: '2026-01-01T00:00:00.000Z', expiresAt: '2030-12-31T23:59:59.000Z',
    destinations: ['Antalya'], userLimit: 2, active: true,
  },
]

const usages: PromotionUsage[] = []

export const promotionStore = {
  list() { return promotions.filter((item) => item.active) },
  findByCode(code: string) { return promotions.find((item) => item.active && item.code.toLowerCase() === code.trim().toLowerCase()) },
  countUserUsage(promotionId: string, userId: string) { return usages.filter((item) => item.promotionId === promotionId && item.userId === userId).length },
  totalUsage(promotionId: string) { return usages.filter((item) => item.promotionId === promotionId).length },
  addUsage(input: Omit<PromotionUsage, 'usedAt'>) { usages.push({ ...input, usedAt: new Date().toISOString() }); return usages[usages.length - 1] },
  getUserSavings(userId: string) { return usages.filter((item) => item.userId === userId).reduce((sum, item) => sum + item.discount, 0) },
}

export const loyaltyId = () => `loy_${randomToken(8)}`
