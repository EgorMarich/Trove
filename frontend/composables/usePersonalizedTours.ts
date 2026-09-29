import { useApi } from './useApi';
import { ref } from 'vue'
import type { Tour } from '~/types/tours'

export const usePersonalizedTours = () => {
  const api = useApi()
  const items = ref<Tour[]>([])
  const loading = ref(false)
  const personalized = ref(false)

  const load = async (params: { destination?: string; budgetTo?: number; duration?: 'week' | 'medium' | 'long'; limit?: number } = {}) => {
    loading.value = true
    try {
      const response = await api<{ items: Tour[]; personalized: boolean }>('/api/personalization/recommendations', { query: params })
      personalized.value = response.personalized
      items.value = response.personalized ? response.items : []
      return items.value
    } catch {
      items.value = []
      personalized.value = false
      return []
    } finally {
      loading.value = false
    }
  }

  const trackImpression = async (offerId: string, placement = 'home_for_you') => {
    await api('/api/personalization/impressions', { method: 'POST', body: { offerId, placement } }).catch(() => undefined)
  }

  return { items, loading, personalized, load, trackImpression }
}
