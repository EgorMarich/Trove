<template>
  <div class="marketing-page">
    <div class="shell">
      <header class="hero">
        <div>
          <span class="eyebrow">TROVE MARKETING OS · v2.0</span>
          <h1>Маркетинг, который<br /><em>смотрит на данные.</em></h1>
          <p>Собираем поведение пользователей, находим возможности роста и превращаем их в кампании, автоматизации и контент.</p>
        </div>
        <div class="hero-actions"><NuxtLink to="/admin/marketing/campaigns" class="primary">Создать кампанию</NuxtLink><NuxtLink to="/admin/marketing/ai" class="secondary">Спросить AI</NuxtLink></div>
      </header>

      <nav class="subnav">
        <NuxtLink to="/admin/marketing">Overview</NuxtLink><NuxtLink to="/admin/marketing/campaigns">Кампании</NuxtLink><NuxtLink to="/admin/marketing/audiences">Аудитории</NuxtLink><NuxtLink to="/admin/marketing/automations">Автоматизации</NuxtLink><NuxtLink to="/admin/marketing/content">Контент</NuxtLink><NuxtLink to="/admin/marketing/analytics">Аналитика</NuxtLink><NuxtLink to="/admin/marketing/ai">AI</NuxtLink><NuxtLink to="/admin/marketing/customers">Customers</NuxtLink><NuxtLink to="/admin/marketing/intent">Intent</NuxtLink>
      </nav>

      <section class="metric-grid">
        <article v-for="metric in metrics" :key="metric.label" class="metric"><span>{{ metric.label }}</span><strong>{{ metric.value }}</strong><small>{{ metric.note }}</small></article>
      </section>

      <section class="content-grid">
        <div class="panel funnel"><div class="panel-head"><div><span class="eyebrow">FUNNEL</span><h2>От интереса до бронирования</h2></div><span class="live">● LIVE DATA</span></div><div v-for="item in funnel" :key="item.label" class="funnel-row"><div><span>{{ item.label }}</span><b>{{ item.value.toLocaleString('ru-RU') }}</b></div><div class="bar"><i :style="{width: `${item.percent}%`}"></i></div><small>{{ item.percent }}%</small></div></div>
        <div class="panel opportunities"><div class="panel-head"><div><span class="eyebrow">AI INSIGHTS</span><h2>Что стоит сделать</h2></div></div><article v-for="item in opportunities" :key="item.id" class="opportunity" :class="item.severity"><div class="dot"></div><div><strong>{{ item.title }}</strong><p>{{ item.description }}</p><NuxtLink :to="item.action === 'Создать кампанию' ? '/admin/marketing/campaigns' : '/admin/marketing/ai'">{{ item.action }} →</NuxtLink></div></article></div>
      </section>

      <section class="panel next"><div><span class="eyebrow">MARKETING LOOP</span><h2>События → аудитории → кампании → результат</h2><p>Это фундамент, на котором дальше можно строить персональные сценарии, win-back, price alerts, контент и контролируемую работу с рекламными каналами.</p></div><div class="loop"><span>EVENTS</span><b>→</b><span>AUDIENCES</span><b>→</b><span>CAMPAIGNS</span><b>→</b><span>REVENUE</span></div></section>
    </div>
    <section class="personalization-link"><div><span>PERSONALIZATION ENGINE</span><h2>Персональные рекомендации</h2><p>Customer 360 → Intent → Recommendation → Conversion.</p></div><NuxtLink to="/admin/marketing/personalization">Открыть →</NuxtLink></section>
  </div>
</template>
<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin'] })
const api = useApi()
const overview = ref<any>({ visitors:0, searches:0, tourViews:0, bookingStarts:0, bookings:0, conversionRate:0, attributedRevenue:0, audiences:0, activeCampaigns:0, opportunities:[] })
onMounted(async () => { try { overview.value = await api('/api/marketing/overview') } catch { /* admin guard handles access */ } })
const metrics = computed(() => [
  { label:'Посетители', value: overview.value.visitors.toLocaleString('ru-RU'), note:'за выбранный период' },
  { label:'Поиски', value: overview.value.searches.toLocaleString('ru-RU'), note:'сигнал интереса' },
  { label:'Бронирования', value: overview.value.bookings.toLocaleString('ru-RU'), note:`конверсия ${overview.value.conversionRate}%` },
  { label:'Marketing revenue', value:`₽${Math.round(overview.value.attributedRevenue/1000)}K`, note:`${overview.value.activeCampaigns} активных кампаний` },
])
const funnel = computed(() => { const v=overview.value; const max=Math.max(v.visitors,1); return [{label:'Посетители',value:v.visitors,percent:100},{label:'Поиск',value:v.searches,percent:Math.round(v.searches/max*100)},{label:'Просмотр тура',value:v.tourViews,percent:Math.round(v.tourViews/max*100)},{label:'Начали booking',value:v.bookingStarts,percent:Math.round(v.bookingStarts/max*100)},{label:'Бронирование',value:v.bookings,percent:Math.round(v.bookings/max*100)}] })
const opportunities = computed(() => overview.value.opportunities || [])
</script>
<style scoped lang="scss">
.marketing-page{min-height:calc(100vh - 76px);background:#f5f6f3;color:#14251e;padding:34px 0 80px}.shell{max-width:1240px;margin:auto;padding:0 24px}.hero{display:flex;justify-content:space-between;gap:40px;padding:34px 0 28px}.eyebrow{font-size:11px;letter-spacing:.11em;font-weight:800;color:#668177}.hero h1{font:800 54px/1.02 Manrope,Inter,sans-serif;letter-spacing:-.045em;margin:10px 0 16px}.hero h1 em{font-style:normal;color:#1f8f63}.hero p{max-width:650px;font:16px/1.65 Inter,sans-serif;color:#65746e;margin:0}.hero-actions{display:flex;align-items:flex-end;gap:10px}.hero-actions a{padding:12px 16px;border-radius:11px;text-decoration:none;font:700 13px Inter}.primary{background:#17382c;color:white}.secondary{background:white;border:1px solid #dce3de;color:#17382c}.subnav{display:flex;gap:4px;overflow:auto;padding:7px;background:#fff;border:1px solid #dfe5e1;border-radius:13px;box-shadow:0 5px 20px rgba(18,39,30,.04)}.subnav a{padding:10px 13px;border-radius:8px;color:#607069;text-decoration:none;font:700 12px Inter;white-space:nowrap}.subnav a.router-link-active{background:#edf6f1;color:#177c54}.metric-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:16px 0}.metric,.panel{background:#fff;border:1px solid #dfe5e1;border-radius:16px}.metric{padding:20px}.metric span,.metric small{display:block;color:#74827c;font:600 12px Inter}.metric strong{display:block;font:800 31px Manrope;margin:9px 0 4px;letter-spacing:-.04em}.content-grid{display:grid;grid-template-columns:1.35fr .85fr;gap:12px}.panel{padding:22px}.panel-head{display:flex;justify-content:space-between;gap:20px;align-items:flex-start}.panel h2,.next h2{font:800 23px Manrope;margin:6px 0 20px;letter-spacing:-.035em}.live{font:700 10px Inter;color:#258a60;background:#edf7f1;padding:7px 9px;border-radius:7px}.funnel-row{display:grid;grid-template-columns:160px 1fr 50px;align-items:center;gap:14px;margin:15px 0}.funnel-row>div:first-child{display:flex;justify-content:space-between;gap:8px}.funnel-row span,.funnel-row b,.funnel-row small{font:600 12px Inter}.funnel-row b{font-weight:800}.funnel-row small{text-align:right;color:#76847d}.bar{height:10px;background:#edf1ee;border-radius:99px;overflow:hidden}.bar i{display:block;height:100%;background:#2c9b6d;border-radius:inherit}.opportunity{display:flex;gap:12px;padding:14px 0;border-top:1px solid #e8ece9}.opportunity:first-of-type{border-top:0}.opportunity .dot{width:9px;height:9px;border-radius:50%;background:#2c9b6d;margin-top:6px;flex:0 0 auto}.opportunity.warning .dot{background:#e6a43c}.opportunity.info .dot{background:#5b87d9}.opportunity strong{font:800 13px Inter}.opportunity p{font:13px/1.55 Inter;color:#6d7b74;margin:5px 0}.opportunity a{font:700 12px Inter;color:#177c54;text-decoration:none}.next{display:flex;justify-content:space-between;gap:40px;margin-top:12px;align-items:center}.next p{max-width:600px;color:#68766f;font:14px/1.6 Inter}.loop{display:flex;align-items:center;gap:9px;flex-wrap:wrap;justify-content:flex-end}.loop span{padding:10px 11px;border:1px solid #dfe5e1;border-radius:9px;background:#f7f9f7;font:800 10px Inter}.loop b{color:#65a084}@media(max-width:900px){.hero{display:block}.hero-actions{margin-top:20px}.metric-grid{grid-template-columns:1fr 1fr}.content-grid{grid-template-columns:1fr}.next{display:block}.loop{justify-content:flex-start;margin-top:18px}}@media(max-width:600px){.hero h1{font-size:40px}.metric-grid{grid-template-columns:1fr}.funnel-row{grid-template-columns:1fr}.funnel-row small{text-align:left}}
.personalization-link{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-top:16px;padding:20px;border:1px solid #dfe7e1;border-radius:16px;background:#f3f7f3}.personalization-link span{font-size:10px;letter-spacing:.1em;font-weight:900;color:#5c886a}.personalization-link h2{margin:5px 0;font:800 20px/1.1 var(--font-display)}.personalization-link p{margin:0;color:#758178;font-size:12px}.personalization-link a{padding:10px 13px;border-radius:9px;background:#fff;border:1px solid #dfe7e1;color:#17221b!important;text-decoration:none!important;font-size:12px;font-weight:800}@media(max-width:650px){.personalization-link{display:block}.personalization-link a{display:inline-block;margin-top:14px}}
</style>
