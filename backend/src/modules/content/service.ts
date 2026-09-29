import { databaseEnabled, query } from '../../infrastructure/database/client'
import { randomToken } from '../security/crypto'

const LOCALES = ['ru','en','es','kk'] as const
export type Locale = typeof LOCALES[number]
export const isLocale = (value: string | undefined): value is Locale => LOCALES.includes(value as Locale)

function activePromotion(row: any, locale: Locale) {
  const translations = row.translations || {}
  const copy = translations[locale] || translations.ru || translations.en || {}
  return {
    id: row.id, slug: row.slug, imageUrl: row.image_url, badge: row.badge,
    startsAt: row.starts_at, endsAt: row.ends_at, priority: Number(row.priority || 0),
    title: copy.title || row.slug, subtitle: copy.subtitle || '', description: copy.description || '',
    cta: copy.cta || 'Открыть', ctaUrl: copy.ctaUrl || '/tours',
  }
}

export async function getPublicHomepage(locale: Locale) {
  if (!databaseEnabled) return { locale, promotions: [], blocks: [] }
  const [promos, blocks] = await Promise.all([
    query<Record<string, unknown>>(`SELECT id,slug,image_url,badge,starts_at,ends_at,priority,translations FROM promotions WHERE status='published' AND (starts_at IS NULL OR starts_at<=now()) AND (ends_at IS NULL OR ends_at>=now()) ORDER BY priority DESC, created_at DESC`),
    query<Record<string, unknown>>(`SELECT id,block_type,status,sort_order,locale,title,subtitle,data FROM homepage_blocks WHERE status='published' AND (locale='all' OR locale=$1) ORDER BY sort_order ASC, updated_at DESC`, [locale]),
  ])
  return { locale, promotions: promos.rows.map(row => activePromotion(row, locale)), blocks: blocks.rows.map(row => ({ id: row.id, type: row.block_type, title: row.title, subtitle: row.subtitle, data: row.data || {}, locale: row.locale })) }
}

export async function listPromotions() {
  if (!databaseEnabled) return []
  const r = await query(`SELECT id,slug,status,image_url,badge,starts_at,ends_at,priority,translations,created_at,updated_at FROM promotions ORDER BY priority DESC, updated_at DESC`)
  return r.rows
}
export async function getPromotion(id: string) {
  if (!databaseEnabled) return null
  const r = await query(`SELECT * FROM promotions WHERE id=$1 OR slug=$1 LIMIT 1`, [id])
  return r.rows[0] ?? null
}
export async function savePromotion(input: { id?: string; slug: string; status: 'draft'|'published'|'archived'; imageUrl?: string|null; badge?: string|null; startsAt?: string|null; endsAt?: string|null; priority?: number; translations: Record<string, any>; userId?: string }) {
  if (!databaseEnabled) throw new Error('DATABASE_NOT_CONFIGURED')
  const id = input.id || `promo_${randomToken(10)}`
  const r = await query(`INSERT INTO promotions(id,slug,status,image_url,badge,starts_at,ends_at,priority,translations,created_by,created_at,updated_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,now(),now()) ON CONFLICT(id) DO UPDATE SET slug=$2,status=$3,image_url=$4,badge=$5,starts_at=$6,ends_at=$7,priority=$8,translations=$9::jsonb,updated_at=now() RETURNING *`, [id,input.slug.trim(),input.status,input.imageUrl||null,input.badge||null,input.startsAt||null,input.endsAt||null,input.priority ?? 0,JSON.stringify(input.translations),input.userId||null])
  return r.rows[0]
}
export async function deletePromotion(id: string) { if (!databaseEnabled) return false; const r=await query(`DELETE FROM promotions WHERE id=$1`,[id]); return (r.rowCount||0)>0 }

export async function listHomepageBlocks() { if (!databaseEnabled) return []; const r=await query(`SELECT * FROM homepage_blocks ORDER BY sort_order ASC, updated_at DESC`); return r.rows }
export async function getHomepageBlock(id:string) { if(!databaseEnabled)return null; const r=await query(`SELECT * FROM homepage_blocks WHERE id=$1`,[id]); return r.rows[0]??null }
export async function saveHomepageBlock(input:{id?:string;blockType:string;status:'draft'|'published'|'archived';sortOrder?:number;locale?:string;title?:string|null;subtitle?:string|null;data?:Record<string,unknown>;userId?:string}) {
  if(!databaseEnabled)throw new Error('DATABASE_NOT_CONFIGURED')
  const allowed=['promotion','hero','text','image','tours','guides','destinations']; if(!allowed.includes(input.blockType))throw new Error('INVALID_BLOCK_TYPE')
  const id=input.id||`home_${randomToken(10)}`
  const r=await query(`INSERT INTO homepage_blocks(id,block_type,status,sort_order,locale,title,subtitle,data,created_by,created_at,updated_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,now(),now()) ON CONFLICT(id) DO UPDATE SET block_type=$2,status=$3,sort_order=$4,locale=$5,title=$6,subtitle=$7,data=$8::jsonb,updated_at=now() RETURNING *`,[id,input.blockType,input.status,input.sortOrder??0,input.locale||'all',input.title||null,input.subtitle||null,JSON.stringify(input.data||{}),input.userId||null])
  return r.rows[0]
}
export async function deleteHomepageBlock(id:string){if(!databaseEnabled)return false;const r=await query(`DELETE FROM homepage_blocks WHERE id=$1`,[id]);return (r.rowCount||0)>0}
