import { logger } from '../../infrastructure/observability/logger'
import { query, databaseEnabled } from '../../infrastructure/database/client'

const ALLOWED_EVENTS = new Set([
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

export function recordAnalyticsEvent(event: string, payload: Record<string, unknown> = {}, context: { userId?: string; ip?: string } = {}) {
  if (!ALLOWED_EVENTS.has(event)) throw new Error('INVALID_EVENT')
  logger.info('analytics event', { event, userId: context.userId, ip: context.ip, payload })
  if (databaseEnabled && context.userId) {
    void query(`INSERT INTO user_activity_events(user_id,event,payload,created_at) VALUES($1,$2,$3,now())`, [context.userId, event, JSON.stringify(payload)]).catch(() => undefined)
  }
}
