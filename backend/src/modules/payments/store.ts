import { databaseEnabled, query, withTransaction } from '../../infrastructure/database/client'
import { randomToken } from '../security/crypto'
import type { PaymentEvent, PaymentIntent, PaymentIntentStatus } from './types'

const intents = new Map<string, PaymentIntent>()
const events = new Map<string, PaymentEvent[]>()
const byBooking = new Map<string, string>()

function nullableString(value: unknown) { return value == null ? undefined : String(value) }
function iso(value: unknown) { return new Date(String(value)).toISOString() }

function intentFromRow(row: Record<string, unknown>): PaymentIntent {
  return {
    id: String(row.id),
    bookingId: String(row.booking_id),
    userId: String(row.user_id),
    amount: Number(row.amount),
    currency: String(row.currency),
    status: row.status as PaymentIntentStatus,
    provider: row.provider as PaymentIntent['provider'],
    clientSecret: String(row.client_secret),
    providerPaymentId: nullableString(row.provider_payment_id),
    checkoutUrl: nullableString(row.checkout_url),
    failureReason: nullableString(row.failure_reason),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
    expiresAt: iso(row.expires_at),
  }
}

function eventFromRow(row: Record<string, unknown>): PaymentEvent {
  return {
    id: String(row.id),
    paymentIntentId: String(row.payment_intent_id),
    type: String(row.type),
    status: row.status as PaymentIntentStatus,
    metadata: row.metadata ? (row.metadata as Record<string, unknown>) : undefined,
    createdAt: iso(row.created_at),
  }
}

export const paymentStore = {
  async find(id: string) {
    if (!databaseEnabled) return intents.get(id) ?? null
    const result = await query<Record<string, unknown>>('SELECT * FROM payment_intents WHERE id=$1 LIMIT 1', [id])
    return result.rows[0] ? intentFromRow(result.rows[0]) : null
  },

  async findByBooking(bookingId: string) {
    if (!databaseEnabled) { const id = byBooking.get(bookingId); return id ? intents.get(id) ?? null : null }
    const result = await query<Record<string, unknown>>('SELECT * FROM payment_intents WHERE booking_id=$1 LIMIT 1', [bookingId])
    return result.rows[0] ? intentFromRow(result.rows[0]) : null
  },

  async create(input: Omit<PaymentIntent, 'id' | 'createdAt' | 'updatedAt' | 'clientSecret'>) {
    const now = new Date().toISOString()
    const intent: PaymentIntent = { ...input, checkoutUrl: undefined, id: `PI-${randomToken(8).toUpperCase()}`, clientSecret: `trove_demo_${randomToken(18)}`, createdAt: now, updatedAt: now }
    if (!databaseEnabled) {
      intents.set(intent.id, intent); byBooking.set(intent.bookingId, intent.id); return intent
    }
    const result = await query<Record<string, unknown>>(
      `INSERT INTO payment_intents (id,booking_id,user_id,amount,currency,status,provider,client_secret,provider_payment_id,checkout_url,failure_reason,created_at,updated_at,expires_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [intent.id,intent.bookingId,intent.userId,intent.amount,intent.currency,intent.status,intent.provider,intent.clientSecret,intent.providerPaymentId??null,intent.checkoutUrl??null,intent.failureReason??null,intent.createdAt,intent.updatedAt,intent.expiresAt],
    )
    return intentFromRow(result.rows[0])
  },

  async listReconciliationCandidates(limit = 20) {
    if (!databaseEnabled) {
      return [...intents.values()]
        .filter((item) => Boolean(item.providerPaymentId) && ['processing', 'unknown'].includes(item.status))
        .slice(0, limit)
    }
    const result = await query<Record<string, unknown>>(
      `SELECT * FROM payment_intents
       WHERE provider_payment_id IS NOT NULL
         AND status IN ('processing','unknown')
         AND expires_at > NOW() - INTERVAL '24 hours'
       ORDER BY updated_at ASC
       LIMIT $1`,
      [limit],
    )
    return result.rows.map(intentFromRow)
  },

  async transition(id: string, status: PaymentIntentStatus, type: string, metadata?: Record<string, unknown>, eventId?: string) {
    const item = await this.find(id); if (!item) return null
    const now = new Date().toISOString()
    const event: PaymentEvent = { id: eventId ?? `PE-${randomToken(6).toUpperCase()}`, paymentIntentId: id, type, status, metadata, createdAt: now }
    if (!databaseEnabled) {
      const next = { ...item, status, updatedAt: now }
      intents.set(id, next); events.set(id, [...(events.get(id) ?? []), event]); return next
    }
    return withTransaction(async (client) => {
      const updated = await client.query<Record<string, unknown>>('UPDATE payment_intents SET status=$2,updated_at=$3 WHERE id=$1 RETURNING *',[id,status,now])
      if (!updated.rows[0]) return null
      await client.query(
        `INSERT INTO payment_events(id,payment_intent_id,type,status,metadata,created_at) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING`,
        [event.id,id,type,status,metadata??null,now],
      )
      return intentFromRow(updated.rows[0])
    })
  },

  async patch(id: string, patch: Partial<PaymentIntent>) {
    const item = await this.find(id); if (!item) return null
    const next = { ...item, ...patch, updatedAt: new Date().toISOString() }
    if (!databaseEnabled) { intents.set(id, next); return next }
    const result = await query<Record<string, unknown>>(
      `UPDATE payment_intents SET amount=$2,currency=$3,status=$4,provider=$5,client_secret=$6,provider_payment_id=$7,checkout_url=$8,failure_reason=$9,updated_at=$10,expires_at=$11 WHERE id=$1 RETURNING *`,
      [id,next.amount,next.currency,next.status,next.provider,next.clientSecret,next.providerPaymentId??null,next.checkoutUrl??null,next.failureReason??null,next.updatedAt,next.expiresAt],
    )
    return result.rows[0] ? intentFromRow(result.rows[0]) : null
  },

  async hasEvent(id: string) {
    if (!databaseEnabled) return [...events.values()].some((items) => items.some((event) => event.id === id))
    const result = await query<{ exists: boolean }>('SELECT EXISTS(SELECT 1 FROM payment_events WHERE id=$1) AS exists',[id])
    return Boolean(result.rows[0]?.exists)
  },

  async events(id: string) {
    if (!databaseEnabled) return events.get(id) ?? []
    const result = await query<Record<string, unknown>>('SELECT * FROM payment_events WHERE payment_intent_id=$1 ORDER BY created_at ASC',[id])
    return result.rows.map(eventFromRow)
  },
}
