export enum DurationType {
  WEEK = 'week',
  MEDIUM = 'medium',
  LONG = 'long',
}

export enum SortType {
  PRICE = 'price',
  RATING = 'rating',
  DURATION = 'duration',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export interface TourFilters {
  page: number
  limit: number
  search?: string
  destination?: string
  departure?: string
  dateFrom?: string
  dateTo?: string
  priceFrom?: number
  priceTo?: number
  rating?: number
  duration?: DurationType
  meals: string[]
  stars: number[]
  accommodation: string[]
  flexible?: '3' | '7'
  departureAirport: string[]
  regions: string[]
  amenities: string[]
  sort: SortType
  order: SortOrder
}
