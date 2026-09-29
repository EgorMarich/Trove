import { query, databaseEnabled } from '../../infrastructure/database/client'
import type { MarketingEvent } from './types'

type Segment = 'cold' | 'explorer' | 'interested' | 'high_intent'
type Profile = {
  userId: string
  intentScore: number
  intentSegment: Segment
  favoriteDestinations: string[]
  preferredHotelClass?: string
  budgetMin?: number
  budgetMax?: number
  preferredDurationMin?: number
  preferredDurationMax?: number
  lastActivityAt?: string
  eventCount: number
  updatedAt: string
}

const profiles = new Map<string, Profile>()
const weights: Record<string, number> = {
  search_submitted: 5,
  offer_viewed: 3,
  offer_favorited: 10,
  checkout_started: 30,
  payment_started: 20,
  booking_confirmed: 50,
  guide_viewed: 2,
  guide_read: 2,
  campaign_clicked: 6,
  campaign_opened: 3,
}

function segment(score: number): Segment {
  if (score >= 80) return 'high_intent'
  if (score >= 50) return 'interested'
  if (score >= 20) return 'explorer'
  return 'cold'
}

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)))
}

function destinationOf(event: MarketingEvent) {
  const p = event.payload
  const d = [p.destination, p.country, p.city].find(v => typeof v === 'string' && v.trim())
  return typeof d === 'string' ? d.trim() : undefined
}

function upsertMemory(event: MarketingEvent) {
  if (!event.userId) return
  const now = new Date().toISOString()
  const p = profiles.get(event.userId) || {
    userId: event.userId,
    intentScore: 0,
    intentSegment: 'cold' as Segment,
    favoriteDestinations: [],
    eventCount: 0,
    updatedAt: now,
  }

  const decay = p.lastActivityAt
    ? Math.max(0, Math.floor((Date.now() - new Date(p.lastActivityAt).getTime()) / 86400000)) * 0.5
    : 0

  p.intentScore = clamp(p.intentScore - decay + (weights[event.name] || 0))
  p.intentSegment = segment(p.intentScore)
  p.eventCount++
  p.lastActivityAt = event.occurredAt
  p.updatedAt = now

  const d = destinationOf(event)
  if (d && !p.favoriteDestinations.includes(d)) {
    p.favoriteDestinations = [d, ...p.favoriteDestinations].slice(0, 5)
  }

  const payload = event.payload
  if (typeof payload.hotelClass === 'string') p.preferredHotelClass = payload.hotelClass
  if (typeof payload.price === 'number') {
    p.budgetMax = p.budgetMax ? Math.round((p.budgetMax + payload.price) / 2) : payload.price
  }
  if (typeof payload.duration === 'number') {
    p.preferredDurationMin = p.preferredDurationMin
      ? Math.min(p.preferredDurationMin, payload.duration)
      : payload.duration
    p.preferredDurationMax = p.preferredDurationMax
      ? Math.max(p.preferredDurationMax, payload.duration)
      : payload.duration
  }

  profiles.set(event.userId, p)
  return p
}

export async function processCustomerEvent(event: MarketingEvent) {
  const p = upsertMemory(event)
  if (!databaseEnabled || !p) return p

  await query(
    `INSERT INTO customer_profiles (user_id,intent_score,intent_segment,favorite_destinations,preferred_hotel_class,budget_min,budget_max,preferred_duration_min,preferred_duration_max,last_activity_at,event_count,updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     ON CONFLICT(user_id) DO UPDATE SET
       intent_score=EXCLUDED.intent_score,
       intent_segment=EXCLUDED.intent_segment,
       favorite_destinations=EXCLUDED.favorite_destinations,
       preferred_hotel_class=EXCLUDED.preferred_hotel_class,
       budget_min=EXCLUDED.budget_min,
       budget_max=EXCLUDED.budget_max,
       preferred_duration_min=EXCLUDED.preferred_duration_min,
       preferred_duration_max=EXCLUDED.preferred_duration_max,
       last_activity_at=EXCLUDED.last_activity_at,
       event_count=EXCLUDED.event_count,
       updated_at=EXCLUDED.updated_at`,
    [
      p.userId,
      p.intentScore,
      p.intentSegment,
      JSON.stringify(p.favoriteDestinations),
      p.preferredHotelClass ?? null,
      p.budgetMin ?? null,
      p.budgetMax ?? null,
      p.preferredDurationMin ?? null,
      p.preferredDurationMax ?? null,
      p.lastActivityAt ?? null,
      p.eventCount,
      p.updatedAt,
    ],
  )

  const d = destinationOf(event)
  if (d) {
    await query(
      `INSERT INTO customer_destination_interest(user_id,destination,score,event_count,last_activity_at)
       VALUES($1,$2,$3,1,$4)
       ON CONFLICT(user_id,destination) DO UPDATE SET
         score=customer_destination_interest.score+$3,
         event_count=customer_destination_interest.event_count+1,
         last_activity_at=EXCLUDED.last_activity_at`,
      [p.userId, d, weights[event.name] || 1, event.occurredAt],
    )
  }
  return p
}

export async function listCustomerProfiles(opts: { segment?: string; destination?: string; limit?: number } = {}) {
  if (databaseEnabled) {
    const clauses: string[] = []
    const params: any[] = []
    if (opts.segment) {
      params.push(opts.segment)
      clauses.push(`intent_segment=$${params.length}`)
    }
    if (opts.destination) {
      params.push(opts.destination)
      clauses.push(`favorite_destinations @> $${params.length}::jsonb`)
    }
    params.push(Math.min(opts.limit || 50, 200))
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
    const r = await query(`SELECT * FROM customer_profiles ${where} ORDER BY intent_score DESC LIMIT $${params.length}`, params)
    return r.rows.map(row => ({
      userId: row.user_id,
      intentScore: Number(row.intent_score),
      intentSegment: row.intent_segment,
      favoriteDestinations: row.favorite_destinations || [],
      preferredHotelClass: row.preferred_hotel_class,
      budgetMin: row.budget_min ? Number(row.budget_min) : undefined,
      budgetMax: row.budget_max ? Number(row.budget_max) : undefined,
      preferredDurationMin: row.preferred_duration_min ? Number(row.preferred_duration_min) : undefined,
      preferredDurationMax: row.preferred_duration_max ? Number(row.preferred_duration_max) : undefined,
      lastActivityAt: row.last_activity_at,
      eventCount: Number(row.event_count),
      updatedAt: row.updated_at,
    }))
  }
  return [...profiles.values()].sort((a, b) => b.intentScore - a.intentScore).slice(0, opts.limit || 50)
}

export async function getCustomerProfile(userId: string) {
  const rows = await listCustomerProfiles({ limit: 200 })
  return rows.find(x => x.userId === userId) || null
}

export async function getIntentOverview() {
  const rows = await listCustomerProfiles({ limit: 200 })
  const segments = Object.fromEntries(
    (['cold', 'explorer', 'interested', 'high_intent'] as Segment[]).map(s => [
      s,
      rows.filter(x => x.intentSegment === s).length,
    ]),
  )
  const destinations = new Map<string, number>()
  rows.forEach(p => {
    p.favoriteDestinations.forEach((d, i) => {
      destinations.set(d, (destinations.get(d) || 0) + (5 - i))
    })
  })
  return {
    total: rows.length,
    averageIntent: rows.length ? Math.round(rows.reduce((sum, p) => sum + p.intentScore, 0) / rows.length) : 0,
    segments,
    topDestinations: [...destinations.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([destination, score]) => ({ destination, score })),
  }
}
