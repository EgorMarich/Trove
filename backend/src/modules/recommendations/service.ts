import type { NormalizedTour } from '../../shared/types/tour'

export function deduplicateTours(tours: NormalizedTour[]): NormalizedTour[] {
  const groups = new Map<string, NormalizedTour>()
  for (const tour of tours) {
    const key = `${tour.hotel.toLowerCase()}|${tour.departure}|${tour.destination}|${tour.duration}|${tour.departureDate}`
    const existing = groups.get(key)
    if (!existing || tour.price < existing.price) groups.set(key, tour)
  }
  return [...groups.values()]
}

export function rankTours(tours: NormalizedTour[]): NormalizedTour[] {
  return tours.map((tour) => ({ ...tour, troveScore: Math.min(99, Math.round(tour.troveScore)) })).sort((a, b) => b.troveScore - a.troveScore)
}
