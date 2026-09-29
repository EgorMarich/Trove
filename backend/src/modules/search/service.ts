import type { NormalizedTour, SearchParams, TravelProvider } from '../../shared/types/tour'
import { deduplicateTours, rankTours } from '../recommendations/service'

function matchesDuration(tour: NormalizedTour, duration?: SearchParams['duration']) {
  if (!duration) return true
  if (duration === 'week') return tour.duration <= 7
  if (duration === 'medium') return tour.duration >= 8 && tour.duration <= 10
  return tour.duration >= 11
}

function matchesSearch(tour: NormalizedTour, search?: string) {
  if (!search?.trim()) return true
  const haystack = `${tour.title} ${tour.hotel} ${tour.city} ${tour.destination}`.toLowerCase()
  return haystack.includes(search.trim().toLowerCase())
}

export async function searchTours(params: SearchParams, providerList: TravelProvider[]) {
  const settled = await Promise.allSettled(providerList.map((provider) => provider.search(params)))
  const successfulResponses = settled
    .filter((result): result is PromiseFulfilledResult<NormalizedTour[]> => result.status === 'fulfilled')
    .map((result) => result.value)

  let items = deduplicateTours(successfulResponses.flat())

  items = items.filter((tour) => matchesSearch(tour, params.search))
  if (params.destination) items = items.filter((tour) => tour.destination.toLowerCase() === params.destination!.toLowerCase())
  if (params.departure) items = items.filter((tour) => tour.departure.toLowerCase() === params.departure!.toLowerCase())
  if (params.priceFrom !== undefined) items = items.filter((tour) => tour.price >= params.priceFrom!)
  if (params.priceTo !== undefined) items = items.filter((tour) => tour.price <= params.priceTo!)
  if (params.rating !== undefined) items = items.filter((tour) => tour.rating >= params.rating!)
  items = items.filter((tour) => matchesDuration(tour, params.duration))

  const sort = params.sort ?? 'recommended'
  const direction = params.order === 'desc' ? -1 : 1
  if (sort === 'price') items.sort((a, b) => (a.price - b.price) * direction)
  else if (sort === 'rating') items.sort((a, b) => (a.rating - b.rating) * direction)
  else if (sort === 'duration') items.sort((a, b) => (a.duration - b.duration) * direction)
  else items = rankTours(items)

  const page = Math.max(1, params.page ?? 1)
  const limit = Math.min(50, Math.max(1, params.limit ?? 12))
  const total = items.length
  const start = (page - 1) * limit

  return {
    items: items.slice(start, start + limit),
    total,
    page,
    limit,
    providers: successfulResponses.length,
    requestedProviders: providerList.length,
    providerStatus: providerList.map((provider, index) => ({
      id: provider.id,
      name: provider.name,
      ok: settled[index]?.status === 'fulfilled',
      capabilities: provider.capabilities,
    })),
  }
}
