import { query, databaseEnabled } from '../../infrastructure/database/client'
import { searchTours } from '../search/service'
import { providerById } from '../providers'
import { getProviderHealth } from '../providers/registry'
import { randomToken } from '../security/crypto'
import { authRepository } from '../auth/repository'
import type { UserRole } from '../auth/types'

export { listPromotions, getPromotion, savePromotion, deletePromotion, listHomepageBlocks, getHomepageBlock, saveHomepageBlock, deleteHomepageBlock } from '../content/service'
export function canAccessAdmin(role: UserRole | undefined) { return role === 'admin' || role === 'manager' || role === 'editor' }
export function canManageUsers(role: UserRole | undefined) { return role === 'admin' }
export function canManageGuides(role: UserRole | undefined) { return role === 'admin' || role === 'editor' }
export function canManageTours(role: UserRole | undefined) { return role === 'admin' || role === 'manager' }

export async function getDashboard() {
  if (!databaseEnabled) return { users:{total:0,newToday:0,newThisMonth:0}, bookings:{total:0,today:0,revenue:0,confirmed:0}, activity:{}, popularDestinations:[], recentBookings:[] }
  const [users, bookings, activity, destinations, recent] = await Promise.all([
    query<{total:string;new_today:string;new_month:string}>(`SELECT count(*)::text total,count(*) FILTER (WHERE created_at >= current_date)::text new_today,count(*) FILTER (WHERE created_at >= date_trunc('month',now()))::text new_month FROM users`),
    query<{total:string;today:string;revenue:string;confirmed:string}>(`SELECT count(*)::text total,count(*) FILTER (WHERE created_at >= current_date)::text today,coalesce(sum(price) FILTER (WHERE payment_status IN ('paid','succeeded','confirmed')),0)::text revenue,count(*) FILTER (WHERE status IN ('confirmed','provider_booking','completed'))::text confirmed FROM bookings`),
    query<{event:string;count:string}>(`SELECT event,count(*)::text count FROM user_activity_events WHERE created_at >= now()-interval '30 days' GROUP BY event ORDER BY count(*) DESC`),
    query<{destination:string;count:string}>(`SELECT destination,count(*)::text count FROM bookings GROUP BY destination ORDER BY count(*) DESC LIMIT 8`),
    query<Record<string,unknown>>(`SELECT b.id,b.title,b.destination,b.price,b.currency,b.status,b.payment_status,b.created_at,u.first_name,u.last_name,u.email FROM bookings b JOIN users u ON u.id=b.user_id ORDER BY b.created_at DESC LIMIT 8`),
  ])
  return {
    users:{total:Number(users.rows[0]?.total??0),newToday:Number(users.rows[0]?.new_today??0),newThisMonth:Number(users.rows[0]?.new_month??0)},
    bookings:{total:Number(bookings.rows[0]?.total??0),today:Number(bookings.rows[0]?.today??0),revenue:Number(bookings.rows[0]?.revenue??0),confirmed:Number(bookings.rows[0]?.confirmed??0)},
    activity:Object.fromEntries(activity.rows.map(r=>[r.event,Number(r.count)])),
    popularDestinations:destinations.rows.map(r=>({destination:r.destination,count:Number(r.count)})),
    recentBookings:recent.rows.map(r=>({...r,price:Number(r.price),createdAt:r.created_at})),
  }
}


export async function getDashboardTrends(days = 14) {
  if (!databaseEnabled) return { labels: [], users: [], bookings: [], revenue: [] }
  const safeDays = Math.min(90, Math.max(7, days))
  const [users, bookings] = await Promise.all([
    query<{day:string;count:string}>(`SELECT to_char(d.day,'DD.MM') day, count(u.id)::text count FROM generate_series(current_date - ($1::int - 1), current_date, interval '1 day') d(day) LEFT JOIN users u ON u.created_at::date=d.day GROUP BY d.day ORDER BY d.day`, [safeDays]),
    query<{day:string;count:string;revenue:string}>(`SELECT to_char(d.day,'DD.MM') day, count(b.id)::text count, coalesce(sum(b.price) FILTER (WHERE b.payment_status IN ('paid','succeeded','confirmed')),0)::text revenue FROM generate_series(current_date - ($1::int - 1), current_date, interval '1 day') d(day) LEFT JOIN bookings b ON b.created_at::date=d.day GROUP BY d.day ORDER BY d.day`, [safeDays]),
  ])
  return { labels: users.rows.map(r=>r.day), users: users.rows.map(r=>Number(r.count)), bookings: bookings.rows.map(r=>Number(r.count)), revenue: bookings.rows.map(r=>Number(r.revenue)) }
}

export async function updateUserAdmin(id:string, patch:{status?:'active'|'suspended';role?:'user'|'admin'|'manager'|'editor'}) {
  const user = await authRepository.findUserById(id)
  if (!user) return null
  if (patch.status) user.status = patch.status
  if (patch.role) user.role = patch.role
  return authRepository.updateUser(user)
}

export async function getBookingDetails(id:string) {
  if (!databaseEnabled) return null
  const [booking, events, attempts] = await Promise.all([
    query<Record<string,unknown>>(`SELECT b.*,u.first_name,u.last_name,u.email,u.phone FROM bookings b JOIN users u ON u.id=b.user_id WHERE b.id=$1`,[id]),
    query<Record<string,unknown>>(`SELECT id,from_status,to_status,type,metadata,created_at FROM booking_events WHERE booking_id=$1 ORDER BY created_at DESC`,[id]),
    query<Record<string,unknown>>(`SELECT id,provider_id,attempt,status,provider_request_id,error_code,error_message,next_retry_at,created_at,updated_at FROM booking_attempts WHERE booking_id=$1 ORDER BY attempt DESC`,[id]),
  ])
  return booking.rows[0] ? { booking: booking.rows[0], events: events.rows, attempts: attempts.rows } : null
}

export async function listUsers(params:{search?:string;status?:string;role?:string;page?:number;limit?:number}) {
  const page=Math.max(1,params.page??1), limit=Math.min(100,Math.max(10,params.limit??25)), offset=(page-1)*limit
  if(!databaseEnabled)return {items:[],page,limit,total:0}
  const values:unknown[]=[]; const where:string[]=[]
  if(params.search){values.push(`%${params.search.trim()}%`);where.push(`(u.first_name ILIKE $${values.length} OR coalesce(u.last_name,'') ILIKE $${values.length} OR coalesce(u.email,'') ILIKE $${values.length} OR coalesce(u.phone,'') ILIKE $${values.length})`)}
  if(params.status&&['active','suspended'].includes(params.status)){values.push(params.status);where.push(`u.status=$${values.length}`)}
  if(params.role&&['user','admin','manager','editor'].includes(params.role)){values.push(params.role);where.push(`u.role=$${values.length}`)}
  const clause=where.length?`WHERE ${where.join(' AND ')}`:''
  const count=await query<{count:string}>(`SELECT count(*)::text count FROM users u ${clause}`,values)
  const dataValues=[...values,limit,offset]
  const result=await query<Record<string,unknown>>(`SELECT u.id,u.first_name,u.last_name,u.email,u.phone,u.status,u.role,u.created_at,count(DISTINCT b.id)::int bookings_count,coalesce(sum(b.price) FILTER (WHERE b.payment_status IN ('paid','succeeded','confirmed')),0)::numeric total_spent FROM users u LEFT JOIN bookings b ON b.user_id=u.id ${clause} GROUP BY u.id ORDER BY u.created_at DESC LIMIT $${dataValues.length-1} OFFSET $${dataValues.length}`,dataValues)
  return {items:result.rows.map(r=>({id:r.id,firstName:r.first_name,lastName:r.last_name,email:r.email,phone:r.phone,status:r.status,role:r.role,createdAt:r.created_at,bookingsCount:Number(r.bookings_count),totalSpent:Number(r.total_spent)})),page,limit,total:Number(count.rows[0]?.count??0)}
}

export async function getUserDetails(id:string){
  if(!databaseEnabled)return null
  const [user,bookings,activity]=await Promise.all([
    query<Record<string,unknown>>(`SELECT id,first_name,last_name,email,phone,status,role,email_verified_at,phone_verified_at,created_at,updated_at FROM users WHERE id=$1`,[id]),
    query<Record<string,unknown>>(`SELECT id,title,hotel,destination,departure_date,duration,price,original_price,discount,currency,status,payment_status,created_at FROM bookings WHERE user_id=$1 ORDER BY created_at DESC`,[id]),
    query<Record<string,unknown>>(`SELECT event,payload,created_at FROM user_activity_events WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100`,[id]),
  ])
  return user.rows[0]?{user:user.rows[0],bookings:bookings.rows,activity:activity.rows}:null
}

export async function listTours(params:Record<string,string|undefined>){
  return searchTours({search:params.search,departure:params.departure,destination:params.destination,dateFrom:params.dateFrom,dateTo:params.dateTo,priceFrom:params.priceFrom?Number(params.priceFrom):undefined,priceTo:params.priceTo?Number(params.priceTo):undefined,rating:params.rating?Number(params.rating):undefined,duration:params.duration as never,sort:(params.sort as never)||'recommended',order:(params.order as never)||'asc',page:params.page?Number(params.page):1,limit:params.limit?Number(params.limit):24,guests:params.guests?Number(params.guests):undefined},providers)
}



export async function listAdminTours(params: Record<string,string|undefined>) {
  const result = await listTours(params)
  if (!databaseEnabled || !result.items.length) return result
  const keys = result.items.map((tour:any) => [tour.provider || tour.providerId, tour.id]).filter((v:any[]) => v[0] && v[1])
  if (!keys.length) return result
  const values: string[] = []
  const pairs = keys.map(([providerId, offerId]: string[], index:number) => {
    values.push(providerId, offerId)
    const n=index*2
    return `($${n+1},$${n+2})`
  }).join(',')
  const overrides = await query<Record<string,unknown>>(
    `SELECT provider_id,offer_id,is_active,is_featured,title_override,description_override,badge_override,tags_override,admin_notes,updated_by,updated_at
     FROM admin_tour_overrides WHERE (provider_id,offer_id) IN (${pairs})`, values)
  const map = new Map(overrides.rows.map(row => [`${row.provider_id}:${row.offer_id}`, row]))
  return {
    ...result,
    items: result.items
      .map((tour:any) => {
        const override = map.get(`${tour.provider || tour.providerId}:${tour.id}`) as any
        return override ? {
          ...tour,
          admin: override,
          title: override.title_override || tour.title,
          badge: override.badge_override || tour.badge,
          tags: override.tags_override || tour.tags,
          adminActive: Boolean(override.is_active),
          adminFeatured: Boolean(override.is_featured),
        } : { ...tour, adminActive: true, adminFeatured: false }
      })
      .filter((tour:any) => tour.adminActive !== false),
  }
}

export async function getAdminTour(providerId:string, offerId:string) {
  const provider = providerById(providerId)
  if (!provider) return null
  const offer = await provider.getOffer(offerId)
  if (!offer) return null
  let admin = null
  if (databaseEnabled) {
    const r = await query<Record<string,unknown>>(
      `SELECT provider_id,offer_id,is_active,is_featured,title_override,description_override,badge_override,tags_override,admin_notes,updated_by,created_at,updated_at
       FROM admin_tour_overrides WHERE provider_id=$1 AND offer_id=$2`, [providerId, offerId])
    admin = r.rows[0] ?? null
  }
  return { offer, admin }
}

export async function saveAdminTour(input:{providerId:string;offerId:string;isActive?:boolean;isFeatured?:boolean;titleOverride?:string|null;descriptionOverride?:string|null;badgeOverride?:string|null;tagsOverride?:string[]|null;adminNotes?:string|null;updatedBy?:string}) {
  if (!databaseEnabled) throw new Error('DATABASE_NOT_CONFIGURED')
  const r = await query<Record<string,unknown>>(
    `INSERT INTO admin_tour_overrides(provider_id,offer_id,is_active,is_featured,title_override,description_override,badge_override,tags_override,admin_notes,updated_by,created_at,updated_at)
     VALUES($1,$2,COALESCE($3,true),COALESCE($4,false),$5,$6,$7,$8::jsonb,$9,$10,now(),now())
     ON CONFLICT(provider_id,offer_id) DO UPDATE SET
       is_active=COALESCE($3,admin_tour_overrides.is_active), is_featured=COALESCE($4,admin_tour_overrides.is_featured),
       title_override=$5, description_override=$6, badge_override=$7, tags_override=$8::jsonb,
       admin_notes=$9, updated_by=$10, updated_at=now()
     RETURNING *`,
    [input.providerId,input.offerId,input.isActive ?? null,input.isFeatured ?? null,input.titleOverride ?? null,input.descriptionOverride ?? null,input.badgeOverride ?? null,input.tagsOverride ? JSON.stringify(input.tagsOverride) : null,input.adminNotes ?? null,input.updatedBy ?? null],
  )
  return r.rows[0]
}

export async function listAdminProviders() {
  const health = await getProviderHealth()
  return health.map(item => ({
    ...item,
    enabled: item.status !== 'disabled',
  }))
}

export async function listGuides(){ if(!databaseEnabled)return []; const r=await query<Record<string,unknown>>(`SELECT id,slug,title,excerpt,cover_url,status,author_id,seo_title,seo_description,published_at,created_at,updated_at FROM guide_articles ORDER BY updated_at DESC`); return r.rows }
export async function getGuide(id:string){ if(!databaseEnabled)return null; const r=await query<Record<string,unknown>>(`SELECT * FROM guide_articles WHERE id=$1 OR slug=$1 LIMIT 1`,[id]); return r.rows[0]??null }
export async function saveGuide(input:{id?:string;slug:string;title:string;excerpt?:string;coverUrl?:string;content:string;status:'draft'|'published'|'archived';authorId?:string;seoTitle?:string;seoDescription?:string}){
  if(!databaseEnabled)throw new Error('DATABASE_NOT_CONFIGURED'); const id=input.id??`guide_${randomToken(10)}`
  const r=await query<Record<string,unknown>>(`INSERT INTO guide_articles(id,slug,title,excerpt,cover_url,content,status,author_id,seo_title,seo_description,published_at,created_at,updated_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,CASE WHEN $7='published' THEN now() ELSE NULL END,now(),now()) ON CONFLICT(id) DO UPDATE SET slug=excluded.slug,title=excluded.title,excerpt=excluded.excerpt,cover_url=excluded.cover_url,content=excluded.content,status=excluded.status,seo_title=excluded.seo_title,seo_description=excluded.seo_description,published_at=CASE WHEN excluded.status='published' THEN coalesce(guide_articles.published_at,now()) ELSE NULL END,updated_at=now() RETURNING *`,[id,input.slug.trim(),input.title.trim(),input.excerpt??'',input.coverUrl??null,input.content,input.status,input.authorId??null,input.seoTitle??null,input.seoDescription??null])
  return r.rows[0]
}
export async function deleteGuide(id:string){if(!databaseEnabled)return false;const r=await query(`DELETE FROM guide_articles WHERE id=$1`,[id]);return (r.rowCount??0)>0}


export async function listBookings(params:{search?:string;status?:string;page?:number;limit?:number}) {
  const page=Math.max(1,params.page??1), limit=Math.min(100,Math.max(10,params.limit??25)), offset=(page-1)*limit
  if(!databaseEnabled)return {items:[],page,limit,total:0}
  const values:unknown[]=[]; const where:string[]=[]
  if(params.search){values.push(`%${params.search.trim()}%`);where.push(`(b.id ILIKE $${values.length} OR b.title ILIKE $${values.length} OR b.destination ILIKE $${values.length} OR coalesce(u.email,'') ILIKE $${values.length})`)}
  if(params.status){values.push(params.status);where.push(`b.status=$${values.length}`)}
  const clause=where.length?`WHERE ${where.join(' AND ')}`:''
  const count=await query<{count:string}>(`SELECT count(*)::text count FROM bookings b JOIN users u ON u.id=b.user_id ${clause}`,values)
  const dataValues=[...values,limit,offset]
  const result=await query<Record<string,unknown>>(`SELECT b.id,b.title,b.hotel,b.destination,b.departure_date,b.duration,b.price,b.currency,b.status,b.payment_status,b.provider_id,b.created_at,u.id user_id,u.first_name,u.last_name,u.email FROM bookings b JOIN users u ON u.id=b.user_id ${clause} ORDER BY b.created_at DESC LIMIT $${dataValues.length-1} OFFSET $${dataValues.length}`,dataValues)
  return {items:result.rows.map(r=>({...r,price:Number(r.price)})),page,limit,total:Number(count.rows[0]?.count??0)}
}

export async function listAuditEvents(limit=100) {
  if(!databaseEnabled)return []
  const result=await query<Record<string,unknown>>(`SELECT a.id,a.type,a.user_id,a.metadata,a.created_at,u.first_name,u.last_name,u.email FROM audit_events a LEFT JOIN users u ON u.id=a.user_id ORDER BY a.created_at DESC LIMIT $1`,[Math.min(500,limit)])
  return result.rows
}
