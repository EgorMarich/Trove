import { aggregateMarketing } from '../marketing/repository'
import { analyzeMarketing } from '../marketing/ai/strategist'
import { createContent, listContent, patchContent } from './store'
import type { ContentItem, ContentOpportunity, ContentType } from './types'

function slugify(s:string){return s.toLowerCase().replace(/[^a-zа-яё0-9]+/gi,'-').replace(/^-|-$/g,'').slice(0,80)}
function article(destination:string, title:string, angle:string):Omit<ContentItem,'id'|'createdAt'|'updatedAt'>{
  const slug=slugify(title)
  return {type:'seo_article',title,slug,destination,angle,excerpt:`Практический гид по ${destination}: когда ехать, что выбрать и как сравнить предложения Trove.`,body:`# ${title}\n\n## Коротко\n${angle}. В этом материале собраны ключевые ориентиры для самостоятельного выбора поездки.\n\n## Что выбрать\nСравните районы, формат отдыха, длительность и категорию отеля. Начинайте с бюджета и дат, затем проверяйте конкретные предложения.\n\n## На что обратить внимание\nПроверяйте условия отмены, включённые услуги, длительность и итоговую стоимость перед бронированием.\n\n## Подборка Trove\nИспользуйте поиск Trove, чтобы сравнить актуальные предложения по ${destination}.`,seo:{metaTitle:title,metaDescription:`Гид Trove по ${destination}: советы, варианты отдыха и подборка туров.`,keywords:[destination,'туры', 'отдых', 'Trove']},cta:{label:`Смотреть туры в ${destination}`,href:`/tours?destination=${encodeURIComponent(destination)}`},status:'draft'}
}

export async function getContentOpportunities():Promise<ContentOpportunity[]>{
  const data=await aggregateMarketing(30); const destinations=(data?.destinations||[]).slice(0,6)
  if(!destinations.length)return [{type:'seo_article',title:'Куда поехать в этом сезоне',reason:'Недостаточно данных — создать evergreen-гид и начать собирать demand signals.',priority:'medium'}]
  return destinations.map((d,i)=>({type:i===0?'seo_article':'guide',title:`${d.destination}: что выбрать в этом сезоне`,reason:`${d.views} просмотров предложений за последние 30 дней. Свяжите SEO-контент с коммерческой выдачей.`,destination:d.destination,priority:i<2?'high':'medium'}))
}

export async function generateContent(input:{type:ContentType;destination?:string;title?:string;brief?:string}){
  const destination=input.destination||'популярном направлении'; const title=input.title||`${destination}: что выбрать в этом сезоне`; const base=article(destination,title,input.brief||'Помогаем быстро сравнить варианты и выбрать поездку под свой бюджет')
  if(input.type==='seo_article'||input.type==='guide')return createContent({...base,type:input.type==='guide'?'guide':'seo_article'})
  if(input.type==='email')return createContent({type:'email',title:title,angle:input.brief||`Коммерческая подборка ${destination}`,excerpt:`Подборка предложений по ${destination}.`,body:`Мы собрали актуальные варианты по ${destination}. Сравните цены, даты и условия и выберите подходящий вариант.`,cta:base.cta,status:'draft'})
  if(input.type==='telegram')return createContent({type:'telegram',title,angle:input.brief||'Короткий travel-пост',excerpt:`${destination} — варианты для следующей поездки.`,body:`✈️ ${title}\n\nСобрали варианты отдыха по ${destination}. Сравните предложения в Trove и выберите свой вариант.`,cta:base.cta,status:'draft'})
  return createContent({type:'onsite',title,angle:input.brief||'Блок для главной страницы',excerpt:`Персональная подборка по ${destination}.`,body:`Подобрали актуальные предложения по ${destination}.`,cta:base.cta,status:'draft'})
}

export async function contentEngineAnalyze(brief?:string){const analysis=await analyzeMarketing(brief); const opportunities=await getContentOpportunities(); return {generatedAt:new Date().toISOString(),provider:analysis.provider,brief:brief||null,opportunities,contentIdeas:analysis.contentIdeas,summary:`Нашёл ${opportunities.length} контент-возможностей на основе спроса и поведения пользователей.`}}
export {listContent,patchContent}
