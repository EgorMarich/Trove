import { databaseEnabled, query } from '../../../infrastructure/database/client'
import { randomToken } from '../../security/crypto'

export type ProviderOrderStatus = 'created' | 'pending' | 'confirmed' | 'cancelled' | 'unknown'

export interface ProviderOrder {
  id: string
  bookingId: string
  providerId: string
  providerOrderId?: string
  providerRequestId?: string
  status: ProviderOrderStatus
  rawResponse?: unknown
  createdAt: string
  updatedAt: string
}

const memory = new Map<string, ProviderOrder>()

function fromRow(row: Record<string, unknown>): ProviderOrder {
  return {
    id: String(row.id), bookingId: String(row.booking_id), providerId: String(row.provider_id),
    providerOrderId: row.provider_order_id == null ? undefined : String(row.provider_order_id),
    providerRequestId: row.provider_request_id == null ? undefined : String(row.provider_request_id),
    status: row.status as ProviderOrderStatus, rawResponse: row.raw_response ?? undefined,
    createdAt: new Date(String(row.created_at)).toISOString(), updatedAt: new Date(String(row.updated_at)).toISOString(),
  }
}

export const providerOrderRepository = {
  async findByBooking(bookingId: string) {
    if (!databaseEnabled) return memory.get(bookingId) ?? null
    const result = await query<Record<string, unknown>>('SELECT * FROM provider_orders WHERE booking_id=$1 LIMIT 1', [bookingId])
    return result.rows[0] ? fromRow(result.rows[0]) : null
  },
  async findByProviderOrder(providerId: string, providerOrderId: string) {
    if (!databaseEnabled) return [...memory.values()].find((x) => x.providerId === providerId && x.providerOrderId === providerOrderId) ?? null
    const result = await query<Record<string, unknown>>('SELECT * FROM provider_orders WHERE provider_id=$1 AND provider_order_id=$2 LIMIT 1', [providerId, providerOrderId])
    return result.rows[0] ? fromRow(result.rows[0]) : null
  },
  async listReconciliationCandidates(limit = 20) {
    if (!databaseEnabled) {
      return [...memory.values()]
        .filter((item) => item.status === 'unknown' || (item.status === 'pending' && Boolean(item.providerOrderId)))
        .slice(0, limit)
        .map((item) => ({ bookingId: item.bookingId, providerId: item.providerId, providerOrderId: item.providerOrderId, userId: '' }))
    }
    const result = await query<Record<string, unknown>>(
      `SELECT po.booking_id, b.user_id, po.provider_id, po.provider_order_id
       FROM provider_orders po
       JOIN bookings b ON b.id = po.booking_id
       WHERE po.status IN ('unknown','pending')
         AND po.provider_order_id IS NOT NULL
       ORDER BY po.updated_at ASC
       LIMIT $1`,
      [limit],
    )
    return result.rows.map((row) => ({
      bookingId: String(row.booking_id),
      userId: String(row.user_id),
      providerId: String(row.provider_id),
      providerOrderId: row.provider_order_id == null ? undefined : String(row.provider_order_id),
    }))
  },

  async upsert(input: Omit<ProviderOrder, 'id' | 'createdAt' | 'updatedAt'>) {
    const existing = await this.findByBooking(input.bookingId)
    const now = new Date().toISOString()
    if (!databaseEnabled) {
      const item: ProviderOrder = { ...input, id: existing?.id ?? `PO-${randomToken(8).toUpperCase()}`, createdAt: existing?.createdAt ?? now, updatedAt: now }
      memory.set(input.bookingId, item); return item
    }
    const id = existing?.id ?? `PO-${randomToken(8).toUpperCase()}`
    const createdAt = existing?.createdAt ?? now
    const result = await query<Record<string, unknown>>(`
      INSERT INTO provider_orders(id,booking_id,provider_id,provider_order_id,provider_request_id,status,raw_response,created_at,updated_at)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)
      ON CONFLICT (booking_id) DO UPDATE SET
        provider_id=EXCLUDED.provider_id,
        provider_order_id=COALESCE(EXCLUDED.provider_order_id, provider_orders.provider_order_id),
        provider_request_id=COALESCE(EXCLUDED.provider_request_id, provider_orders.provider_request_id),
        status=EXCLUDED.status,
        raw_response=COALESCE(EXCLUDED.raw_response, provider_orders.raw_response),
        updated_at=EXCLUDED.updated_at
      RETURNING *`,
      [id,input.bookingId,input.providerId,input.providerOrderId ?? null,input.providerRequestId ?? null,input.status,input.rawResponse ?? null,createdAt,now],
    )
    return fromRow(result.rows[0])
  },
}
