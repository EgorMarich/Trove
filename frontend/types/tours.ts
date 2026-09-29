export type TourMeal = 'all-inclusive' | 'breakfast' | 'half-board' | 'room-only'
export type TourBadge = 'recommended' | 'hot' | 'sale' | 'new'

export interface TourFlight {
  departureAirport: string
  departureTime: string
  arrivalAirport: string
  arrivalTime: string
  direct: boolean
}

export interface ProviderCapabilities {
  search: boolean
  priceCheck: boolean
  booking: boolean
  redirect: boolean
}

export interface Tour {
  id: string
  provider: string
  providerOfferId: string
  title: string
  hotel: string
  city: string
  destination: string
  countryCode: string
  image: string
  rating: number
  reviews: number
  duration: number
  departureDate: string
  departure: string
  price: number
  oldPrice?: number
  currency: 'RUB' | 'EUR' | 'USD'
  meal: TourMeal
  room: string
  flight: TourFlight
  badge?: TourBadge
  tags: string[]
  troveScore: number
  reasons: string[]
  sourceUrl?: string
  bookingUrl?: string
  priceUpdatedAt: string
}

export interface TourSearchParams {
  search?: string
  departure?: string
  destination?: string
  dateFrom?: string
  dateTo?: string
  guests?: number
  priceFrom?: number
  priceTo?: number
  rating?: number
  duration?: 'week' | 'medium' | 'long'
  sort?: 'recommended' | 'price' | 'rating' | 'duration'
  order?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface TourSearchResponse {
  items: Tour[]
  total: number
  page: number
  limit: number
  providers?: number
  requestedProviders?: number
  providerStatus?: Array<{ id: string; name: string; ok: boolean; capabilities: ProviderCapabilities }>
}

export interface TourDetailResponse {
  item: Tour
  provider: { id: string; name: string; capabilities: ProviderCapabilities }
}

export interface PriceCheckResponse {
  providerId: string
  available: boolean
  price: number
  currency: Tour['currency']
  checkedAt: string
}
