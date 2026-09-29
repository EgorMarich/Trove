import { query } from '../../infrastructure/database/client'

export type SecurityEventType =
  | 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'LOGOUT' | 'REGISTERED' | 'CONTACT_VERIFIED'
  | 'PASSWORD_RESET_REQUESTED' | 'PASSWORD_RESET_COMPLETED' | 'SESSION_REVOKED'
  | 'BOOKING_CREATED' | 'PAYMENT_INTENT_CREATED' | 'BOOKING_CONFIRMED' | 'SECURITY_RATE_LIMITED'
  | 'ADMIN_GUIDE_SAVED' | 'ADMIN_GUIDE_DELETED' | 'ADMIN_USER_UPDATED' | 'ADMIN_TOUR_UPDATED'

export interface SecurityEvent { type: SecurityEventType; userId?: string; createdAt: string; ip?: string; metadata?: Record<string, unknown> }

export const securityEvents: SecurityEvent[] = []

export async function audit(event: Omit<SecurityEvent, 'createdAt'>) {
  const item = { ...event, createdAt: new Date().toISOString() }
  securityEvents.push(item)
  if (securityEvents.length > 5000) securityEvents.shift()

  try {
    await query(
      `INSERT INTO audit_events (id, type, user_id, ip_hash, metadata, created_at)
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4::jsonb, $5)`,
      [item.type, item.userId ?? null, item.ip ?? null, JSON.stringify(item.metadata ?? {}), item.createdAt],
    )
  } catch {
    // Audit must never break the business request. The in-memory buffer remains a local fallback.
  }
}
