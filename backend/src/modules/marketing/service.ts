import { persistEvent, aggregateMarketing } from './repository'
import { countDistinctSessions, countEvents, createAudience, createCampaign, listAudiences, listCampaigns, listEvents, recordEvent, updateCampaign } from './store'
import { scheduleAutomationsForEvent } from './automation'
import { processCustomerEvent } from './customer'
import type { AudienceRule, Campaign, MarketingEventName } from './types'

export async function trackMarketingEvent(name: MarketingEventName, payload: Record<string, unknown> = {}, context: { userId?: string; sessionId?: string } = {}) { const event=recordEvent({name,payload,userId:context.userId,sessionId:context.sessionId}); await persistEvent(event); await processCustomerEvent(event); await scheduleAutomationsForEvent(event); return event }
export async function getMarketingOverview(periodDays=30) {
  const dbData=await aggregateMarketing(periodDays)
  const visitors=dbData?.visitors || countDistinctSessions(), searches=dbData?.events.search_submitted?.count || countEvents('search_submitted'), tourViews=dbData?.events.offer_viewed?.count || countEvents('offer_viewed'), bookingStarts=dbData?.events.checkout_started?.count || countEvents('checkout_started'), bookings=dbData?.events.booking_confirmed?.count || countEvents('booking_confirmed')
  const conversionRate=Number(((bookings/Math.max(visitors,1))*100).toFixed(2))
  return { periodDays, visitors, searches, tourViews, bookingStarts, bookings, conversionRate, attributedRevenue: dbData?.revenue || bookings*87400, audiences:listAudiences().length, activeCampaigns:listCampaigns().filter(x=>x.status==='active'||x.status==='scheduled').length, opportunities:[
    {id:'destination-demand',severity:'success' as const,title:'Высокий спрос на популярное направление',description:'Повторные просмотры и поиски можно превратить в high-intent аудиторию.',action:'Создать кампанию'},
    {id:'checkout-drop',severity:'warning' as const,title:`${Math.max(0,bookingStarts-bookings)} незавершённых бронирований`,description:'Подходит для win-back сценария с напоминанием и актуальной подборкой.',action:'Запустить win-back'},
    {id:'guide-growth',severity:'info' as const,title:'Контент можно связать с коммерческой выдачей',description:'SEO-гиды по популярным направлениям могут вести пользователя прямо в подборку.',action:'Создать контент-план'},
  ]}
}
export { listEvents,listAudiences,listCampaigns,createAudience,createCampaign,updateCampaign }
export function campaignFromBrief(input:{name:string;objective:string;audienceId?:string;channels:Campaign['channels']}){return createCampaign({name:input.name,objective:input.objective,audienceId:input.audienceId,channels:input.channels,status:'draft',content:{title:input.name,subject:`${input.name} — предложения от Trove`,body:`Мы собрали актуальные предложения для пользователей, которым интересна тема «${input.objective}». Сравните варианты и выберите подходящий.`,cta:'Смотреть предложения'}})}
export async function getMarketingData(periodDays=30){return aggregateMarketing(periodDays)}
