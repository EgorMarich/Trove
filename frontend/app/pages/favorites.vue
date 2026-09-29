<template>
  <main class="page">
    <header class="page-head">
      <div>
        <span class="eyebrow"><Heart :size="14" /> Мой Trove</span>
        <h1>Сохранённые<br class="desktop-break" /> путешествия</h1>
        <p>Соберите несколько идей в одном месте — и возвращайтесь к ним, когда будете готовы бронировать.</p>
      </div>
      <NuxtLink to="/tours" class="outline-button"><Search :size="16" /> Найти ещё</NuxtLink>
    </header>

    <div v-if="loading" class="skeleton-grid" aria-label="Загрузка избранного">
      <div v-for="i in 6" :key="i" class="skeleton-card"><div class="sk-image" /><div class="sk-lines"><i /><i /><i /></div></div>
    </div>

    <section v-else-if="!tours.length" class="empty-state">
      <div class="empty-icon"><Heart :size="25" /></div>
      <span class="eyebrow">Пока пусто</span>
      <h2>Здесь можно собирать идеи</h2>
      <p>Нажимайте на сердечко в карточке тура. Сохранённые предложения останутся в вашем аккаунте.</p>
      <NuxtLink to="/tours" class="primary-button">Посмотреть путешествия <ArrowRight :size="17" /></NuxtLink>
    </section>

    <section v-else>
      <div class="result-meta"><span>{{ tours.length }} {{ pluralize(tours.length, 'предложение', 'предложения', 'предложений') }}</span><span>Сохранено в вашем аккаунте</span></div>
      <div class="grid"><TourCard v-for="tour in tours" :key="tour.id" :tour="tour" /></div>
    </section>
  </main>
</template>
<script setup lang="ts">
import { ArrowRight, Heart, Search } from '@lucide/vue'
import TourCard from '@entities/tours/ui/cards/TourCard.vue'
import type { Tour } from '~/types/tours'
import { useAuth } from '../../composables/useAuth';
import { usePersonalization } from '../../composables/usePersonalization';
import { useTours } from '../../composables/useTours';
const auth = useAuth(); const personalization = usePersonalization(); const { getById } = useTours(); const tours = ref<Tour[]>([]); const loading = ref(true)
onMounted(async () => { await auth.load(); if (!auth.user.value) { await navigateTo({ path: '/auth/login', query: { redirect: '/favorites' } }); return } await personalization.load(true); const items = await Promise.all(personalization.favorites.value.map((id) => getById(id))); tours.value = items.filter(Boolean); loading.value = false })
const pluralize = (n:number, one:string, few:string, many:string) => { const m=n%100; const x=n%10; return m>=11&&m<=14?many:x===1?one:x>=2&&x<=4?few:many }
</script>
<style scoped lang="scss">
.page{width:min(1180px,calc(100% - 48px));margin:auto;padding:54px 0 90px}.page-head{display:flex;align-items:end;justify-content:space-between;gap:40px;margin-bottom:38px}.page-head>div{max-width:700px}.eyebrow{display:inline-flex;align-items:center;gap:7px;color:var(--green);font-size:11px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.page-head h1{margin:12px 0 14px;font-family:var(--font-display);font-size:clamp(42px,5vw,66px);line-height:.98;letter-spacing:-.06em}.page-head p{margin:0;max-width:640px;color:var(--ink-2);font-size:16px;line-height:1.65}.outline-button,.primary-button{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:46px;padding:0 15px;border-radius:var(--radius-md);font-size:13px;font-weight:800;text-decoration:none!important;white-space:nowrap}.outline-button{border:1px solid var(--line-strong);background:var(--paper);color:var(--ink)!important}.outline-button:hover{border-color:var(--ink)}.primary-button{background:var(--ink);color:#fff!important}.result-meta{display:flex;justify-content:space-between;gap:20px;padding:0 0 13px;margin-bottom:18px;border-bottom:1px solid var(--line);font-size:12px;color:var(--muted)}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}.empty-state{min-height:440px;display:grid;place-items:center;text-align:center;padding:60px 24px;border:1px solid var(--line);border-radius:var(--radius-xl);background:linear-gradient(145deg,var(--paper),var(--surface));box-shadow:var(--shadow-sm)}.empty-state>*{grid-column:1}.empty-icon{display:grid;place-items:center;width:56px;height:56px;margin-bottom:16px;border-radius:50%;background:var(--brand-soft);color:var(--brand)}.empty-state h2{margin:10px 0 7px;font-family:var(--font-display);font-size:32px;letter-spacing:-.04em}.empty-state p{max-width:500px;margin:0 0 20px;color:var(--muted);font-size:14px;line-height:1.65}.skeleton-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}.skeleton-card{overflow:hidden;border:1px solid var(--line);border-radius:var(--radius-lg);background:var(--paper)}.sk-image{height:250px;background:linear-gradient(90deg,var(--surface) 25%,var(--surface-2) 50%,var(--surface) 75%);background-size:200% 100%;animation:shimmer 1.5s infinite}.sk-lines{padding:18px}.sk-lines i{display:block;height:10px;margin-bottom:10px;border-radius:6px;background:var(--surface-2)}.sk-lines i:nth-child(1){width:45%}.sk-lines i:nth-child(2){width:82%}.sk-lines i:nth-child(3){width:58%}@keyframes shimmer{to{background-position:-200% 0}}@media(max-width:900px){.grid,.skeleton-grid{grid-template-columns:1fr 1fr}}@media(max-width:620px){.page{width:calc(100% - 32px);padding-top:36px}.page-head{display:block}.page-head h1{font-size:43px}.outline-button{margin-top:18px}.result-meta{display:block}.result-meta span+span{display:block;margin-top:5px}.grid,.skeleton-grid{grid-template-columns:1fr}.desktop-break{display:none}}
</style>
