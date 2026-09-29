import { randomToken } from '../security/crypto'
import type { SavedSearch, UserPreferences, ViewedOffer } from './types'

const favorites = new Map<string, Set<string>>()
const viewed = new Map<string, ViewedOffer[]>()
const savedSearches = new Map<string, SavedSearch[]>()
const preferences = new Map<string, UserPreferences>()

const cleanList = (values: unknown, max = 12) => Array.isArray(values) ? values.filter((value): value is string => typeof value === 'string' && value.trim().length > 0).map((value) => value.trim()).slice(0, max) : []

export const personalizationStore = {
  getFavorites(userId: string) { return [...(favorites.get(userId) ?? new Set())] },
  isFavorite(userId: string, tourId: string) { return favorites.get(userId)?.has(tourId) ?? false },
  toggleFavorite(userId: string, tourId: string) {
    const set = favorites.get(userId) ?? new Set<string>()
    if (set.has(tourId)) { set.delete(tourId); favorites.set(userId, set); return false }
    set.add(tourId); favorites.set(userId, set); return true
  },
  addViewed(userId: string, tourId: string) {
    const list = viewed.get(userId) ?? []
    const next = [{ tourId, viewedAt: new Date().toISOString() }, ...list.filter((item) => item.tourId !== tourId)].slice(0, 30)
    viewed.set(userId, next)
    return next
  },
  getViewed(userId: string) { return viewed.get(userId) ?? [] },
  getSavedSearches(userId: string) { return savedSearches.get(userId) ?? [] },
  createSavedSearch(userId: string, name: string, params: Record<string, string | number | undefined>) {
    const now = new Date().toISOString()
    const item: SavedSearch = { id: `search_${randomToken(8)}`, name: name.trim().slice(0, 80), params, createdAt: now, updatedAt: now }
    const list = [item, ...(savedSearches.get(userId) ?? [])].slice(0, 20)
    savedSearches.set(userId, list)
    return item
  },
  deleteSavedSearch(userId: string, id: string) {
    const list = savedSearches.get(userId) ?? []
    const next = list.filter((item) => item.id !== id)
    savedSearches.set(userId, next)
    return list.length !== next.length
  },
  getPreferences(userId: string): UserPreferences {
    return preferences.get(userId) ?? { destinations: [], departures: [] }
  },
  updatePreferences(userId: string, input: Partial<UserPreferences>) {
    const current = this.getPreferences(userId)
    const next: UserPreferences = {
      destinations: input.destinations ? cleanList(input.destinations) : current.destinations,
      departures: input.departures ? cleanList(input.departures) : current.departures,
      meal: input.meal ?? current.meal,
      minRating: typeof input.minRating === 'number' ? input.minRating : current.minRating,
      budgetTo: typeof input.budgetTo === 'number' ? input.budgetTo : current.budgetTo,
      duration: input.duration ?? current.duration,
    }
    preferences.set(userId, next)
    return next
  },
}
