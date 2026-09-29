import { parseTourFilters } from '../features/filters/utils/parseTourFilters'
import { buildTourQuery } from '../features/filters/utils/buildTourQuery'
import type { TourFilters } from '../types/filters'
import { useRoute, useRouter } from 'vue-router'
import { computed } from 'vue'
import { DEFAULT_TOUR_FILTERS } from 'constants/filter.constants'

export const useTourFilters = () => {
  const route = useRoute()
  const router = useRouter()

  const filters = computed<TourFilters>({
    get: () => parseTourFilters(route.query),

    set: (value) => {
      router.replace({
        query: buildTourQuery(value),
      })
    },
  })

  function setFilter<K extends keyof TourFilters>(
    key: K,
    value: TourFilters[K],
  ) {
    filters.value = {
      ...filters.value,
      page: 1,
      [key]: value,
    }
  }

  function resetFilters() {
    filters.value = {
      ...DEFAULT_TOUR_FILTERS,
    }
  }

  return {
    filters,
    setFilter,
    resetFilters,
  }
}