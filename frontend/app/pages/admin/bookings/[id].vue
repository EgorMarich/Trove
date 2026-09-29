<template>
  <div v-if="data">
    <div class="admin-page-head"><div><h1>Бронирование</h1><p>{{ data.booking.id }} · {{ data.booking.title }}</p></div><NuxtLink class="btn" to="/admin/bookings">← Все бронирования</NuxtLink></div>
    <div class="admin-grid four">
      <div class="admin-card"><div class="metric-label">Клиент</div><div class="metric-value" style="font-size:18px">{{ data.booking.first_name }} {{ data.booking.last_name || '' }}</div><div class="metric-meta">{{ data.booking.email }}</div></div>
      <div class="admin-card"><div class="metric-label">Сумма</div><div class="metric-value" style="font-size:22px">{{ money(data.booking.price) }}</div><div class="metric-meta">{{ data.booking.payment_status }}</div></div>
      <div class="admin-card"><div class="metric-label">Статус</div><div class="metric-value" style="font-size:18px">{{ data.booking.status }}</div><div class="metric-meta">Provider: {{ data.booking.provider_id }}</div></div>
      <div class="admin-card"><div class="metric-label">Поездка</div><div class="metric-value" style="font-size:18px">{{ data.booking.destination }}</div><div class="metric-meta">{{ date(data.booking.departure_date) }} · {{ data.booking.duration }} ночей</div></div>
    </div>
    <div class="admin-grid two" style="margin-top:16px">
      <section class="admin-card"><h3>История статусов</h3><div class="timeline"><div v-for="e in data.events" :key="e.id" class="timeline-item"><span class="timeline-dot"></span><div><b>{{ e.from_status || '—' }} → {{ e.to_status }}</b><div class="muted">{{ e.type }} · {{ dateTime(e.created_at) }}</div><pre v-if="e.metadata">{{ JSON.stringify(e.metadata, null, 2) }}</pre></div></div><div v-if="!data.events.length" class="empty">Событий нет</div></div></section>
      <section class="admin-card"><h3>Попытки провайдера</h3><div class="list"><div v-for="a in data.attempts" :key="a.id" class="list-row"><div><b>#{{ a.attempt }} · {{ a.provider_id }}</b><div class="muted">{{ a.status }} · {{ a.error_code || 'без ошибки' }}</div><div v-if="a.error_message" class="muted">{{ a.error_message }}</div></div><span class="muted">{{ dateTime(a.created_at) }}</span></div><div v-if="!data.attempts.length" class="empty">Попыток провайдера нет</div></div></section>
    </div>
  </div>
  <div v-else class="admin-card empty">Бронирование не найдено.</div>
</template>
<script setup lang="ts">
definePageMeta({layout:'admin',middleware:'admin'})
const api=useApi(); const route=useRoute(); const data=await api<any>(`/api/admin/bookings/${route.params.id}`).catch(()=>null)
const money=(v:any)=>new Intl.NumberFormat('ru-RU').format(Number(v||0))+' ₽'; const date=(v:string)=>new Date(v).toLocaleDateString('ru-RU'); const dateTime=(v:string)=>new Date(v).toLocaleString('ru-RU')
</script>
<style scoped>
.timeline{display:grid;gap:18px}.timeline-item{display:grid;grid-template-columns:10px 1fr;gap:12px}.timeline-dot{width:9px;height:9px;border-radius:50%;background:#172033;margin-top:6px}.timeline-item pre{white-space:pre-wrap;background:#f7f8fa;padding:10px;border-radius:8px;font-size:11px;margin:8px 0 0;overflow:auto}
</style>
