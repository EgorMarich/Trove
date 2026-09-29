<template>
<div>
  <div class="admin-page-head"><div><h1>Dashboard</h1><p>Операционная статистика Trove за выбранный период.</p></div><div class="filters"><select v-model="days" class="select" @change="load"><option :value="7">7 дней</option><option :value="14">14 дней</option><option :value="30">30 дней</option><option :value="90">90 дней</option></select><button class="btn" @click="load">Обновить</button></div></div>
  <div v-if="loading" class="admin-card empty">Загружаем статистику…</div>
  <template v-else>
    <div class="admin-grid four">
      <div class="admin-card"><div class="metric-label">Пользователи</div><div class="metric-value">{{ fmt(data?.users.total) }}</div><div class="metric-meta">+{{ data?.users.newToday }} сегодня · +{{ data?.users.newThisMonth }} за месяц</div></div>
      <div class="admin-card"><div class="metric-label">Бронирования</div><div class="metric-value">{{ fmt(data?.bookings.total) }}</div><div class="metric-meta">{{ data?.bookings.today }} сегодня · {{ data?.bookings.confirmed }} подтверждено</div></div>
      <div class="admin-card"><div class="metric-label">Оборот</div><div class="metric-value">{{ money(data?.bookings.revenue) }}</div><div class="metric-meta">Оплаченные / подтверждённые</div></div>
      <div class="admin-card"><div class="metric-label">Просмотры туров</div><div class="metric-value">{{ fmt(data?.activity?.offer_viewed || 0) }}</div><div class="metric-meta">За последние 30 дней</div></div>
    </div>
    <section class="admin-card trend-card">
      <div class="section-head"><div><h3>Динамика</h3><p class="muted">Новые пользователи и бронирования</p></div></div>
      <div class="trend-chart"><div v-for="(label,i) in trends.labels" :key="label" class="trend-column"><div class="trend-values"><span>{{ trends.users[i] }}</span><span>{{ trends.bookings[i] }}</span></div><div class="bars"><i :style="{height: `${height(trends.users[i], maxTrend)}%`}"></i><b :style="{height: `${height(trends.bookings[i], maxTrend)}%`}"></b></div><small>{{ label }}</small></div></div>
      <div class="legend"><span><i></i> пользователи</span><span><b></b> бронирования</span></div>
    </section>
    <div class="admin-grid two" style="margin-top:16px">
      <section class="admin-card"><h3>Популярные направления</h3><div class="destination-list"><div v-for="item in destinations" :key="item.destination" class="destination"><div class="destination-top"><span>{{ item.destination }}</span><b>{{ item.count }}</b></div><div class="progress"><i :style="{width:`${item.count/maxDestination*100}%`}"></i></div></div><div v-if="!destinations.length" class="empty">Пока нет бронирований</div></div></section>
      <section class="admin-card"><h3>Последние бронирования</h3><div class="list"><NuxtLink v-for="item in data?.recentBookings" :key="item.id" :to="`/admin/bookings/${item.id}`" class="list-row admin-link"><div><b>{{ item.title }}</b><div class="muted">{{ item.first_name }} {{ item.last_name || '' }} · {{ item.destination }}</div></div><strong>{{ money(item.price) }}</strong></NuxtLink><div v-if="!data?.recentBookings?.length" class="empty">Нет данных</div></div></section>
    </div>
  </template>
</div>
</template>
<script setup lang="ts">
definePageMeta({layout:'admin',middleware:'admin'})
const api=useApi();const loading=ref(true);const days=ref(14);const data=ref<any>(null);const trends=ref<any>({labels:[],users:[],bookings:[],revenue:[]})
const load=async()=>{loading.value=true;try{[data.value,trends.value]=await Promise.all([api('/api/admin/dashboard'),api(`/api/admin/dashboard/trends?days=${days.value}`)])}finally{loading.value=false}};await load()
const fmt=(v:any)=>new Intl.NumberFormat('ru-RU').format(Number(v||0));const money=(v:any)=>`${fmt(v)} ₽`;const destinations=computed(()=>data.value?.popularDestinations||[]);const maxDestination=computed(()=>Math.max(1,...destinations.value.map((x:any)=>x.count)));const maxTrend=computed(()=>Math.max(1,...trends.value.users,...trends.value.bookings));const height=(v:number,max:number)=>Math.max(v?4:1,v/max*100)
</script>
<style scoped>
.trend-card{margin-top:16px}.section-head h3{margin:0}.section-head p{margin:5px 0 0}.trend-chart{height:260px;display:flex;align-items:flex-end;gap:8px;border-bottom:1px solid #e9edf2;padding:20px 4px 0;overflow:hidden}.trend-column{height:100%;flex:1;min-width:24px;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:7px}.bars{height:205px;width:100%;display:flex;align-items:flex-end;justify-content:center;gap:3px}.bars i,.bars b{width:10px;display:block;border-radius:4px 4px 0 0}.bars i{background:#172033}.bars b{background:#b8c1ce}.trend-column small{font-size:9px;color:#8993a2;white-space:nowrap}.trend-values{font-size:8px;color:#8993a2;display:flex;gap:5px}.legend{display:flex;gap:18px;margin-top:12px;font-size:11px;color:#7d8797}.legend i,.legend b{display:inline-block;width:8px;height:8px;border-radius:2px;background:#172033;margin-right:5px}.legend b{background:#b8c1ce}.destination-list{display:grid;gap:14px;margin-top:16px}.destination-top{display:flex;justify-content:space-between;font-size:13px;margin-bottom:5px}.progress{height:6px;background:#edf0f4;border-radius:99px;overflow:hidden}.progress i{display:block;height:100%;background:#172033;border-radius:99px}.admin-link{color:inherit;text-decoration:none}.admin-link:hover{opacity:.78}
</style>