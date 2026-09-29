import { getCookie } from 'hono/cookie'
import { authRepository } from '../auth/repository'
import type { Context } from 'hono'
import { analyzeMarketing } from './ai/strategist'
import { campaignFromBrief, createAudience, createCampaign, getMarketingData, getMarketingOverview, listAudiences, listCampaigns, listEvents, trackMarketingEvent, updateCampaign } from './service'
import type { CampaignChannel, MarketingEventName } from './types'
import { hydrateMarketing } from './store'
import { getCustomerProfile, getIntentOverview, listCustomerProfiles } from './customer'
import { createAutomation, listAutomations, listExecutions, runDueAutomations, updateAutomation, hydrateAutomations } from './automation'

async function authorized(c:Context){
  const expected=process.env.MARKETING_ADMIN_TOKEN
  if(expected&&c.req.header('X-Marketing-Token')===expected)return true
  if(process.env.NODE_ENV!=='production'&&!expected)return true
  const cookieName=process.env.NODE_ENV==='production'?'__Host-trove_session':'trove_session'
  const sessionId=getCookie(c,cookieName)
  if(!sessionId)return false
  const session=await authRepository.findSession(sessionId)
  if(!session)return false
  const user=await authRepository.findUserById(session.userId)
  return Boolean(user && ['admin','manager','editor'].includes(user.role))
}
export function marketingRoutes(api:any){
  api.use('/marketing/*',async(c:Context,next:()=>Promise<void>)=>{if(!(await authorized(c)))return c.json({error:'NOT_FOUND'},404);await hydrateMarketing();await hydrateAutomations();return next()})
  api.get('/marketing/overview',async(c:Context)=>c.json(await getMarketingOverview(Number(c.req.query('days')||30))))
  api.get('/marketing/data',async(c:Context)=>c.json(await getMarketingData(Number(c.req.query('days')||30))))
  api.get('/marketing/events',(c:Context)=>c.json({items:listEvents(Number(c.req.query('limit')||100))}))
  api.get('/marketing/audiences',(c:Context)=>c.json({items:listAudiences()}))
  api.get('/marketing/campaigns',(c:Context)=>c.json({items:listCampaigns()}))
  api.get('/marketing/customers',async(c:Context)=>c.json({items:await listCustomerProfiles({segment:c.req.query('segment'),destination:c.req.query('destination'),limit:Number(c.req.query('limit')||100)})}))
  api.get('/marketing/customers/:id',async(c:Context)=>{const item=await getCustomerProfile(c.req.param('id'));return item?c.json({item}):c.json({error:'NOT_FOUND'},404)})
  api.get('/marketing/intent/overview',async(c:Context)=>c.json(await getIntentOverview()))
  api.get('/marketing/automations',(c:Context)=>c.json({items:listAutomations()}))
  api.get('/marketing/automations/executions',(c:Context)=>c.json({items:listExecutions(Number(c.req.query('limit')||100))}))
  api.post('/marketing/automations/run-due',async(c:Context)=>c.json({items:await runDueAutomations(Number(c.req.query('limit')||50))}))
  api.post('/marketing/automations',async(c:Context)=>{const body=await c.req.json().catch(()=>null) as any;if(!body||typeof body.name!=='string'||!body.trigger||typeof body.trigger.event!=='string'||!Array.isArray(body.actions))return c.json({error:'INVALID_INPUT'},400);return c.json({item:await createAutomation({name:body.name,trigger:{event:body.trigger.event,delayMinutes:Number(body.trigger.delayMinutes||0)},conditions:Array.isArray(body.conditions)?body.conditions:[],actions:body.actions,status:body.status==='active'?'active':'draft'})},201)})
  api.patch('/marketing/automations/:id',async(c:Context)=>{const body=await c.req.json().catch(()=>null) as any;if(!body)return c.json({error:'INVALID_INPUT'},400);const item=await updateAutomation(c.req.param('id'),body);return item?c.json({item}):c.json({error:'NOT_FOUND'},404)})
  api.post('/marketing/events',async(c:Context)=>{const body=await c.req.json().catch(()=>null) as Record<string,unknown>|null;if(!body||typeof body.name!=='string')return c.json({error:'INVALID_INPUT'},400);return c.json({item:await trackMarketingEvent(body.name as MarketingEventName,(body.payload as Record<string,unknown>)||{},{userId:typeof body.userId==='string'?body.userId:undefined,sessionId:typeof body.sessionId==='string'?body.sessionId:undefined})},202)})
  api.post('/marketing/audiences',async(c:Context)=>{const body=await c.req.json().catch(()=>null) as Record<string,unknown>|null;if(!body||typeof body.name!=='string'||!Array.isArray(body.rules))return c.json({error:'INVALID_INPUT'},400);return c.json({item:createAudience({name:body.name,description:typeof body.description==='string'?body.description:'',rules:body.rules as never[]})},201)})
  api.post('/marketing/campaigns/from-brief',async(c:Context)=>{const body=await c.req.json().catch(()=>null) as Record<string,unknown>|null;if(!body||typeof body.name!=='string'||typeof body.objective!=='string'||!Array.isArray(body.channels))return c.json({error:'INVALID_INPUT'},400);return c.json({item:campaignFromBrief({name:body.name,objective:body.objective,audienceId:typeof body.audienceId==='string'?body.audienceId:undefined,channels:body.channels as CampaignChannel[]})},201)})
  api.patch('/marketing/campaigns/:id',async(c:Context)=>{const body=await c.req.json().catch(()=>null) as Record<string,unknown>|null;if(!body)return c.json({error:'INVALID_INPUT'},400);const item=updateCampaign(c.req.param('id'),body as never);return item?c.json({item}):c.json({error:'NOT_FOUND'},404)})
  api.post('/marketing/ai/analyze',async(c:Context)=>{const body=await c.req.json().catch(()=>({})) as {brief?:unknown};return c.json(await analyzeMarketing(typeof body.brief==='string'?body.brief:undefined))})
}
