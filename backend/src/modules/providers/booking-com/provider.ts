import type { BookingProvider, BookingProviderPreview, BookingRequest, BookingResult, NormalizedTour, SearchParams, TravelProvider } from '../../../shared/types/tour'
import { BookingComOrdersClient } from './orders'

const BASE_URL = process.env.BOOKING_API_BASE_URL || 'https://demandapi-sandbox.booking.com/3.2'
const API_KEY = process.env.BOOKING_API_KEY
const AFFILIATE_ID = process.env.BOOKING_AFFILIATE_ID
const BOOKER_COUNTRY = (process.env.BOOKING_BOOKER_COUNTRY || 'ru').toLowerCase()
const CURRENCY = (process.env.BOOKING_CURRENCY || 'EUR').toUpperCase()
const DEFAULT_CITY_ID = Number(process.env.BOOKING_DEFAULT_CITY_ID || '')

function enabled() { return Boolean(API_KEY && AFFILIATE_ID) }
export function bookingComConfigured() { return enabled() }
export function bookingComNativeBookingConfigured() { return enabled() && process.env.BOOKING_NATIVE_BOOKING_ENABLED === 'true' }
function cityMap(): Record<string, number> { try { const parsed=JSON.parse(process.env.BOOKING_CITY_MAP_JSON||'{}') as Record<string,unknown>; return Object.fromEntries(Object.entries(parsed).filter(([,v])=>Number.isInteger(Number(v))).map(([k,v])=>[k.toLowerCase(),Number(v)])) } catch { return {} } }
function dateOrFallback(value:string|undefined, days:number) { if(value&&/^\d{4}-\d{2}-\d{2}$/.test(value)) return value; const d=new Date(); d.setDate(d.getDate()+days); return d.toISOString().slice(0,10) }
function cityId(destination?:string) { if(destination){const id=cityMap()[destination.trim().toLowerCase()]; if(id)return id} return Number.isInteger(DEFAULT_CITY_ID)?DEFAULT_CITY_ID:undefined }
function priceValue(value:unknown) { if(typeof value==='number'&&Number.isFinite(value))return value; if(value&&typeof value==='object'){const o=value as Record<string,unknown>; for(const key of ['display','total','book','base'])if(typeof o[key]==='number')return o[key] as number} return 0 }
function currencyValue(item:any):NormalizedTour['currency'] { const c=typeof item?.currency==='string'?item.currency:item?.currency?.booker||item?.currency?.accommodation||CURRENCY; return c==='RUB'||c==='USD'?c:'EUR' }
function mealValue(product:any):NormalizedTour['meal'] { const p=String(product?.policies?.meal_plan?.plan||'').toLowerCase(); if(p.includes('all'))return'all-inclusive'; if(p.includes('breakfast'))return'breakfast'; if(p.includes('half'))return'half-board'; return'room-only' }
function toOffer(item:any,params:SearchParams):NormalizedTour|null { const id=String(item?.id??''); const product=Array.isArray(item?.products)?item.products[0]:undefined; const price=priceValue(product?.price||item?.price); if(!id||!price)return null; const from=dateOrFallback(params.dateFrom,1),to=dateOrFallback(params.dateTo,4); const nights=Math.max(1,Math.round((new Date(to).getTime()-new Date(from).getTime())/86400000)); const rating=Number(item?.review_score??item?.rating??0); const title=String(item?.name||item?.hotel_name||`Booking.com accommodation ${id}`); const url=item?.url?.web||item?.url||item?.deep_link_url; const pid=product?.id?String(product.id):'default'; return { id:`booking-${id}-${pid.replace(/[^a-zA-Z0-9_-]/g,'-')}`, provider:'Booking.com', providerOfferId:product?.id?`${id}:${pid}`:id, title, hotel:title, city:params.destination||'Booking.com', destination:params.destination||'Booking.com', countryCode:'XX', image:item?.photo?.url||item?.photos?.[0]?.url||'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1200&q=85', rating:rating>10?rating/10:rating, reviews:Number(item?.review_count||item?.reviews||0), duration:nights, departureDate:from, departure:'Отель', price:Math.round(price), currency:currencyValue(item), meal:mealValue(product), room:String(product?.room?.name||product?.room||'Доступный номер'), flight:{departureAirport:'—',departureTime:'—',arrivalAirport:'—',arrivalTime:'—',direct:true}, badge:'new', tags:['Booking.com','Отель'], troveScore:Math.max(50,Math.min(96,Math.round((rating||5)*10))), reasons:['Актуальная цена из Booking.com',product?.policies?.cancellation?.free_cancellation_until?'Есть бесплатная отмена':'Условия отмены доступны перед бронированием'], sourceUrl:url, bookingUrl:url, priceUpdatedAt:new Date().toISOString() } }

export class BookingComProvider implements TravelProvider, BookingProvider {
  readonly id='booking-com'; readonly name='Booking.com'
  readonly capabilities={search:true,priceCheck:true,booking:process.env.BOOKING_NATIVE_BOOKING_ENABLED==='true' && Boolean(API_KEY && AFFILIATE_ID),redirect:true} as const
  readonly enabled=enabled()
  private cache=new Map<string,{offer:NormalizedTour;accommodationId:number;dateFrom:string;dateTo:string;guests:number;productId:string}>()
  private readonly ordersClient=new BookingComOrdersClient()
  async search(params:SearchParams) { if(!enabled())return[]; const city=cityId(params.destination); if(!city)return[]; const dateFrom=dateOrFallback(params.dateFrom,1),dateTo=dateOrFallback(params.dateTo,4),guests=Math.max(1,Math.min(9,params.guests||2)); const body:Record<string,unknown>={booker:{country:BOOKER_COUNTRY,platform:'desktop'},checkin:dateFrom,checkout:dateTo,city,currency:CURRENCY,extras:['products','extra_charges'],guests:{number_of_adults:guests,number_of_rooms:1},rows:20}; const filters:Record<string,unknown>={}; if(params.rating)filters.rating={minimum_review_score:params.rating}; if(params.priceFrom||params.priceTo)filters.price={...(params.priceFrom?{minimum:params.priceFrom}:{}),...(params.priceTo?{maximum:params.priceTo}:{})}; if(Object.keys(filters).length)body.filters=filters; const response=await this.request('/accommodations/search',body); const offers=(Array.isArray(response?.data)?response.data:[]).map((item:any)=>toOffer(item,params)).filter(Boolean) as NormalizedTour[]; for(const offer of offers){const accommodationId=Number(offer.providerOfferId.split(':')[0]); this.cache.set(offer.id,{offer,accommodationId,dateFrom,dateTo,guests,productId:offer.providerOfferId.split(':').slice(1).join(':') || 'default'})} return offers }
  async getOffer(id:string){return this.cache.get(id)?.offer||null}
  async checkPrice(id:string){const cached=this.cache.get(id); if(!cached||!enabled())return null; const response=await this.request('/accommodations/availability',{accommodation:cached.accommodationId,booker:{country:BOOKER_COUNTRY,platform:'desktop'},checkin:cached.dateFrom,checkout:cached.dateTo,currency:CURRENCY,guests:{number_of_adults:cached.guests,number_of_rooms:1},extras:['products','extra_charges']}); const item=response?.data,product=Array.isArray(item?.products)?item.products[0]:undefined,price=priceValue(product?.price||item?.price); if(!price)return{available:false,price:cached.offer.price,currency:cached.offer.currency,checkedAt:new Date().toISOString()}; return{available:true,price:Math.round(price),currency:currencyValue(item),checkedAt:new Date().toISOString()} }
  async previewBooking(request: BookingRequest): Promise<BookingProviderPreview> {
    const cached=this.cache.get(request.offerId)
    if(!cached) throw new Error('OFFER_NOT_FOUND')
    const preview=await this.ordersClient.preview({
      accommodationId:cached.accommodationId,
      checkin:cached.dateFrom,
      checkout:cached.dateTo,
      productId:cached.productId,
      adults:cached.guests,
      country:BOOKER_COUNTRY,
      currency:CURRENCY,
    })
    return preview
  }

  async createBooking(request: BookingRequest): Promise<BookingResult> {
    if(!request.providerPreviewToken) throw new Error('PROVIDER_PREVIEW_REQUIRED')
    const cached=this.cache.get(request.offerId)
    if(!cached) throw new Error('OFFER_NOT_FOUND')
    const timing=process.env.BOOKING_PAYMENT_TIMING || 'pay_at_property'
    const method=process.env.BOOKING_PAYMENT_METHOD || 'pay_at_property'
    if(timing === 'pay_online_now' && !process.env.BOOKING_PAYMENT_METHOD) throw new Error('BOOKING_PROVIDER_PAYMENT_METHOD_REQUIRED')
    const result=await this.ordersClient.create({
      orderToken:request.providerPreviewToken,
      label:`trove:${request.offerId}`,
      productId:cached.productId,
      guest:{name:`${request.customer.firstName} ${request.customer.lastName}`.trim(),email:request.customer.email,phone:request.customer.phone,address:request.customer.address},
      paymentTiming:timing,
      paymentMethod:method,
    })
    return {providerId:this.id,mode:'booking',status:result.status,bookingId:result.providerOrderId,providerRequestId:result.providerRequestId}
  }

  async reconcileBooking(providerOrderId:string){
    return this.ordersClient.details(providerOrderId)
  }

  private async request(path:string,body:Record<string,unknown>){const response=await fetch(`${BASE_URL}${path}`,{method:'POST',headers:{Authorization:`Bearer ${API_KEY}`,'Content-Type':'application/json','X-Affiliate-Id':String(AFFILIATE_ID)},body:JSON.stringify(body)}); if(!response.ok)throw new Error(`BOOKING_API_${response.status}`); return response.json() as Promise<any>}
}
