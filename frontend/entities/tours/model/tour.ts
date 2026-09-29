import type { Tour } from '~/types/tours'

export const formatPrice = (price: number, currency: Tour['currency'] = 'RUB') =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency, maximumFractionDigits: 0 }).format(price)

export const mealLabel: Record<Tour['meal'], string> = {
  'all-inclusive': 'Всё включено',
  breakfast: 'Завтраки',
  'half-board': 'Полупансион',
  'room-only': 'Без питания',
}

export const badgeLabel: Record<NonNullable<Tour['badge']>, string> = {
  recommended: 'Выбор Trove', hot: 'Горящее', sale: 'Цена снизилась', new: 'Новинка',
}
