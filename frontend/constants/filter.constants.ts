import {
  SortOrder,
  SortType,
  type TourFilters,
} from '../types/filters'

export const DEFAULT_TOUR_FILTERS: TourFilters = {
  page: 1,
  limit: 12,
  search: '',
  destination: undefined,
  departure: undefined,
  dateFrom: undefined,
  dateTo: undefined,
  priceFrom: undefined,
  priceTo: undefined,
  rating: undefined,
  duration: undefined,
  meals: [],
  stars: [],
  accommodation: [],
  flexible: undefined,
  departureAirport: [],
  regions: [],
  amenities: [],
  sort: SortType.PRICE,
  order: SortOrder.ASC,
}
