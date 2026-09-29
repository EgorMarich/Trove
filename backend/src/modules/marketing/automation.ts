import { randomUUID } from 'node:crypto'
import { query, databaseEnabled } from '../../infrastructure/database/client'
import type { MarketingEvent, MarketingEventName } from './types'
import { createCampaign } from './store'

export type AutomationStatus = 'draft' | 'active' | 'paused' | 'completed'
export type AutomationAction =
  | { type: 'marketing_message'; channel: 'email' | 'telegram' | 'onsite'; title: string; body: string }
  | { type: 'create_campaign'; name: string; objective: string; channels: Array<'email' | 'telegram' | 'onsite'> }

export interface AutomationCondition {
  event?: MarketingEventName
  minCount?: number
  destination?: string
  withinDays?: number
}

export interface MarketingAutomation {
  id: string
  name: string
  trigger: { event: MarketingEventName; delayMinutes: number }
  conditions: AutomationCondition[]
  actions: AutomationAction[]
  status: AutomationStatus
  createdAt: string
  updatedAt: string
}

export interface AutomationExecution {
  id: string
  automationId: string
  eventId: string
  userId?: string
  sessionId?: string
  runAt: string
  status: 'scheduled' | 'running' | 'completed' | 'failed' | 'skipped'
  result?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

const automations = new Map<string, MarketingAutomation>()
const executions = new Map<string, AutomationExecution>()
let hydrated = false

const now = () => new Date().toISOString()
const dbAutomation = (row: any): MarketingAutomation => ({ id: row.id, name: row.name, trigger: row.trigger, conditions: row.conditions || [], actions: row.actions || [], status: row.status, createdAt: row.created_at, updatedAt: row.updated_at })
const dbExecution = (row: any): AutomationExecution => ({ id: row.id, automationId: row.automation_id, eventId: row.event_id, userId: row.user_id || undefined, sessionId: row.session_id || undefined, runAt: row.run_at, status: row.status, result: row.result || undefined, createdAt: row.created_at, updatedAt: row.updated_at })

const seed = () => {
  if (automations.size) return
  const timestamp = now()
  const items: Omit<MarketingAutomation, 'id'>[] = [
    {
      name: 'Abandoned booking',
      trigger: { event: 'checkout_started', delayMinutes: 120 },
      conditions: [{ event: 'booking_confirmed', minCount: 0, withinDays: 1 }],
      actions: [{ type: 'marketing_message', channel: 'email', title: 'Вы почти закончили бронирование', body: 'Вернитесь к подборке и проверьте актуальную цену.' }],
      status: 'active', createdAt: timestamp, updatedAt: timestamp,
    },
    {
      name: 'High intent destination',
      trigger: { event: 'offer_viewed', delayMinutes: 60 },
      conditions: [{ event: 'offer_viewed', minCount: 2, withinDays: 7 }],
      actions: [{ type: 'marketing_message', channel: 'onsite', title: 'Подобрали варианты', body: 'Посмотрите предложения по направлению, которое вы изучали.' }],
      status: 'active', createdAt: timestamp, updatedAt: timestamp,
    },
    {
      name: 'Returning traveler win-back',
      trigger: { event: 'booking_confirmed', delayMinutes: 259200 },
      conditions: [],
      actions: [{ type: 'create_campaign', name: 'Returning traveler win-back', objective: 'Вернуть путешественников после поездки', channels: ['email', 'onsite'] }],
      status: 'active', createdAt: timestamp, updatedAt: timestamp,
    },
  ]
  for (const item of items) automations.set(randomUUID(), { ...item, id: randomUUID() })
}

export async function hydrateAutomations() {
  if (hydrated) return
  seed()
  if (databaseEnabled) {
    try {
      const [a, e] = await Promise.all([
        query('SELECT * FROM marketing_automations ORDER BY updated_at DESC'),
        query('SELECT * FROM marketing_automation_executions ORDER BY created_at DESC LIMIT 500'),
      ])
      if (a.rows.length) { automations.clear(); a.rows.forEach(row => automations.set(row.id, dbAutomation(row))) }
      else for (const item of automations.values()) await saveAutomation(item)
      executions.clear(); e.rows.forEach(row => executions.set(row.id, dbExecution(row)))
    } catch { /* optional DB */ }
  }
  hydrated = true
}

export async function saveAutomation(item: MarketingAutomation) {
  if (!databaseEnabled) return
  await query(`INSERT INTO marketing_automations (id,name,trigger,conditions,actions,status,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,trigger=EXCLUDED.trigger,conditions=EXCLUDED.conditions,actions=EXCLUDED.actions,status=EXCLUDED.status,updated_at=EXCLUDED.updated_at`,
    [item.id, item.name, JSON.stringify(item.trigger), JSON.stringify(item.conditions), JSON.stringify(item.actions), item.status, item.createdAt, item.updatedAt])
}

export function listAutomations() { return [...automations.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) }
export function listExecutions(limit = 100) { return [...executions.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit) }

export async function createAutomation(input: Omit<MarketingAutomation, 'id' | 'createdAt' | 'updatedAt'>) {
  const timestamp = now(); const item: MarketingAutomation = { ...input, id: randomUUID(), createdAt: timestamp, updatedAt: timestamp }
  automations.set(item.id, item); await saveAutomation(item); return item
}

export async function updateAutomation(id: string, patch: Partial<Pick<MarketingAutomation, 'name' | 'trigger' | 'conditions' | 'actions' | 'status'>>) {
  const current = automations.get(id); if (!current) return undefined
  const updated = { ...current, ...patch, updatedAt: now() }; automations.set(id, updated); await saveAutomation(updated); return updated
}

async function countUserEvents(event: MarketingEventName, actor: { userId?: string; sessionId?: string }, days: number, destination?: string) {
  const since = new Date(Date.now() - days * 86400000).toISOString()
  if (databaseEnabled && (actor.userId || actor.sessionId)) {
    const result = await query(`SELECT COUNT(*)::int AS count FROM marketing_events WHERE event_name=$1 AND occurred_at >= $2 AND (($3::text IS NOT NULL AND user_id=$3) OR ($3::text IS NULL AND $4::text IS NOT NULL AND session_id=$4)) AND ($5::text IS NULL OR payload->>'destination'=$5)`, [event, since, actor.userId ?? null, actor.sessionId ?? null, destination ?? null])
    return Number(result.rows[0]?.count || 0)
  }
  return 0
}

async function conditionsPass(automation: MarketingAutomation, event: MarketingEvent) {
  for (const condition of automation.conditions) {
    if (!condition.event || !condition.minCount || condition.minCount <= 0) continue
    const count = await countUserEvents(condition.event, { userId: event.userId, sessionId: event.sessionId }, condition.withinDays || 30, condition.destination)
    if (count < condition.minCount) return false
  }
  return true
}

export async function scheduleAutomationsForEvent(event: MarketingEvent) {
  await hydrateAutomations()
  const matched = listAutomations().filter(item => item.status === 'active' && item.trigger.event === event.name)
  const created: AutomationExecution[] = []
  for (const automation of matched) {
    if (!(await conditionsPass(automation, event))) continue
    const runAt = new Date(Date.parse(event.occurredAt) + automation.trigger.delayMinutes * 60000).toISOString()
    const execution: AutomationExecution = { id: randomUUID(), automationId: automation.id, eventId: event.id, userId: event.userId, sessionId: event.sessionId, runAt, status: 'scheduled', createdAt: now(), updatedAt: now() }
    executions.set(execution.id, execution); created.push(execution)
    if (databaseEnabled) await query(`INSERT INTO marketing_automation_executions (id,automation_id,event_id,user_id,session_id,run_at,status,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (id) DO NOTHING`, [execution.id, execution.automationId, execution.eventId, execution.userId ?? null, execution.sessionId ?? null, execution.runAt, execution.status, execution.createdAt, execution.updatedAt])
  }
  return created
}

async function persistExecution(execution: AutomationExecution) {
  if (!databaseEnabled) return
  await query(`UPDATE marketing_automation_executions SET status=$2,result=$3,updated_at=$4 WHERE id=$1`, [execution.id, execution.status, JSON.stringify(execution.result || {}), execution.updatedAt])
}

export async function runDueAutomations(limit = 50) {
  await hydrateAutomations()
  const due = [...executions.values()].filter(item => item.status === 'scheduled' && Date.parse(item.runAt) <= Date.now()).sort((a,b) => a.runAt.localeCompare(b.runAt)).slice(0, limit)
  const results: AutomationExecution[] = []
  for (const execution of due) {
    const automation = automations.get(execution.automationId)
    if (!automation || automation.status !== 'active') { execution.status = 'skipped'; execution.updatedAt = now(); await persistExecution(execution); results.push(execution); continue }
    execution.status = 'running'; execution.updatedAt = now(); await persistExecution(execution)
    try {
      const actionResults: Record<string, unknown>[] = []
      for (const action of automation.actions) {
        if (action.type === 'create_campaign') {
          const campaign = createCampaign({ name: action.name, objective: action.objective, channels: action.channels, status: 'draft', content: { title: action.name, subject: action.name, body: `Автоматизация Trove: ${action.objective}`, cta: 'Смотреть предложения' } })
          actionResults.push({ type: action.type, campaignId: campaign.id, status: 'draft' })
        } else {
          // External delivery is intentionally connector-gated. The execution is recorded as queued, never falsely reported as sent.
          actionResults.push({ type: action.type, channel: action.channel, status: 'queued', userId: execution.userId ?? null, title: action.title })
        }
      }
      execution.status = 'completed'; execution.result = { actions: actionResults }; execution.updatedAt = now()
    } catch (error) { execution.status = 'failed'; execution.result = { error: error instanceof Error ? error.message : 'AUTOMATION_FAILED' }; execution.updatedAt = now() }
    await persistExecution(execution); results.push(execution)
  }
  return results
}
