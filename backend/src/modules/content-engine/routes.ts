import { getCookie } from 'hono/cookie'
import { authRepository } from '../auth/repository'
import type { Context } from 'hono'
import { contentEngineAnalyze, generateContent, listContent, patchContent, getContentOpportunities } from './service'
import type { ContentStatus, ContentType } from './types'
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
export function contentEngineRoutes(api:any){
 api.use('/marketing/content/*',async(c:Context,next:()=>Promise<void>)=>{if(!(await authorized(c)))return c.json({error:'NOT_FOUND'},404);return next()})
 api.get('/marketing/content',async(c:Context)=>c.json({items:listContent()}))
 api.get('/marketing/content/opportunities',async(c:Context)=>c.json({items:await getContentOpportunities()}))
 api.post('/marketing/content/analyze',async(c:Context)=>{const b=await c.req.json().catch(()=>({})) as any;return c.json(await contentEngineAnalyze(typeof b.brief==='string'?b.brief:undefined))})
 api.post('/marketing/content/generate',async(c:Context)=>{const b=await c.req.json().catch(()=>null) as any;if(!b||!['guide','seo_article','email','telegram','onsite'].includes(b.type))return c.json({error:'INVALID_INPUT'},400);return c.json({item:await generateContent({type:b.type as ContentType,destination:typeof b.destination==='string'?b.destination:undefined,title:typeof b.title==='string'?b.title:undefined,brief:typeof b.brief==='string'?b.brief:undefined})},201)})
 api.patch('/marketing/content/:id',async(c:Context)=>{const b=await c.req.json().catch(()=>null) as any;if(!b)return c.json({error:'INVALID_INPUT'},400);const item=await patchContent(c.req.param('id'),{...b,status:b.status as ContentStatus});return item?c.json({item}):c.json({error:'NOT_FOUND'},404)})
}
