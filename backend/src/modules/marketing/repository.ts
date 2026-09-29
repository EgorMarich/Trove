import { query, databaseEnabled } from '../../infrastructure/database/client'
import type { Audience, Campaign, MarketingEvent } from './types'

const asAudience = (row: any): Audience => ({ id: row.id, name: row.name, description: row.description, rules: row.rules || [], estimatedSize: Number(row.estimated_size || 0), createdAt: row.created_at, updatedAt: row.updated_at })
const asCampaign = (row: any): Campaign => ({ id: row.id, name: row.name, objective: row.objective, audienceId: row.audience_id || undefined, channels: row.channels || [], status: row.status, content: row.content || { title: row.name, body: '' }, createdAt: row.created_at, updatedAt: row.updated_at })

export async function persistEvent(event: MarketingEvent) {
  if (!databaseEnabled) return
  await query(`INSERT INTO marketing_events (id,event_name,user_id,session_id,payload,occurred_at) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING`, [event.id,event.name,event.userId??null,event.sessionId??null,JSON.stringify(event.payload),event.occurredAt])
}

export async function loadAudiences() {
  if (!databaseEnabled) return [] as Audience[]
  const result = await query(`SELECT * FROM marketing_audiences ORDER BY updated_at DESC`)
  return result.rows.map(asAudience)
}
export async function saveAudience(a: Audience) {
  if (!databaseEnabled) return
  await query(`INSERT INTO marketing_audiences (id,name,description,rules,estimated_size,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,description=EXCLUDED.description,rules=EXCLUDED.rules,estimated_size=EXCLUDED.estimated_size,updated_at=EXCLUDED.updated_at`, [a.id,a.name,a.description,JSON.stringify(a.rules),a.estimatedSize,a.createdAt,a.updatedAt])
}
export async function loadCampaigns() {
  if (!databaseEnabled) return [] as Campaign[]
  const result = await query(`SELECT * FROM marketing_campaigns ORDER BY updated_at DESC`)
  return result.rows.map(asCampaign)
}
export async function saveCampaign(c: Campaign) {
  if (!databaseEnabled) return
  await query(`INSERT INTO marketing_campaigns (id,name,objective,audience_id,channels,status,content,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,objective=EXCLUDED.objective,audience_id=EXCLUDED.audience_id,channels=EXCLUDED.channels,status=EXCLUDED.status,content=EXCLUDED.content,updated_at=EXCLUDED.updated_at`, [c.id,c.name,c.objective,c.audienceId??null,JSON.stringify(c.channels),c.status,JSON.stringify(c.content),c.createdAt,c.updatedAt])
}

export async function aggregateMarketing(days = 30) {
  if (!databaseEnabled) return null
  const result = await query(`SELECT event_name, COUNT(*)::int AS count, COUNT(DISTINCT COALESCE(user_id, session_id))::int AS actors FROM marketing_events WHERE occurred_at >= NOW() - ($1::int * INTERVAL '1 day') GROUP BY event_name`, [days])
  const destinations = await query(`SELECT COALESCE(payload->>'destination','Не указано') AS destination, COUNT(*)::int AS views FROM marketing_events WHERE event_name='offer_viewed' AND occurred_at >= NOW() - ($1::int * INTERVAL '1 day') GROUP BY 1 ORDER BY views DESC LIMIT 8`, [days])
  const sessions = await query(`SELECT COUNT(DISTINCT session_id)::int AS visitors FROM marketing_events WHERE session_id IS NOT NULL AND occurred_at >= NOW() - ($1::int * INTERVAL '1 day')`, [days])
  const revenue = await query(`SELECT COALESCE(SUM(revenue),0)::float AS revenue, COUNT(*)::int AS conversions FROM marketing_attribution WHERE occurred_at >= NOW() - ($1::int * INTERVAL '1 day')`, [days])
  return { events: Object.fromEntries(result.rows.map((r: any) => [r.event_name, { count: Number(r.count), actors: Number(r.actors) }])), destinations: destinations.rows.map((r: any) => ({ destination: r.destination, views: Number(r.views) })), visitors: Number(sessions.rows[0]?.visitors || 0), revenue: Number(revenue.rows[0]?.revenue || 0), conversions: Number(revenue.rows[0]?.conversions || 0) }
}
