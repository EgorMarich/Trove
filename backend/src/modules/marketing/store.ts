import { randomUUID } from 'node:crypto'
import type { Audience, Campaign, MarketingEvent, MarketingEventName } from './types'
import { loadAudiences, loadCampaigns, saveAudience, saveCampaign } from './repository'

const events: MarketingEvent[] = []
const audiences = new Map<string, Audience>()
const campaigns = new Map<string, Campaign>()
let hydrated = false

const seed = () => {
  if (audiences.size) return
  const now = new Date().toISOString()
  ;[
    { name: 'Высокий интерес к Турции', description: 'Пользователи, которые несколько раз взаимодействовали с предложениями Турции.', rules: [{ event: 'offer_viewed' as const, minCount: 2, destination: 'Турция', days: 30 }], estimatedSize: 0 },
    { name: 'Брошенное бронирование', description: 'Начали checkout, но не завершили бронирование.', rules: [{ event: 'checkout_started' as const, minCount: 1, days: 2 }], estimatedSize: 0 },
    { name: 'Возвращающиеся путешественники', description: 'Пользователи с подтверждённым бронированием, вернувшиеся в сервис.', rules: [{ event: 'booking_confirmed' as const, minCount: 1, days: 180 }], estimatedSize: 0 },
  ].forEach((item) => { const id = randomUUID(); audiences.set(id, { ...item, id, createdAt: now, updatedAt: now }) })
}
export async function hydrateMarketing() {
  if (hydrated) return
  seed()
  if (process.env.DATABASE_URL) {
    try {
      const [dbAudiences, dbCampaigns] = await Promise.all([loadAudiences(), loadCampaigns()])
      if (dbAudiences.length) { audiences.clear(); dbAudiences.forEach(a => audiences.set(a.id, a)) } else { for (const audience of audiences.values()) await saveAudience(audience) }
      dbCampaigns.forEach(c => campaigns.set(c.id, c))
    } catch { /* database remains optional during local development */ }
  }
  hydrated = true
}
export function recordEvent(input: Omit<MarketingEvent,'id'|'occurredAt'>) { const event={...input,id:randomUUID(),occurredAt:new Date().toISOString()}; events.push(event); if(events.length>20000)events.splice(0,events.length-20000); return event }
export function listEvents(limit=100){return events.slice(-limit).reverse()}
export function listAudiences(){return [...audiences.values()]}
export function listCampaigns(){return [...campaigns.values()].sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt))}
export function createAudience(input: Omit<Audience,'id'|'createdAt'|'updatedAt'|'estimatedSize'>){const now=new Date().toISOString();const audience:Audience={...input,id:randomUUID(),estimatedSize:0,createdAt:now,updatedAt:now};audiences.set(audience.id,audience);void saveAudience(audience);return audience}
export function createCampaign(input: Omit<Campaign,'id'|'createdAt'|'updatedAt'>){const now=new Date().toISOString();const campaign:Campaign={...input,id:randomUUID(),createdAt:now,updatedAt:now};campaigns.set(campaign.id,campaign);void saveCampaign(campaign);return campaign}
export function updateCampaign(id:string,patch:Partial<Pick<Campaign,'status'|'content'|'channels'|'audienceId'>>){const existing=campaigns.get(id);if(!existing)return undefined;const updated={...existing,...patch,updatedAt:new Date().toISOString()};campaigns.set(id,updated);void saveCampaign(updated);return updated}
export function countEvents(name:MarketingEventName){return events.filter(e=>e.name===name).length}
export function countDistinctSessions(){return new Set(events.map(e=>e.sessionId).filter(Boolean)).size}
