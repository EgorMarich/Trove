import { ref } from 'vue'
import { useApi } from './useApi'

export interface LoyaltyProfile {
  level: 'explorer' | 'traveler' | 'voyager'
  label: string
  bookingsCount: number
  personalDiscountPercent: number
  totalSavings: number
  nextLevelBookings?: number
}

export interface Promotion {
  id: string
  code: string
  title: string
  description: string
  type: 'fixed' | 'percent'
  value: number
  minBookingAmount?: number
  maxDiscount?: number
  expiresAt: string
}

export const useLoyalty = () => {
  const api = useApi()
  const profile = useState<LoyaltyProfile | null>('trove-loyalty', () => null)
  const promotions = useState<Promotion[]>('trove-promotions', () => [])
  const loading = ref(false)

  const load = async () => {
    loading.value = true
    try {
      const [loyalty, promo] = await Promise.all([
        api<{ item: LoyaltyProfile }>('/api/me/loyalty'),
        api<{ items: Promotion[] }>('/api/promotions'),
      ])
      profile.value = loyalty.item
      promotions.value = promo.items
    } finally {
      loading.value = false
    }
  }

  const validate = async (code: string, price: number, destination: string) => {
    return api<{ valid: boolean; discount: number; finalPrice: number; promotion?: Promotion; reason?: string }>('/api/promotions/validate', {
      method: 'POST', body: { code, price, destination },
    })
  }

  return { profile, promotions, loading, load, validate }
}
