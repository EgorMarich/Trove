import { useApi } from './useApi'
type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>

const allowedEvents = new Set([
  'search_submitted',
  'offer_viewed',
  'offer_favorited',
  'checkout_started',
  'payment_started',
  'payment_returned',
  'booking_confirmed',
  'guide_viewed',
  'guide_read',
  'campaign_clicked',
  'campaign_opened',
])

export const useAnalytics = () => {
  const api = useApi()

  const track = async (event: string, payload: AnalyticsPayload = {}) => {
    if (!allowedEvents.has(event)) return
    await api('/api/events', {
      method: 'POST',
      body: { event, payload },
    }).catch(() => undefined)
  }

  return { track }
}
