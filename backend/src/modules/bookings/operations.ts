import { query, databaseEnabled } from '../../infrastructure/database/client'
import { randomToken } from '../security/crypto'
import { bookingStore } from './store'
import type { BookingStatus } from './types'

export type BookingAttemptStatus = 'started' | 'succeeded' | 'failed' | 'unknown'
export interface BookingAttempt { id:string; bookingId:string; providerId:string; providerRequestId?:string; status:BookingAttemptStatus; attempt:number; errorCode?:string; errorMessage?:string; startedAt:string; finishedAt?:string; nextRetryAt?:string }
const attempts = new Map<string, BookingAttempt[]>()
const retryableStatuses: BookingStatus[] = ['provider_failed']
function fromRow(row:Record<string,unknown>):BookingAttempt { return { id:String(row.id), bookingId:String(row.booking_id), providerId:String(row.provider_id), attempt:Number(row.attempt), status:row.status as BookingAttemptStatus, providerRequestId:row.provider_request_id ? String(row.provider_request_id):undefined, errorCode:row.error_code?String(row.error_code):undefined, errorMessage:row.error_message?String(row.error_message):undefined, startedAt:new Date(String(row.created_at)).toISOString(), finishedAt:row.updated_at?new Date(String(row.updated_at)).toISOString():undefined, nextRetryAt:row.next_retry_at?new Date(String(row.next_retry_at)).toISOString():undefined } }
export async function recordAttempt(input: Omit<BookingAttempt,'id'|'startedAt'>) {
  const now=new Date().toISOString(), item={...input,id:`BA-${randomToken(6).toUpperCase()}`,startedAt:now}
  if(!databaseEnabled){ attempts.set(input.bookingId,[...(attempts.get(input.bookingId)??[]),item]); return item }
  const result=await query<Record<string,unknown>>(`INSERT INTO booking_attempts(id,booking_id,provider_id,attempt,status,provider_request_id,error_code,error_message,next_retry_at,created_at,updated_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10) RETURNING *`,[item.id,item.bookingId,item.providerId,item.attempt,item.status,item.providerRequestId??null,item.errorCode??null,item.errorMessage??null,item.nextRetryAt??null,now])
  return fromRow(result.rows[0])
}
export async function finishAttempt(id:string,status:BookingAttemptStatus,patch:Pick<BookingAttempt,'providerRequestId'|'errorCode'|'errorMessage'|'nextRetryAt'>={}){
  const now=new Date().toISOString()
  if(!databaseEnabled){ for(const [bookingId,list] of attempts){const index=list.findIndex(x=>x.id===id);if(index<0)continue;const next={...list[index],...patch,status,finishedAt:now};const updated=[...list];updated[index]=next;attempts.set(bookingId,updated);return next} return null }
  const result=await query<Record<string,unknown>>(`UPDATE booking_attempts SET status=$2,provider_request_id=$3,error_code=$4,error_message=$5,next_retry_at=$6,updated_at=$7 WHERE id=$1 RETURNING *`,[id,status,patch.providerRequestId??null,patch.errorCode??null,patch.errorMessage??null,patch.nextRetryAt??null,now])
  return result.rows[0]?fromRow(result.rows[0]):null
}
export async function getAttempts(bookingId:string){
  if(!databaseEnabled)return attempts.get(bookingId)??[]
  const result=await query<Record<string,unknown>>('SELECT * FROM booking_attempts WHERE booking_id=$1 ORDER BY attempt ASC',[bookingId]); return result.rows.map(fromRow)
}
export async function canRetryBooking(bookingId:string){const booking=await bookingStore.find(bookingId);if(!booking||!retryableStatuses.includes(booking.status)||booking.providerOrderId)return false;return (await getAttempts(bookingId)).length<3}
export async function scheduleRetry(bookingId:string,delayMs:number){const booking=await bookingStore.find(bookingId);if(!booking||!(await canRetryBooking(bookingId)))return null;const nextRetryAt=new Date(Date.now()+delayMs).toISOString();await bookingStore.patch(bookingId,{status:'provider_failed'});return nextRetryAt}
