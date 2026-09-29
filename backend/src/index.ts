import { Hono } from 'hono'
import type { Context } from 'hono'
import { cors } from 'hono/cors'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import type { SearchParams } from './shared/types/tour'
import { providers } from './modules/providers'
import { searchTours } from './modules/search/service'
import { authRepository } from './modules/auth/repository'
import { login, publicUser, register, requestPasswordReset, resetPassword, verifyContact } from './modules/auth/service'
import { audit } from './modules/security/audit'
import { consumeRateLimit } from './modules/security/rate-limit'
import { personalizationStore } from './modules/personalization/store'
import { createBooking } from './modules/bookings/service'
import { previewBooking, confirmBooking } from './modules/bookings/orchestrator'
import { bookingStore } from './modules/bookings/store'
import { promotionStore } from './modules/promotions/store'
import { getLoyaltyProfile, quotePromotion } from './modules/promotions/service'
import { communicationStore } from './modules/communications/store'
import { getProviderHealth } from './modules/providers/registry'
import { communicationPreferenceView, emitCommunication } from './modules/communications/service'
import { createPaymentIntent, confirmPayment, reconcilePayment } from './modules/payments/service'
import { paymentStore } from './modules/payments/store'
import { getAttempts } from './modules/bookings/operations'
import { reconcileBooking } from './modules/bookings/recovery'
import { verifyAndHandleWebhook } from './modules/payments/webhooks'
import { signMockWebhook } from './modules/payments/providers/mock'
import { getDatabaseHealth } from './infrastructure/database/health'
import { query, databaseEnabled } from './infrastructure/database/client'
import { getRedisHealth } from './infrastructure/redis/client'
import { validateEnvironment } from './infrastructure/config/env'
import { securityMiddleware } from './modules/security/http'
import { getPaymentProvider } from './modules/payments/providers'
import { metricsSnapshot } from './infrastructure/observability/metrics'
import { recordAnalyticsEvent } from './modules/analytics/events'
import { adminRoutes } from './modules/admin/routes'
import { contentRoutes } from './modules/content/routes'
import { trackMarketingEvent } from './modules/marketing/service'
import { marketingRoutes } from './modules/marketing/routes'
import { contentEngineRoutes } from './modules/content-engine/routes'
import { getCustomerProfile } from './modules/marketing/customer'
import { personalizeTours, recordPersonalizationImpression } from './modules/recommendations/personalization'

validateEnvironment()

const app = new Hono()
const SESSION_COOKIE = process.env.NODE_ENV === 'production' ? '__Host-trove_session' : 'trove_session'
const allowedOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:3000'
app.use('/api/*', securityMiddleware)
app.use('/api/*', cors({ origin: allowedOrigin, credentials: true, allowHeaders: ['Content-Type', 'X-CSRF-Token', 'X-Trove-Session'], allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'] }))
const api = app.basePath('/api')
api.route('/admin', adminRoutes)
api.route('/content', contentRoutes)
marketingRoutes(api)
contentEngineRoutes(api)

function number(value: string | undefined) { if (value === undefined || value === '') return undefined; const parsed = Number(value); return Number.isFinite(parsed) ? parsed : undefined }
function getSearchParams(c: Context): SearchParams { const q = c.req.query(); return { search:q.search||undefined, departure:q.departure||undefined, destination:q.destination||undefined, dateFrom:q.dateFrom||undefined, dateTo:q.dateTo||undefined, guests:number(q.guests), priceFrom:number(q.priceFrom), priceTo:number(q.priceTo), rating:number(q.rating), duration:q.duration as SearchParams['duration'], sort:(q.sort as SearchParams['sort'])||'recommended', order:(q.order as SearchParams['order'])||'asc', page:number(q.page), limit:number(q.limit) } }
function requestIp(c: Context) { return c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || c.req.header('x-real-ip') || 'unknown' }
async function tooMany(c: Context, key: string, limit: number, windowMs: number) { const result = await consumeRateLimit(`${requestIp(c)}:${key}`, limit, windowMs); if (!result.allowed) { c.header('Retry-After', String(result.retryAfter)); return c.json({ error:'RATE_LIMITED', retryAfter:result.retryAfter }, 429) } return null }
async function currentUser(c: Context) { const id = getCookie(c, SESSION_COOKIE); const session = id ? await authRepository.findSession(id) : undefined; if (!session) return undefined; const user = await authRepository.findUserById(session.userId); return user ? { session, user } : undefined }

api.get('/ready', async (c) => {
  const [database, redis] = await Promise.all([getDatabaseHealth(), getRedisHealth()])
  const ready = database.ok && redis.ok
  return c.json({ status: ready ? 'ready' : 'not_ready', database, redis }, ready ? 200 : 503)
})

api.get('/ops/metrics', async (c) => {
  const token = process.env.OPS_METRICS_TOKEN
  if (!token || c.req.header('X-Ops-Token') !== token) return c.json({ error: 'NOT_FOUND' }, 404)
  return c.json(metricsSnapshot())
})

api.get('/health', async (c) => {
  const [database, redis] = await Promise.all([getDatabaseHealth(), getRedisHealth()])
  const paymentProvider = getPaymentProvider()
  return c.json({ ok:true, service:'trove-api', providers:providers.map((provider)=>provider.id), payment:{ configured:Boolean(paymentProvider), provider:paymentProvider?.id ?? null }, infrastructure:{ database, redis } })
})
api.get('/providers', (c) => c.json({ items:providers.map((provider)=>({id:provider.id,name:provider.name,capabilities:provider.capabilities,enabled:'enabled' in provider ? Boolean(provider.enabled) : true})) }))
api.get('/providers/health', async (c) => c.json({ items: await getProviderHealth() }))
api.post('/events', async (c) => {
  const limited = await tooMany(c, 'events', 60, 60 * 1000)
  if (limited) return limited
  const body = await c.req.json().catch(() => null) as { event?: unknown; payload?: unknown } | null
  if (!body || typeof body.event !== 'string' || body.event.length > 64 || (body.payload !== undefined && (typeof body.payload !== 'object' || body.payload === null || Array.isArray(body.payload)))) return c.json({ error: 'INVALID_INPUT' }, 400)
  const active = await currentUser(c)
  try {
    recordAnalyticsEvent(body.event, body.payload as Record<string, unknown> | undefined, { userId: active?.user.id, ip: requestIp(c) })
    const marketingEvents = new Set(['search_submitted','offer_viewed','offer_favorited','checkout_started','payment_started','payment_returned','booking_confirmed','guide_viewed','guide_read','campaign_clicked','campaign_opened'])
    if (marketingEvents.has(body.event)) {
      await trackMarketingEvent(body.event as never, (body.payload as Record<string, unknown>) || {}, { userId: active?.user.id, sessionId: c.req.header('x-trove-session') || undefined })
    }
    return c.json({ ok: true }, 202)
  }
  catch (error) { return c.json({ error: error instanceof Error ? error.message : 'INVALID_EVENT' }, 400) }
})

api.get('/guides', async (c) => {
  if (!databaseEnabled) return c.json({ items: [] })
  const result = await query<Record<string, unknown>>(`SELECT id,slug,title,excerpt,cover_url,status,published_at,created_at,updated_at FROM guide_articles WHERE status='published' ORDER BY published_at DESC NULLS LAST, updated_at DESC`)
  return c.json({ items: result.rows })
})
api.get('/guides/:slug', async (c) => {
  if (!databaseEnabled) return c.json({ error: 'NOT_FOUND' }, 404)
  const result = await query<Record<string, unknown>>(`SELECT id,slug,title,excerpt,cover_url,content,status,published_at,created_at,updated_at FROM guide_articles WHERE slug=$1 AND status='published' LIMIT 1`, [c.req.param('slug')])
  return result.rows[0] ? c.json({ item: result.rows[0] }) : c.json({ error: 'NOT_FOUND' }, 404)
})

api.get('/personalization/recommendations', async (c) => {
  const active = await currentUser(c)
  const profile = active ? await getCustomerProfile(active.user.id) : null
  const destination = c.req.query('destination') || undefined
  const budgetTo = number(c.req.query('budgetTo'))
  const duration = c.req.query('duration') as SearchParams['duration']
  const limit = Math.min(12, Math.max(1, number(c.req.query('limit')) || 6))
  const base = await searchTours({ destination, priceTo: budgetTo, duration, page: 1, limit: 50, sort: 'recommended', order: 'asc' }, providers)
  const items = personalizeTours(base.items, { profile, destination, budgetTo, duration, limit })
  return c.json({ items, personalized: Boolean(active || destination || budgetTo || duration), profile: profile ? { intentScore: profile.intentScore, intentSegment: profile.intentSegment, favoriteDestinations: profile.favoriteDestinations } : null })
})

api.post('/personalization/impressions', async (c) => {
  const active = await currentUser(c)
  const body = await c.req.json().catch(() => null) as Record<string, unknown> | null
  if (!body || typeof body.offerId !== 'string' || typeof body.placement !== 'string') return c.json({ error: 'INVALID_INPUT' }, 400)
  const item = await recordPersonalizationImpression({ userId: active?.user.id, sessionId: c.req.header('x-trove-session') || undefined, offerId: body.offerId, placement: body.placement, score: typeof body.score === 'number' ? body.score : undefined })
  return c.json({ item }, 202)
})

api.get('/tours', async (c) => c.json(await searchTours(getSearchParams(c), providers)))
api.get('/tours/:id/price', async (c) => { const providerId=c.req.query('provider'); const provider=providerId?providers.find((item)=>item.id===providerId):undefined; if(!provider?.capabilities.priceCheck)return c.json({error:'Price check is not supported for this provider'},400); const result=await provider.checkPrice(c.req.param('id')); if(!result)return c.json({error:'Offer not found'},404); return c.json({providerId:provider.id,...result}) })
api.get('/tours/:id/redirect', async (c) => { const providerId=c.req.query('provider'); const provider=providerId?providers.find((item)=>item.id===providerId):undefined; if(!provider?.capabilities.redirect)return c.json({error:'Redirect is not supported for this provider'},400); const offer=await provider.getOffer(c.req.param('id')); if(!offer?.bookingUrl)return c.json({error:'Booking redirect is unavailable'},404); return c.json({providerId:provider.id,mode:'redirect',url:offer.bookingUrl}) })
api.get('/tours/:id', async (c) => { for(const provider of providers){const offer=await provider.getOffer(c.req.param('id')); if(offer)return c.json({item:offer,provider:{id:provider.id,name:provider.name,capabilities:provider.capabilities}})} return c.json({error:'Tour not found'},404) })

api.post('/auth/register', async (c) => {
  const limited=await tooMany(c,'register',5,15*60*1000); if(limited)return limited
  const body=await c.req.json().catch(()=>null) as Record<string,unknown>|null
  if(!body || typeof body.firstName!=='string' || typeof body.password!=='string' || body.password.length<8 || (typeof body.email!=='string' && typeof body.phone!=='string')) return c.json({error:'INVALID_INPUT'},400)
  try { const result=await register({ firstName:body.firstName, email:typeof body.email==='string'?body.email:undefined, phone:typeof body.phone==='string'?body.phone:undefined, password:body.password, marketingEmailConsent:body.marketingEmailConsent===true, marketingSmsConsent:body.marketingSmsConsent===true }); audit({type:'REGISTERED',userId:result.user.id,ip:requestIp(c)}); return c.json({ ...result, demoOnlyVerificationCode: process.env.NODE_ENV==='production' ? undefined : result.verificationCode },201) } catch(error) { const code=error instanceof Error?error.message:'REGISTER_FAILED'; if(code==='CONTACT_ALREADY_EXISTS')return c.json({error:code},409); return c.json({error:code},400) }
})

api.post('/auth/verify', async (c) => { const limited=await tooMany(c,'verify',8,15*60*1000); if(limited)return limited; const body=await c.req.json().catch(()=>null) as Record<string,unknown>|null; if(!body||typeof body.code!=='string'||!['EMAIL_VERIFICATION','PHONE_VERIFICATION'].includes(String(body.type)))return c.json({error:'INVALID_INPUT'},400); const user=await verifyContact(body.code,String(body.type) as 'EMAIL_VERIFICATION'|'PHONE_VERIFICATION'); if(!user)return c.json({error:'INVALID_OR_EXPIRED_CODE'},400); audit({type:'CONTACT_VERIFIED',userId:user.id,ip:requestIp(c)}); return c.json({user:publicUser(user)}) })

api.post('/auth/login', async (c) => { const limited=await tooMany(c,'login',10,15*60*1000); if(limited)return limited; const body=await c.req.json().catch(()=>null) as Record<string,unknown>|null; if(!body||typeof body.identifier!=='string'||typeof body.password!=='string')return c.json({error:'INVALID_INPUT'},400); const result=await login(body.identifier,body.password,{userAgent:c.req.header('user-agent'),ip:requestIp(c)}); if(!result){audit({type:'LOGIN_FAILED',ip:requestIp(c)}); return c.json({error:'INVALID_CREDENTIALS'},401)} setCookie(c,SESSION_COOKIE,result.session.id,{httpOnly:true,secure:process.env.NODE_ENV === 'production',sameSite:'Lax',path:'/',maxAge:60*60*24*30}); audit({type:'LOGIN_SUCCESS',userId:result.user.id,ip:requestIp(c)}); return c.json({user:publicUser(result.user)}) })
api.post('/auth/logout',async(c)=>{const id=getCookie(c,SESSION_COOKIE);const active=await currentUser(c);if(id)await authRepository.revokeSession(id);deleteCookie(c,SESSION_COOKIE,{path:'/'});if(active)audit({type:'LOGOUT',userId:active.user?.id,ip:requestIp(c)});return c.json({ok:true})})
api.get('/auth/me',async(c)=>{const active=await currentUser(c);if(!active?.user)return c.json({user:null});return c.json({user:publicUser(active.user)})})

api.get('/me/loyalty',async(c)=>{ const user=await requireUser(c); if(!user)return c.json({error:'UNAUTHORIZED'},401); return c.json({item:getLoyaltyProfile(await bookingStore.findByUser(user.id),user.id)}) })
api.get('/me/communications/preferences',async(c)=>{ const user=await requireUser(c); if(!user)return c.json({error:'UNAUTHORIZED'},401); return c.json({item:communicationPreferenceView(user)}) })
api.patch('/me/communications/preferences',async(c)=>{ const user=await requireUser(c); if(!user)return c.json({error:'UNAUTHORIZED'},401); const body=await c.req.json().catch(()=>null) as Record<string,unknown>|null; if(!body)return c.json({error:'INVALID_INPUT'},400); const keys=['emailMarketing','smsMarketing','pushMarketing','emailTransactional','smsTransactional','pushTransactional'] as const; const patch: Record<string,boolean>={}; for(const key of keys){if(body[key]!==undefined){if(typeof body[key]!=='boolean')return c.json({error:'INVALID_INPUT'},400); patch[key]=body[key]}} const prefs=communicationStore.updatePreferences(user.id,patch); if(body.emailMarketing!==undefined){user.marketingEmailConsent=Boolean(body.emailMarketing); user.marketingConsentAt=new Date().toISOString(); await authRepository.updateUser(user)} if(body.smsMarketing!==undefined){user.marketingSmsConsent=Boolean(body.smsMarketing); user.marketingConsentAt=new Date().toISOString(); await authRepository.updateUser(user)} return c.json({item:prefs}) })
api.get('/me/notifications',async(c)=>{ const user=await requireUser(c); if(!user)return c.json({error:'UNAUTHORIZED'},401); return c.json({items:communicationStore.listNotifications(user.id)}) })
api.post('/me/notifications/:id/read',async(c)=>{ const user=await requireUser(c); if(!user)return c.json({error:'UNAUTHORIZED'},401); const item=communicationStore.markRead(user.id,c.req.param('id')); if(!item)return c.json({error:'NOT_FOUND'},404); return c.json({item}) })
api.post('/me/notifications/read-all',async(c)=>{ const user=await requireUser(c); if(!user)return c.json({error:'UNAUTHORIZED'},401); return c.json({items:communicationStore.markAllRead(user.id)}) })
api.get('/promotions',(c)=>c.json({items:promotionStore.list().map(({id,code,title,description,type,value,minBookingAmount,maxDiscount,expiresAt})=>({id,code,title,description,type,value,minBookingAmount,maxDiscount,expiresAt}))}))
api.post('/promotions/validate',async(c)=>{ const user=await requireUser(c); if(!user)return c.json({error:'UNAUTHORIZED'},401); const body=await c.req.json().catch(()=>null) as Record<string,unknown>|null; if(!body||typeof body.code!=='string'||typeof body.price!=='number'||typeof body.destination!=='string')return c.json({error:'INVALID_INPUT'},400); const promotion=promotionStore.findByCode(body.code); const bookings=await bookingStore.findByUser(user.id); const quote=quotePromotion(promotion,user.id,body.price,body.destination,bookings.filter((item)=>item.status!=='cancelled').length===0); return c.json(quote,quote.valid?200:400) })
api.get('/me/bookings',async(c)=>{ const user=await requireUser(c); if(!user)return c.json({error:'UNAUTHORIZED'},401); return c.json({items:await bookingStore.findByUser(user.id)}) })
api.get('/me/bookings/:id/events',async(c)=>{ const user=await requireUser(c); if(!user)return c.json({error:'UNAUTHORIZED'},401); const item=await bookingStore.find(c.req.param('id')); if(!item||item.userId!==user.id)return c.json({error:'NOT_FOUND'},404); return c.json({items:await bookingStore.events(item.id)}) })
api.get('/me/bookings/:id',async(c)=>{ const user=await requireUser(c); if(!user)return c.json({error:'UNAUTHORIZED'},401); const item=await bookingStore.find(c.req.param('id')); if(!item || item.userId!==user.id)return c.json({error:'NOT_FOUND'},404); return c.json({item}) })
api.post('/bookings/preview',async(c)=>{ const user=await requireUser(c); if(!user)return c.json({error:'UNAUTHORIZED'},401); const limited=await tooMany(c,'booking-preview',12,10*60*1000); if(limited)return limited; const key=c.req.header('Idempotency-Key'); if(!key || key.length<8 || key.length>128)return c.json({error:'IDEMPOTENCY_KEY_REQUIRED'},400); const body=await c.req.json().catch(()=>null) as Record<string,unknown>|null; if(!body || typeof body.offerId!=='string' || typeof body.providerId!=='string' || !Array.isArray(body.passengers) || !body.contact || typeof body.contact!=='object')return c.json({error:'INVALID_INPUT'},400); const contact=body.contact as Record<string,unknown>; if(typeof contact.email!=='string')return c.json({error:'INVALID_CONTACT'},400); const consent=body.consent&&typeof body.consent==='object'?body.consent as Record<string,unknown>:null; if(!consent||consent.termsAccepted!==true||typeof consent.termsVersion!=='string'||typeof consent.privacyVersion!=='string')return c.json({error:'CONSENT_REQUIRED'},400); try { const item=await previewBooking(user.id,{offerId:body.offerId,providerId:body.providerId,passengers:body.passengers as never,contact:{email:contact.email,phone:typeof contact.phone==='string'?contact.phone:undefined,address:contact.address&&typeof contact.address==='object'?contact.address as {country:string;city:string;address:string;zip?:string}:undefined},promoCode:typeof body.promoCode==='string'?body.promoCode.trim():undefined,idempotencyKey:key,consent:{termsAccepted:true,termsVersion:consent.termsVersion,privacyVersion:consent.privacyVersion}}); return c.json({item}) } catch(error){ const code=error instanceof Error?error.message:'BOOKING_PREVIEW_FAILED'; const map:Record<string,number>={PROVIDER_NOT_FOUND:404,OFFER_NOT_FOUND:404,OFFER_UNAVAILABLE:409,PRICE_CHANGED:409,INVALID_PASSENGERS:400,PRICE_CHECK_UNAVAILABLE:409,PAYMENT_REQUIRED:409}; if(code.startsWith('PROMO_INVALID:'))return c.json({error:'PROMO_INVALID',message:code.slice(13)},400); return c.json({error:code},map[code]??400) } })
api.post('/payments/intents',async(c)=>{ const user=await requireUser(c); if(!user)return c.json({error:'UNAUTHORIZED'},401); const body=await c.req.json().catch(()=>null) as Record<string,unknown>|null; if(!body||typeof body.bookingId!=='string')return c.json({error:'INVALID_INPUT'},400); try { const item=await createPaymentIntent(user.id,body.bookingId); return c.json({item}) } catch(error){ const code=error instanceof Error?error.message:'PAYMENT_INTENT_FAILED'; const map:Record<string,number>={NOT_FOUND:404,BOOKING_NOT_PAYABLE:409,ALREADY_PAID:409}; return c.json({error:code},map[code]??400) } })
api.post('/payments/intents/:id/confirm',async(c)=>{ const user=await requireUser(c); if(!user)return c.json({error:'UNAUTHORIZED'},401); const limited=await tooMany(c,'payment-confirm',5,10*60*1000); if(limited)return limited; try { const item=await confirmPayment(user.id,c.req.param('id')); return c.json({item}) } catch(error){ const code=error instanceof Error?error.message:'PAYMENT_FAILED'; const map:Record<string,number>={NOT_FOUND:404,PAYMENT_EXPIRED:409,PAYMENT_NOT_CONFIRMABLE:409}; return c.json({error:code},map[code]??400) } })
api.post('/payments/intents/:id/reconcile',async(c)=>{ const user=await requireUser(c); if(!user)return c.json({error:'UNAUTHORIZED'},401); try { return c.json({item:await reconcilePayment(user.id,c.req.param('id'))}) } catch(error){ const code=error instanceof Error?error.message:'PAYMENT_RECONCILIATION_FAILED'; return c.json({error:code},code==='NOT_FOUND'?404:400) } })
api.get('/me/bookings/:id/attempts',async(c)=>{ const user=await requireUser(c); if(!user)return c.json({error:'UNAUTHORIZED'},401); const booking=await bookingStore.find(c.req.param('id')); if(!booking||booking.userId!==user.id)return c.json({error:'NOT_FOUND'},404); return c.json({items:await getAttempts(booking.id)}) })
api.post('/bookings/:id/recover',async(c)=>{ const user=await requireUser(c); if(!user)return c.json({error:'UNAUTHORIZED'},401); try { return c.json(await reconcileBooking(user.id,c.req.param('id'))) } catch(error){ const code=error instanceof Error?error.message:'BOOKING_RECOVERY_FAILED'; return c.json({error:code},code==='NOT_FOUND'?404:400) } })
api.post('/payments/webhooks/yookassa',async(c)=>{ const rawBody=await c.req.text(); try { return c.json(await verifyAndHandleWebhook('yookassa',rawBody,undefined)) } catch(error){ const code=error instanceof Error?error.message:'WEBHOOK_FAILED'; return c.json({error:code},code==='NOT_FOUND'?404:400) } })
api.post('/payments/webhooks/mock',async(c)=>{ const body=await c.req.json().catch(()=>null) as Record<string,unknown>|null; if(!body||typeof body.eventId!=='string'||typeof body.paymentIntentId!=='string'||!['succeeded','failed'].includes(String(body.status)))return c.json({error:'INVALID_INPUT'},400); const payload={eventId:body.eventId,paymentIntentId:body.paymentIntentId,status:body.status as 'succeeded'|'failed',providerPaymentId:typeof body.providerPaymentId==='string'?body.providerPaymentId:undefined,failureReason:typeof body.failureReason==='string'?body.failureReason:undefined}; const signed=signMockWebhook(payload); try { return c.json(await verifyAndHandleWebhook('mock-payment',signed.rawBody,signed.signature)) } catch(error){ const code=error instanceof Error?error.message:'WEBHOOK_FAILED'; return c.json({error:code},code==='NOT_FOUND'?404:400) } })
api.get('/me/payments/:id/events',async(c)=>{ const user=await requireUser(c); if(!user)return c.json({error:'UNAUTHORIZED'},401); const item=paymentStore.find(c.req.param('id')); if(!item||item.userId!==user.id)return c.json({error:'NOT_FOUND'},404); return c.json({items:paymentStore.events(item.id)}) })
api.post('/bookings/:id/confirm',async(c)=>{ const user=await requireUser(c); if(!user)return c.json({error:'UNAUTHORIZED'},401); const limited=await tooMany(c,'booking-confirm',6,10*60*1000); if(limited)return limited; const body=await c.req.json().catch(()=>null) as Record<string,unknown>|null; if(!body||typeof body.previewToken!=='string')return c.json({error:'INVALID_INPUT'},400); try { const item=await confirmBooking(user.id,c.req.param('id'),body.previewToken); audit({type:'BOOKING_CONFIRMED',userId:user.id,ip:requestIp(c),metadata:{bookingId:item.id}}); emitCommunication(user,{userId:user.id,type:'BOOKING_CONFIRMED',category:'transactional',title:'Бронирование подтверждено',body:`Поездка ${item.id} подтверждена.`,payload:{bookingId:item.id}}); return c.json({item}) } catch(error){ const code=error instanceof Error?error.message:'BOOKING_CONFIRM_FAILED'; const map:Record<string,number>={NOT_FOUND:404,INVALID_PREVIEW_TOKEN:409,PREVIEW_EXPIRED:409,PRICE_CHANGED:409,OFFER_UNAVAILABLE:409,NATIVE_BOOKING_UNAVAILABLE:409,NATIVE_BOOKING_DISABLED:409}; return c.json({error:code},map[code]??400) } })
api.post('/bookings',async(c)=>{ const user=await requireUser(c); if(!user)return c.json({error:'UNAUTHORIZED'},401); const limited=await tooMany(c,'booking-create',8,10*60*1000); if(limited)return limited; const key=c.req.header('Idempotency-Key'); if(!key || key.length<8 || key.length>128)return c.json({error:'IDEMPOTENCY_KEY_REQUIRED'},400); const body=await c.req.json().catch(()=>null) as Record<string,unknown>|null; if(!body || typeof body.offerId!=='string' || typeof body.providerId!=='string' || !Array.isArray(body.passengers) || !body.contact || typeof body.contact!=='object')return c.json({error:'INVALID_INPUT'},400); const contact=body.contact as Record<string,unknown>; if(typeof contact.email!=='string')return c.json({error:'INVALID_CONTACT'},400); const consent=body.consent&&typeof body.consent==='object'?body.consent as Record<string,unknown>:null; if(!consent||consent.termsAccepted!==true||typeof consent.termsVersion!=='string'||typeof consent.privacyVersion!=='string')return c.json({error:'CONSENT_REQUIRED'},400); try { const item=await createBooking(user.id,{offerId:body.offerId,providerId:body.providerId,passengers:body.passengers as never,contact:{email:contact.email,phone:typeof contact.phone==='string'?contact.phone:undefined,address:contact.address&&typeof contact.address==='object'?contact.address as {country:string;city:string;address:string;zip?:string}:undefined},promoCode:typeof body.promoCode==='string'?body.promoCode.trim():undefined,idempotencyKey:key,consent:{termsAccepted:true,termsVersion:consent.termsVersion,privacyVersion:consent.privacyVersion}}); audit({type:'BOOKING_CREATED',userId:user.id,ip:requestIp(c),metadata:{bookingId:item.id}}); emitCommunication(user,{userId:user.id,type:'BOOKING_CREATED',category:'transactional',title:'Бронирование создано',body:`Заявка ${item.id} создана. Мы сохранили детали поездки и проверили актуальную цену.`,payload:{bookingId:item.id}}); return c.json({item},201) } catch(error){ const code=error instanceof Error?error.message:'BOOKING_FAILED'; const map:Record<string,number>={PROVIDER_NOT_FOUND:404,OFFER_NOT_FOUND:404,OFFER_UNAVAILABLE:409,PRICE_CHANGED:409,INVALID_PASSENGERS:400,PRICE_CHECK_UNAVAILABLE:409,PAYMENT_REQUIRED:409}; if(code.startsWith('PROMO_INVALID:')) return c.json({error:'PROMO_INVALID',message:code.slice('PROMO_INVALID:'.length)},400); return c.json({error:code},map[code]??400) } })
api.post('/me/bookings/:id/cancel',async(c)=>{ const user=await requireUser(c); if(!user)return c.json({error:'UNAUTHORIZED'},401); const existing=await bookingStore.find(c.req.param('id')); if(!existing||existing.userId!==user.id)return c.json({error:'NOT_FOUND'},404); if(['confirmed','provider_booking'].includes(existing.status))return c.json({error:'PROVIDER_CANCELLATION_REQUIRED'},409); if(['cancelled','failed','expired'].includes(existing.status))return c.json({item:existing}); const item=await bookingStore.cancel(user.id,c.req.param('id')); return c.json({item}) })

async function requireUser(c: Context) {
  const active = await currentUser(c)
  if (!active?.user) return null
  if (active.user.status !== 'active') return null
  return active.user
}

api.get('/me/personalization', async (c) => {
  const user = await requireUser(c)
  if (!user) return c.json({ error: 'UNAUTHORIZED' }, 401)
  return c.json({ favorites: personalizationStore.getFavorites(user.id), viewed: personalizationStore.getViewed(user.id), savedSearches: personalizationStore.getSavedSearches(user.id), preferences: personalizationStore.getPreferences(user.id) })
})

api.post('/me/favorites/:tourId', async (c) => {
  const user = await requireUser(c)
  if (!user) return c.json({ error: 'UNAUTHORIZED' }, 401)
  const tourId = c.req.param('tourId')
  const isFavorite = personalizationStore.toggleFavorite(user.id, tourId)
  return c.json({ tourId, isFavorite })
})

api.post('/me/viewed/:tourId', async (c) => {
  const user = await requireUser(c)
  if (!user) return c.json({ error: 'UNAUTHORIZED' }, 401)
  return c.json({ items: personalizationStore.addViewed(user.id, c.req.param('tourId')) })
})

api.post('/me/saved-searches', async (c) => {
  const user = await requireUser(c)
  if (!user) return c.json({ error: 'UNAUTHORIZED' }, 401)
  const body = await c.req.json().catch(() => null) as { name?: unknown; params?: unknown } | null
  if (!body || typeof body.name !== 'string' || !body.name.trim() || !body.params || typeof body.params !== 'object') return c.json({ error: 'INVALID_INPUT' }, 400)
  return c.json({ item: personalizationStore.createSavedSearch(user.id, body.name, body.params as Record<string, string | number | undefined>) }, 201)
})

api.delete('/me/saved-searches/:id', async (c) => {
  const user = await requireUser(c)
  if (!user) return c.json({ error: 'UNAUTHORIZED' }, 401)
  const deleted = personalizationStore.deleteSavedSearch(user.id, c.req.param('id'))
  return deleted ? c.json({ ok: true }) : c.json({ error: 'NOT_FOUND' }, 404)
})

api.patch('/me/preferences', async (c) => {
  const user = await requireUser(c)
  if (!user) return c.json({ error: 'UNAUTHORIZED' }, 401)
  const body = await c.req.json().catch(() => null) as Record<string, unknown> | null
  if (!body) return c.json({ error: 'INVALID_INPUT' }, 400)
  return c.json({ preferences: personalizationStore.updatePreferences(user.id, body as never) })
})
api.post('/auth/forgot-password',async(c)=>{const limited=await tooMany(c,'forgot-password',5,15*60*1000);if(limited)return limited;const body=await c.req.json().catch(()=>null) as Record<string,unknown>|null;const identifier=body&&typeof body.identifier==='string'?body.identifier:'';if(!identifier)return c.json({error:'INVALID_INPUT'},400);const code=await requestPasswordReset(identifier);audit({type:'PASSWORD_RESET_REQUESTED',ip:requestIp(c)});return c.json({ok:true,demoOnlyResetCode:process.env.NODE_ENV==='production'?undefined:code})})
api.post('/auth/reset-password',async(c)=>{const limited=await tooMany(c,'reset-password',5,15*60*1000);if(limited)return limited;const body=await c.req.json().catch(()=>null) as Record<string,unknown>|null;if(!body||typeof body.code!=='string'||typeof body.password!=='string'||body.password.length<8)return c.json({error:'INVALID_INPUT'},400);const user=await resetPassword(body.code,body.password);if(!user)return c.json({error:'INVALID_OR_EXPIRED_CODE'},400);audit({type:'PASSWORD_RESET_COMPLETED',userId:user.id,ip:requestIp(c)});return c.json({ok:true})})

export type AppType = typeof app
export default app
