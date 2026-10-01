<template>
  <div v-if="loading" class="page"><div class="skeleton" aria-label="Загрузка бронирования"></div><div class="skeleton short"></div></div>
  <div v-else-if="booking" class="page">
    <NuxtLink to="/account/bookings" class="back"><ArrowLeft :size="15" /> Мои поездки</NuxtLink>
    <div class="booking-head"><div><span class="kicker">Бронирование {{ String(booking.id).slice(0,8) }}</span><h1>{{ booking.title }}</h1><p class="lead">{{ booking.hotel }} · {{ booking.destination }} · {{ booking.departureDate }}</p></div><div class="status" :class="booking.status"><i /> {{ statusLabel }}</div></div>

    <section class="timeline card">
      <div class="card-title"><div><span class="mini-kicker">Путь бронирования</span><h2>Статус поездки</h2></div><ShieldCheck :size="20" /></div>
      <div v-for="step in lifecycleSteps" :key="step.key" class="timeline-row" :class="step.state">
        <span class="dot">{{ step.state === 'done' ? '✓' : step.state === 'active' ? '•' : '○' }}</span>
        <div><strong>{{ step.label }}</strong><p>{{ step.description }}</p></div>
      </div>
    </section>

    <div class="grid">
      <section class="card"><div class="card-title"><h2>Поездка</h2><MapPin :size="19" /></div><div class="row"><span>Вылет</span><strong>{{ booking.departureDate }}</strong></div><div class="row"><span>Длительность</span><strong>{{ booking.duration }} ночей</strong></div><div class="row"><span>Путешественники</span><strong>{{ booking.passengers.length }}</strong></div></section>
      <section class="card"><div class="card-title"><h2>Оплата</h2><CreditCard :size="19" /></div><div class="row"><span>Стоимость</span><strong>{{ formatPrice(booking.price, booking.currency as never) }}</strong></div><div v-if="booking.discount" class="row"><span>Скидка</span><strong>−{{ formatPrice(booking.discount, booking.currency as never) }}</strong></div><div v-if="booking.promoCode" class="row"><span>Промокод</span><strong>{{ booking.promoCode }}</strong></div><div class="row"><span>Оплата</span><strong>{{ paymentStatusLabel }}</strong></div><p class="note">Оплата проходит отдельным этапом. Trove не хранит данные банковской карты.</p><div v-if="booking.providerOrderId" class="row"><span>Заказ поставщика</span><strong>{{ booking.providerOrderId }}</strong></div><button v-if="canRetryPayment" class="retry" :disabled="retrying" @click="retryPayment">{{ retrying ? 'Создаём оплату…' : 'Повторить оплату' }}</button><button v-if="canCancel" class="cancel" @click="cancel">Отменить бронирование</button><p v-if="cancelError" class="error">{{ cancelError }}</p></section>
    </div>
  </div>
  <div v-else class="page"><div class="empty">🐱 Бронирование не найдено</div></div>
</template>
<script setup lang="ts">
import { ArrowLeft, CreditCard, MapPin, ShieldCheck } from '@lucide/vue'
import { formatPrice } from '@entities/tours/model/tour'
import { useAuth } from '../../../../composables/useAuth';
import { useBookings } from '../../../../composables/useBookings';
const route = useRoute(); const auth = useAuth(); const bookings = useBookings(); const booking = ref<any>(null); const loading = ref(true); const cancelError = ref(''); const retrying = ref(false)
const statusLabel = computed(() => ({pending_payment:'Ожидает оплаты',provider_booking:'Подтверждаем у поставщика',confirmed:'Подтверждено',cancelled:'Отменено',failed:'Не подтверждено',price_changed:'Цена изменилась',payment_failed:'Оплата не прошла',provider_failed:'Ошибка поставщика',expired:'Срок оформления истёк'} as Record<string,string>)[booking.value?.status] || 'В обработке')
const paymentStatusLabel = computed(() => ({pending:'Ожидает оплаты',paid:'Оплачено',failed:'Не оплачено',not_required:'Не требуется'} as Record<string,string>)[booking.value?.paymentStatus] || '—')
const canCancel = computed(() => ['draft','previewed','pending_payment'].includes(booking.value?.status))
const canRetryPayment = computed(() => ['payment_failed'].includes(booking.value?.status) && booking.value?.paymentStatus !== 'paid')
const lifecycleSteps = computed(() => {
  const status = booking.value?.status
  const terminalFailure = ['failed','price_changed','payment_failed','provider_failed','expired','cancelled'].includes(status)
  const stages = [
    { key:'created', label:'Заявка создана', description:'Данные поездки сохранены в Trove.' },
    { key:'payment', label:'Оплата', description: booking.value?.paymentStatus === 'paid' ? 'Оплата подтверждена.' : 'Ожидаем подтверждение оплаты.' },
    { key:'provider', label:'Поставщик', description: status === 'confirmed' ? 'Поставщик подтвердил заказ.' : 'Trove проверяет подтверждение поставщика.' },
    { key:'confirmed', label:'Поездка подтверждена', description: status === 'confirmed' ? 'Можно сохранять поездку в своих планах.' : 'Финальный этап бронирования.' },
  ]
  const order = ['draft','previewed','pending_payment','provider_booking','confirmed']; const current = Math.max(0, order.indexOf(status))
  return stages.map((stage, index) => ({ ...stage, state: status === 'cancelled' ? (index === 0 ? 'done' : 'pending') : terminalFailure ? (index <= current ? 'done' : index === current + 1 ? 'active' : 'pending') : (index < current ? 'done' : index === current ? 'active' : 'pending') }))
})
onMounted(async()=>{ await auth.load(); if(!auth.user.value){ await navigateTo({path:'/auth/login',query:{redirect:`/account/bookings/${route.params.id}`}}); return }; try{ booking.value=await bookings.get(String(route.params.id)) }catch{ booking.value=null } finally{ loading.value=false } })
const retryPayment = async()=>{ if(!booking.value || !canRetryPayment.value || retrying.value)return; retrying.value=true; cancelError.value=''; try{ const intent=await bookings.createPaymentIntent(booking.value.id); if(intent.checkoutUrl){ window.location.assign(intent.checkoutUrl); return }; await navigateTo({path:`/payment/mock/${intent.id}`,query:{bookingId:booking.value.id,previewToken:booking.value.previewToken||''}}) }catch(e){ cancelError.value=e instanceof Error ? e.message : 'Не удалось повторить оплату' }finally{ retrying.value=false } }
const cancel = async()=>{ if(!booking.value || !canCancel.value)return; if(!window.confirm('Отменить это бронирование?'))return; cancelError.value=''; try{ booking.value=await bookings.cancel(booking.value.id) }catch(e){ cancelError.value=e instanceof Error && e.message==='PROVIDER_CANCELLATION_REQUIRED' ? 'Это бронирование уже передано поставщику. Для отмены обратитесь в поддержку Trove.' : (e instanceof Error ? e.message : 'Не удалось отменить бронирование') } }
</script>
<style scoped lang="scss">

.page{width:min(920px,calc(100% - 48px));margin:auto;padding:42px 0 90px}.back{display:inline-flex;align-items:center;gap:7px;color:var(--muted)!important;text-decoration:none!important;font-size:12px;font-weight:800}.booking-head{display:flex;justify-content:space-between;align-items:end;gap:30px;margin:35px 0 30px}.kicker,.mini-kicker{display:inline-flex;align-items:center;gap:6px;color:var(--green);font-size:10px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.page h1{margin:10px 0 8px;font-family:var(--font-display);font-size:clamp(40px,5vw,58px);line-height:1;letter-spacing:-.055em}.lead{margin:0;color:var(--muted);font-size:13px}.status{display:inline-flex;align-items:center;gap:7px;padding:9px 11px;border-radius:999px;background:var(--green-soft);color:var(--green);font-size:10px;font-weight:900;white-space:nowrap}.status i{width:6px;height:6px;border-radius:50%;background:currentColor}.status.cancelled,.status.failed,.status.provider_failed,.status.payment_failed,.status.expired{background:var(--surface);color:var(--muted)}.card{padding:24px;border:1px solid var(--line);border-radius:var(--radius-lg);background:var(--paper);box-shadow:var(--shadow-xs)}.timeline{margin-top:18px}.card-title{display:flex;justify-content:space-between;align-items:start;gap:20px;margin-bottom:18px}.card-title h2{margin:6px 0 0;font-family:var(--font-display);font-size:21px;letter-spacing:-.035em}.card-title>svg{color:var(--muted)}.timeline-row{display:flex;gap:14px;padding:15px 0;border-top:1px solid var(--line)}.dot{width:26px;height:26px;border:1px solid var(--line-strong);border-radius:50%;display:grid;place-items:center;font-size:11px;font-weight:900;flex:none}.timeline-row.done .dot{background:var(--ink);color:#fff;border-color:var(--ink)}.timeline-row.active .dot{border-color:var(--green);color:var(--green)}.timeline-row strong{font-size:12px}.timeline-row p{margin:4px 0 0;color:var(--muted);font-size:11px;line-height:1.5}.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px}.row{display:flex;justify-content:space-between;gap:20px;border-top:1px solid var(--line);padding:13px 0;font-size:12px}.row span{color:var(--muted)}.row strong{text-align:right}.note,.error{font-size:11px;line-height:1.5}.note{color:var(--muted)}.retry,.cancel{min-height:40px;padding:0 13px;border-radius:10px;font-size:11px;font-weight:800;cursor:pointer}.retry{margin-right:10px;border:0;background:var(--ink);color:#fff}.retry:disabled{opacity:.55}.cancel{border:1px solid var(--line-strong);background:var(--paper);color:var(--danger)}.error{color:var(--danger)}.skeleton{height:160px;border-radius:var(--radius-lg);background:linear-gradient(90deg,var(--surface) 25%,var(--surface-2) 50%,var(--surface) 75%);background-size:200% 100%;animation:shimmer 1.5s infinite}.skeleton.short{width:60%;height:40px;margin-top:15px}@keyframes shimmer{to{background-position:-200% 0}}.empty{display:grid;place-items:center;min-height:300px;border:1px solid var(--line);border-radius:var(--radius-lg);color:var(--muted)}@media(max-width:700px){.page{width:calc(100% - 32px)}.booking-head{display:block}.status{margin-top:18px}.grid{grid-template-columns:1fr}.card{padding:19px}}
</style>