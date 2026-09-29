export type TourMeal = 'all-inclusive' | 'breakfast' | 'half-board' | 'room-only'
export type TourBadge = 'recommended' | 'hot' | 'sale' | 'new'

export interface TourFlight {
  departureAirport: string
  departureTime: string
  arrivalAirport: string
  arrivalTime: string
  direct: boolean
}

export interface NormalizedTour {
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

export interface SearchParams {
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

export interface ProviderCapabilities {
  search: boolean
  priceCheck: boolean
  booking: boolean
  redirect: boolean
}

export interface TravelProvider {
  readonly capabilities: ProviderCapabilities
  readonly id: string
  readonly name: string
  search(params: SearchParams): Promise<NormalizedTour[]>
  getOffer(id: string): Promise<NormalizedTour | null>
  checkPrice(id: string): Promise<{ available: boolean; price: number; currency: NormalizedTour['currency']; checkedAt: string } | null>
}


export interface BookingRequest {
  offerId: string
  customer: {
    firstName: string
    lastName: string
    email: string
    phone?: string
    address?: { country: string; city: string; address: string; zip?: string }
  }
  providerPreviewToken?: string
}

export interface BookingProviderPreview {
  token: string
  totalPrice: number
  currency: string
  expiresAt: string
  payment?: unknown
  policies?: unknown
  requestId?: string
}

export interface BookingResult {
  providerId: string
  mode: 'redirect' | 'booking'
  status: 'created' | 'redirect'
  bookingId?: string
  providerRequestId?: string
  redirectUrl?: string
}

export interface BookingProvider {
  readonly id: string
  readonly capabilities: ProviderCapabilities
  previewBooking?(request: BookingRequest): Promise<BookingProviderPreview>
  createBooking(request: BookingRequest): Promise<BookingResult>
  reconcileBooking?(providerOrderId: string): Promise<{ status: 'confirmed' | 'cancelled' | 'pending' | 'not_found'; providerRequestId?: string }>
  getBookingRedirect(offer: NormalizedTour): Promise<string | null>
}
