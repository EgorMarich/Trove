export interface Passenger { firstName: string; lastName: string; birthDate?: string; passportNumber?: string }
export interface BookingInput { offerId:string; providerId:string; passengers:Passenger[]; contact:{email:string;phone?:string;address?:{country:string;city:string;address:string;zip?:string}}; promoCode?:string }
export interface BookingPreviewInput extends BookingInput { idempotencyKey:string }
export const useBookings = () => {
  const api=useApi(); const items=useState<any[]>('bookings',()=>[]); const loading=ref(false)
  const load=async()=>{loading.value=true;try{const r=await api<{items:any[]}>('/api/me/bookings');items.value=r.items}finally{loading.value=false}}
  const create=async(input:BookingInput)=>api<{item:any}>('/api/bookings',{method:'POST',headers:{'Idempotency-Key':crypto.randomUUID()},body:input}).then(r=>r.item)
  const preview=async(input:BookingPreviewInput)=>api<{item:any}>('/api/bookings/preview',{method:'POST',headers:{'Idempotency-Key':input.idempotencyKey},body:input}).then(r=>r.item)
  const confirm=async(id:string,previewToken:string)=>api<{item:any}>(`/api/bookings/${id}/confirm`,{method:'POST',body:{previewToken}}).then(r=>r.item)
  const get=async(id:string)=>api<{item:any}>(`/api/me/bookings/${id}`).then(r=>r.item)
  const cancel=async(id:string)=>api<{item:any}>(`/api/me/bookings/${id}/cancel`,{method:'POST'}).then(r=>r.item)
  const lifecycle=async(id:string)=>api<{items:any[]}>(`/api/me/bookings/${id}/events`).then(r=>r.items)
  const createPaymentIntent=async(bookingId:string)=>api<{item:any}>('/api/payments/intents',{method:'POST',body:{bookingId}}).then(r=>r.item)
  const confirmPayment=async(paymentIntentId:string)=>api<{item:any}>(`/api/payments/intents/${paymentIntentId}/confirm`,{method:'POST'}).then(r=>r.item)
  const reconcilePayment=async(paymentIntentId:string)=>api<{item:any}>(`/api/payments/intents/${paymentIntentId}/reconcile`,{method:'POST'}).then(r=>r.item)
  return {items,loading,load,get,create,preview,confirm,cancel,lifecycle,createPaymentIntent,confirmPayment,reconcilePayment}
}
