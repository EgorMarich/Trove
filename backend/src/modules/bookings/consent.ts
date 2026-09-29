import { query, databaseEnabled } from '../../infrastructure/database/client'
import { randomToken } from '../security/crypto'
import type { BookingConsentInput } from './types'

const memory = new Map<string, { bookingId: string; userId: string; termsVersion: string; privacyVersion: string; acceptedAt: string }>()

export async function recordBookingConsent(bookingId: string, userId: string, consent: BookingConsentInput, metadata?: { ipHash?: string; userAgent?: string }) {
  const acceptedAt = new Date().toISOString()
  const item = { bookingId, userId, termsVersion: consent.termsVersion, privacyVersion: consent.privacyVersion, acceptedAt }
  if (!databaseEnabled) {
    memory.set(bookingId, item)
    return item
  }
  const result = await query<Record<string, unknown>>(
    `INSERT INTO booking_consents (id, booking_id, user_id, terms_version, privacy_version, accepted_at, ip_hash, user_agent)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT (booking_id) DO UPDATE SET terms_version=EXCLUDED.terms_version, privacy_version=EXCLUDED.privacy_version, accepted_at=EXCLUDED.accepted_at, ip_hash=EXCLUDED.ip_hash, user_agent=EXCLUDED.user_agent
     RETURNING *`,
    [`BC-${randomToken(8)}`, bookingId, userId, consent.termsVersion, consent.privacyVersion, acceptedAt, metadata?.ipHash ?? null, metadata?.userAgent ?? null],
  )
  return result.rows[0] ? { bookingId: String(result.rows[0].booking_id), userId: String(result.rows[0].user_id), termsVersion: String(result.rows[0].terms_version), privacyVersion: String(result.rows[0].privacy_version), acceptedAt: new Date(String(result.rows[0].accepted_at)).toISOString() } : item
}
