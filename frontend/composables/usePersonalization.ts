import { ref } from 'vue'
import { useApi } from './useApi'

export interface SavedSearch {
  id: string
  name: string
  params: Record<string, string | number | undefined>
  createdAt: string
  updatedAt: string
}
export interface UserPreferences {
  destinations: string[]
  departures: string[]
  meal?: 'all-inclusive' | 'breakfast' | 'half-board' | 'room-only'
  minRating?: number
  budgetTo?: number
  duration?: 'week' | 'medium' | 'long'
}

export const usePersonalization = () => {
  const api = useApi()
  const favorites = useState<string[]>('trove-favorites', () => [])
  const viewed = useState<{ tourId: string; viewedAt: string }[]>('trove-viewed', () => [])
  const savedSearches = useState<SavedSearch[]>('trove-saved-searches', () => [])
  const preferences = useState<UserPreferences>('trove-preferences', () => ({
    destinations: [],
    departures: [],
  }))
  const loaded = useState('trove-personalization-loaded', () => false)
  const loading = ref(false)

  const load = async (force = false) => {
    if (loaded.value && !force) return
    loading.value = true
    try {
      const data = await api<{
        favorites: string[]
        viewed: typeof viewed.value
        savedSearches: SavedSearch[]
        preferences: UserPreferences
      }>('/api/me/personalization')
      favorites.value = data.favorites
      viewed.value = data.viewed
      savedSearches.value = data.savedSearches
      preferences.value = data.preferences
      loaded.value = true
    } catch {
      /* anonymous users simply get empty local state */
    } finally {
      loading.value = false
    }
  }

  const isFavorite = (tourId: string) => favorites.value.includes(tourId)
  const toggleFavorite = async (tourId: string) => {
    const response = await api<{ tourId: string; isFavorite: boolean }>(
      `/api/me/favorites/${encodeURIComponent(tourId)}`,
      { method: 'POST' }
    )
    favorites.value = response.isFavorite
      ? [...new Set([...favorites.value, tourId])]
      : favorites.value.filter((id) => id !== tourId)
    return response.isFavorite
  }
  const addViewed = async (tourId: string) => {
    await api(`/api/me/viewed/${encodeURIComponent(tourId)}`, { method: 'POST' }).catch(
      () => undefined
    )
  }
  const saveSearch = async (name: string, params: Record<string, unknown>) => {
    const response = await api<{ item: SavedSearch }>('/api/me/saved-searches', {
      method: 'POST',
      body: { name, params },
    })
    savedSearches.value = [response.item, ...savedSearches.value]
    return response.item
  }
  const deleteSearch = async (id: string) => {
    await api(`/api/me/saved-searches/${encodeURIComponent(id)}`, { method: 'DELETE' })
    savedSearches.value = savedSearches.value.filter((item) => item.id !== id)
  }
  const updatePreferences = async (next: Partial<UserPreferences>) => {
    const response = await api<{ preferences: UserPreferences }>('/api/me/preferences', {
      method: 'PATCH',
      body: next,
    })
    preferences.value = response.preferences
    return response.preferences
  }

  return {
    favorites,
    viewed,
    savedSearches,
    preferences,
    loaded,
    loading,
    load,
    isFavorite,
    toggleFavorite,
    addViewed,
    saveSearch,
    deleteSearch,
    updatePreferences,
  }
}
