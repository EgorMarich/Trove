import type { LocationQueryRaw } from 'vue-router'
import type { TourFilters } from '../../../types/filters'

export function buildTourQuery(filters: TourFilters): LocationQueryRaw {
  const query: LocationQueryRaw = {}
  const arrays: Record<string, string[] | number[]> = {
    meal: filters.meals,
    stars: filters.stars,
    accommodation: filters.accommodation,
    departureAirport: filters.departureAirport,
    region: filters.regions,
    amenities: filters.amenities,
  }

  Object.entries(filters).forEach(([key, value]) => {
    if (Array.isArray(value)) return
    if (value !== undefined && value !== '' && value !== null) query[key] = String(value)
  })

  Object.entries(arrays).forEach(([key, value]) => {
    if (value.length) query[key] = value.join(',')
  })

  return query
}
