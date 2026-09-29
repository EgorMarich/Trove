import { query, databaseEnabled } from '../../infrastructure/database/client'
import { randomToken } from '../security/crypto'
import type { Booking, BookingLifecycleEvent, BookingStatus } from './types'

const bookings = new Map<string, Booking>()
const idempotency = new Map<string, string>()
const events = new Map<string, BookingLifecycleEvent[]>()

function nullableString(value: unknown) { return value == null ? undefined : String(value) }
function iso(value: unknown) { return new Date(String(value)).toISOString() }

function bookingFromRow(row: Record<string, unknown>): Booking {
  return {
    id: String(row.id), userId: String(row.user_id), offerId: String(row.offer_id), providerId: String(row.provider_id),
    title: String(row.title), hotel: String(row.hotel), destination: String(row.destination), departureDate: String(row.departure_date).slice(0, 10),
    duration: Number(row.duration), price: Number(row.price), originalPrice: Number(row.original_price), discount: Number(row.discount),
    promoCode: nullableString(row.promo_code), currency: String(row.currency), passengers: (row.passengers ?? []) as Booking['passengers'],
    contact: (row.contact ?? {}) as Booking['contact'], status: row.status as BookingStatus, paymentStatus: row.payment_status as Booking['paymentStatus'],
    providerOrderId: nullableString(row.provider_order_id), providerRequestId: nullableString(row.provider_request_id),
    providerPreviewToken: nullableString(row.provider_preview_token), providerPreviewExpiresAt: row.provider_preview_expires_at ? iso(row.provider_preview_expires_at) : undefined,
    providerPreviewPrice: row.provider_preview_price == null ? undefined : Number(row.provider_preview_price), providerPreviewCurrency: nullableString(row.provider_preview_currency),
    providerPayment: row.provider_payment ?? undefined, providerCancellationPolicy: row.provider_cancellation_policy ?? undefined, priceSnapshot: row.price_snapshot ? (row.price_snapshot as Booking['priceSnapshot']) : undefined,
    previewToken: nullableString(row.preview_token), previewExpiresAt: row.preview_expires_at ? iso(row.preview_expires_at) : undefined,
    createdAt: iso(row.created_at), updatedAt: iso(row.updated_at),
  }
}

function eventFromRow(row: Record<string, unknown>): BookingLifecycleEvent {
  return { id: String(row.id), bookingId: String(row.booking_id), from: nullableString(row.from_status) as BookingStatus | undefined,
    to: row.to_status as BookingStatus, type: String(row.type), metadata: (row.metadata ?? undefined) as Record<string, unknown> | undefined, createdAt: iso(row.created_at) }
}

export const bookingStore = {
  async find(id: string) {
    if (!databaseEnabled) return bookings.get(id) ?? null
    const result = await query<Record<string, unknown>>('SELECT * FROM bookings WHERE id=$1 LIMIT 1', [id])
    return result.rows[0] ? bookingFromRow(result.rows[0]) : null
  },
  async findByUser(userId: string) {
    if (!databaseEnabled) return [...bookings.values()].filter((x) => x.userId === userId).sort((a,b) => b.createdAt.localeCompare(a.createdAt))
    const result = await query<Record<string, unknown>>('SELECT * FROM bookings WHERE user_id=$1 ORDER BY created_at DESC', [userId])
    return result.rows.map(bookingFromRow)
  },
  async findByIdempotency(userId: string, key: string) {
    if (!databaseEnabled) { const id = idempotency.get(`${userId}:${key}`); return id ? bookings.get(id) ?? null : null }
    const result = await query<Record<string, unknown>>(`SELECT b.* FROM booking_idempotency i JOIN bookings b ON b.id=i.booking_id WHERE i.user_id=$1 AND i.idempotency_key=$2 LIMIT 1`, [userId, key])
    return result.rows[0] ? bookingFromRow(result.rows[0]) : null
  },
  async create(input: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date().toISOString()
    const booking: Booking = { ...input, id: `TRV-${randomToken(6).toUpperCase()}`, createdAt: now, updatedAt: now }
    if (!databaseEnabled) { bookings.set(booking.id, booking); return booking }
    const result = await query<Record<string, unknown>>(`INSERT INTO bookings
      (id,user_id,offer_id,provider_id,title,hotel,destination,departure_date,duration,price,original_price,discount,promo_code,currency,passengers,contact,status,payment_status,provider_order_id,provider_request_id,provider_preview_token,provider_preview_expires_at,provider_preview_price,provider_preview_currency,provider_payment,provider_cancellation_policy,price_snapshot,preview_token,preview_expires_at,created_at,updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31) RETURNING *`,
      [booking.id,booking.userId,booking.offerId,booking.providerId,booking.title,booking.hotel,booking.destination,booking.departureDate,booking.duration,booking.price,booking.originalPrice,booking.discount,booking.promoCode??null,booking.currency,JSON.stringify(booking.passengers),JSON.stringify(booking.contact),booking.status,booking.paymentStatus,booking.providerOrderId??null,booking.providerRequestId??null,booking.providerPreviewToken??null,booking.providerPreviewExpiresAt??null,booking.providerPreviewPrice??null,booking.providerPreviewCurrency??null,booking.providerPayment??null,booking.providerCancellationPolicy??null,booking.priceSnapshot??null,booking.previewToken??null,booking.previewExpiresAt??null,booking.createdAt,booking.updatedAt])
    return bookingFromRow(result.rows[0])
  },
  async rememberIdempotency(userId: string, key: string, bookingId: string) {
    if (!databaseEnabled) { idempotency.set(`${userId}:${key}`, bookingId); return }
    await query(`INSERT INTO booking_idempotency(user_id,idempotency_key,booking_id) VALUES($1,$2,$3) ON CONFLICT (user_id,idempotency_key) DO NOTHING`, [userId,key,bookingId])
  },
  async transition(id: string, to: BookingStatus, type: string, metadata?: Record<string, unknown>) {
    const item = await this.find(id); if (!item) return null
    const now = new Date().toISOString()
    if (!databaseEnabled) {
      const next = { ...item, status: to, updatedAt: now }; bookings.set(id,next)
      const event: BookingLifecycleEvent = { id:`BLE-${randomToken(5).toUpperCase()}`, bookingId:id, from:item.status, to, type, metadata, createdAt:now }
      events.set(id,[...(events.get(id)??[]),event]); return next
    }
    const updated = await query<Record<string, unknown>>('UPDATE bookings SET status=$2,updated_at=$3 WHERE id=$1 RETURNING *',[id,to,now])
    if (!updated.rows[0]) return null
    const eventId=`BLE-${randomToken(5).toUpperCase()}`
    await query(`INSERT INTO booking_events(id,booking_id,from_status,to_status,type,metadata,created_at) VALUES($1,$2,$3,$4,$5,$6,$7)`,[eventId,id,item.status,to,type,metadata??null,now])
    return bookingFromRow(updated.rows[0])
  },
  async patch(id: string, patch: Partial<Booking>) {
    const item = await this.find(id); if (!item) return null
    const next = { ...item, ...patch, updatedAt: new Date().toISOString() }
    if (!databaseEnabled) { bookings.set(id,next); return next }
    const result = await query<Record<string, unknown>>(`UPDATE bookings SET
      provider_order_id=$2,provider_request_id=$3,provider_preview_token=$4,provider_preview_expires_at=$5,provider_preview_price=$6,provider_preview_currency=$7,provider_payment=$8,provider_cancellation_policy=$9,
      price=$10,original_price=$11,discount=$12,promo_code=$13,currency=$14,passengers=$15,contact=$16,payment_status=$17,price_snapshot=$18,preview_token=$19,preview_expires_at=$20,status=$21,updated_at=$22
      WHERE id=$1 RETURNING *`,[id,next.providerOrderId??null,next.providerRequestId??null,next.providerPreviewToken??null,next.providerPreviewExpiresAt??null,next.providerPreviewPrice??null,next.providerPreviewCurrency??null,next.providerPayment??null,next.providerCancellationPolicy??null,next.price,next.originalPrice,next.discount,next.promoCode??null,next.currency,JSON.stringify(next.passengers),JSON.stringify(next.contact),next.paymentStatus,next.priceSnapshot??null,next.previewToken??null,next.previewExpiresAt??null,next.status,next.updatedAt])
    return result.rows[0] ? bookingFromRow(result.rows[0]) : undefined
  },
  async events(id: string) {
    if (!databaseEnabled) return events.get(id) ?? []
    const result = await query<Record<string, unknown>>('SELECT * FROM booking_events WHERE booking_id=$1 ORDER BY created_at ASC',[id])
    return result.rows.map(eventFromRow)
  },
  async cancel(userId: string, id: string) {
    const item = await this.find(id); if (!item || item.userId !== userId) return null
    if (item.status === 'cancelled') return item
    return this.transition(id,'cancelled','BOOKING_CANCELLED')
  },
}
