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

export interface ViewedOffer {
  tourId: string
  viewedAt: string
}
