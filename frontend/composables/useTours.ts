import { useApi } from './useApi';
import { computed, ref } from 'vue'
import { DATA_TOURS } from '@entities/tours/config/data'
import type { PriceCheckResponse, Tour, TourDetailResponse, TourSearchParams, TourSearchResponse } from '~/types/tours'

export const useTours = () => {
  const tours = ref<Tour[]>([])
  const total = ref(0)
  const providers = ref(0)
  const requestedProviders = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const api = useApi()

  const search = async (params: TourSearchParams = {}) => {
    loading.value = true
    error.value = null
    try {
      const response = await api<TourSearchResponse>('/api/tours', { query: params })
      tours.value = response.items
      total.value = response.total
      providers.value = response.providers ?? 0
      requestedProviders.value = response.requestedProviders ?? response.providers ?? 0
      return response.items
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : 'Не удалось загрузить предложения'
      if (import.meta.dev && useRuntimeConfig().public.useDemoFallback) {
        tours.value = [...DATA_TOURS]
        total.value = DATA_TOURS.length
        providers.value = 1
        requestedProviders.value = 1
      } else {
        tours.value = []
        total.value = 0
        providers.value = 0
        requestedProviders.value = 0
      }
      return []
    } finally {
      loading.value = false
    }
  }

  const getDetail = async (id: string) => {
    try {
      return await api<TourDetailResponse>(`/api/tours/${id}`)
    } catch {
      const item = useRuntimeConfig().public.useDemoFallback ? (DATA_TOURS.find((tour) => tour.id === id) ?? null) : null
      return item ? { item, provider: { id: 'mock-a', name: 'Trove Demo Travel', capabilities: { search: true, priceCheck: true, booking: false, redirect: true } } } : null
    }
  }

  const getById = async (id: string) => {
    const detail = await getDetail(id)
    return detail?.item ?? null
  }

  const checkPrice = async (id: string, provider: string) => {
    return api<PriceCheckResponse>(`/api/tours/${id}/price`, { query: { provider } })
  }

  const getRedirect = async (id: string, provider: string) => {
    return api<{ providerId: string; mode: 'redirect'; url: string }>(`/api/tours/${id}/redirect`, { query: { provider } })
  }

  const featuredTours = computed(() =>
    [...tours.value].sort((a, b) => b.troveScore - a.troveScore).slice(0, 3),
  )
  const hotTours = computed(() => tours.value.filter((tour) => tour.badge === 'hot' || tour.badge === 'sale'))

  return {
    tours, total, providers, requestedProviders, loading, error, search, getById, getDetail, checkPrice, getRedirect, featuredTours, hotTours,
  }
}
