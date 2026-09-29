import type { LocationQuery } from 'vue-router'
import { DurationType, SortOrder, SortType, type TourFilters } from '../../../types/filters'
import { DEFAULT_TOUR_FILTERS } from '../../../constants/filter.constants'

const csv = (value: unknown): string[] => {
  const raw = Array.isArray(value) ? value[0] : value
  return typeof raw === 'string' && raw ? raw.split(',').filter(Boolean) : []
}

export function parseTourFilters(query: LocationQuery): TourFilters {
  return {
    page: Number(query.page) || DEFAULT_TOUR_FILTERS.page,
    limit: Number(query.limit) || DEFAULT_TOUR_FILTERS.limit,
    search: typeof query.search === 'string' ? query.search : DEFAULT_TOUR_FILTERS.search,
    destination: typeof query.destination === 'string' ? query.destination : undefined,
    departure: typeof query.departure === 'string' ? query.departure : undefined,
    dateFrom: typeof query.dateFrom === 'string' ? query.dateFrom : undefined,
    dateTo: typeof query.dateTo === 'string' ? query.dateTo : undefined,
    priceFrom: query.priceFrom !== undefined ? Number(query.priceFrom) : undefined,
    priceTo: query.priceTo !== undefined ? Number(query.priceTo) : undefined,
    rating: query.rating !== undefined ? Number(query.rating) : undefined,
    duration: Object.values(DurationType).includes(query.duration as DurationType) ? query.duration as DurationType : undefined,
    meals: csv(query.meal),
    stars: csv(query.stars).map(Number).filter(Number.isFinite),
    accommodation: csv(query.accommodation),
    flexible: query.flexible === '3' || query.flexible === '7' ? query.flexible : undefined,
    departureAirport: csv(query.departureAirport),
    regions: csv(query.region),
    amenities: csv(query.amenities),
    sort: Object.values(SortType).includes(query.sort as SortType) ? query.sort as SortType : DEFAULT_TOUR_FILTERS.sort,
    order: Object.values(SortOrder).includes(query.order as SortOrder) ? query.order as SortOrder : DEFAULT_TOUR_FILTERS.order,
  }
}
