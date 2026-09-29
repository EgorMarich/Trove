<template>
  <div class="page">
    <header class="head">
      <div><span class="kicker">Personalization Engine</span><h1>Персонализация</h1><p>Как поведение пользователя превращается в рекомендации и персональные предложения.</p></div>
      <NuxtLink to="/admin/marketing" class="back">Marketing OS</NuxtLink>
    </header>
    <section class="stats">
      <article><span>Рекомендации</span><strong>{{ overview.recommendations }}</strong><small>выдано сегодня</small></article>
      <article><span>CTR</span><strong>{{ overview.ctr }}%</strong><small>клики рекомендаций</small></article>
      <article><span>Персональный uplift</span><strong>+{{ overview.uplift }}%</strong><small>против базовой выдачи</small></article>
      <article><span>High Intent</span><strong>{{ overview.highIntent }}</strong><small>пользователей</small></article>
    </section>
    <section class="layout">
      <div class="panel"><div class="panel-head"><div><h2>Правила ранжирования</h2><p>Сигналы, которые влияют на персональную выдачу.</p></div><span class="status">ACTIVE</span></div>
        <div class="rules"><div v-for="rule in rules" :key="rule.name"><b>{{ rule.name }}</b><span>{{ rule.description }}</span><strong>+{{ rule.weight }}</strong></div></div>
      </div>
      <div class="panel"><div class="panel-head"><div><h2>Последние рекомендации</h2><p>Пример персональной выдачи.</p></div></div>
        <div class="recommendations"><article v-for="item in recommendations" :key="item.id"><div class="score">{{ item.score }}</div><div><b>{{ item.title }}</b><span>{{ item.destination }} · {{ item.price.toLocaleString('ru-RU') }} ₽</span><small>{{ item.reason }}</small></div></article></div>
      </div>
    </section>
    <section class="flow"><div><span>01</span><b>Customer 360</b><small>интересы и поведение</small></div><i>→</i><div><span>02</span><b>Intent Score</b><small>вероятность покупки</small></div><i>→</i><div><span>03</span><b>Recommendation</b><small>персональная выдача</small></div><i>→</i><div><span>04</span><b>Conversion</b><small>клик и бронирование</small></div></section>
  </div>
</template>
<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin'] })
const overview = { recommendations: 1842, ctr: 14.8, uplift: 22, highIntent: 342 }
const rules = [
  { name: 'Любимые направления', description: 'Повышаем предложения стран и городов из истории пользователя', weight: 20 },
  { name: 'Бюджет', description: 'Сохраняем привычный диапазон цены', weight: 12 },
  { name: 'Длительность', description: 'Сопоставляем продолжительность поездки', weight: 10 },
  { name: 'Hotel preference', description: 'Учитываем привычный класс отеля', weight: 8 },
  { name: 'High intent', description: 'Добавляем качественные предложения пользователям с высоким intent', weight: 5 },
]
const recommendations = [
  { id: '1', title: 'Lara Family Club', destination: 'Анталья', price: 119900, score: 96, reason: 'В вашем бюджете · 8 ночей · Турция' },
  { id: '2', title: 'Akra Antalya', destination: 'Анталья', price: 137500, score: 94, reason: 'Подходит по длительности · 5★' },
  { id: '3', title: 'Rixos Premium', destination: 'Белек', price: 148900, score: 92, reason: 'Вы интересовались Турцией · 7 ночей' },
]
</script>
<style scoped lang="scss">
.page{max-width:1180px;margin:0 auto;padding:38px 24px 70px;color:#17221b}.head{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;margin-bottom:26px}.kicker{font-size:11px;text-transform:uppercase;letter-spacing:.12em;font-weight:800;color:#56866a}.head h1{margin:7px 0 7px;font:800 38px/1 var(--font-display);letter-spacing:-.045em}.head p,.panel-head p{margin:0;color:#738078;font-size:13px}.back{padding:10px 14px;border:1px solid #dfe6e1;border-radius:10px;color:#17221b!important;text-decoration:none!important;font-size:12px;font-weight:800;background:#fff}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px}.stats article{padding:18px;border:1px solid #e1e7e2;border-radius:14px;background:#fff}.stats span,.stats small{display:block;color:#78847d;font-size:11px}.stats strong{display:block;margin:8px 0 3px;font:800 28px/1 var(--font-display);letter-spacing:-.04em}.layout{display:grid;grid-template-columns:1fr 1fr;gap:16px}.panel{padding:20px;border:1px solid #e1e7e2;border-radius:16px;background:#fff}.panel-head{display:flex;justify-content:space-between;gap:15px;margin-bottom:16px}.panel h2{margin:0 0 5px;font:800 19px/1.1 var(--font-display);letter-spacing:-.03em}.status{height:max-content;padding:6px 8px;border-radius:7px;background:#e7f4eb;color:#2e7147;font-size:9px;font-weight:900}.rules>div{display:grid;grid-template-columns:145px 1fr 42px;gap:12px;align-items:center;padding:13px 0;border-top:1px solid #edf0ee}.rules b{font-size:12px}.rules span{font-size:11px;color:#7a857f;line-height:1.45}.rules strong{font-size:12px;text-align:right;color:#3d8057}.recommendations article{display:grid;grid-template-columns:42px 1fr;gap:12px;padding:13px 0;border-top:1px solid #edf0ee}.score{display:grid;place-items:center;width:38px;height:38px;border-radius:10px;background:#edf6ef;color:#39764e;font-weight:900;font-size:13px}.recommendations b,.recommendations span,.recommendations small{display:block}.recommendations b{font-size:13px}.recommendations span{margin-top:3px;font-size:11px;color:#6f7c74}.recommendations small{margin-top:5px;font-size:10px;color:#8a958f}.flow{display:grid;grid-template-columns:1fr 35px 1fr 35px 1fr 35px 1fr;align-items:center;gap:8px;margin-top:16px;padding:18px;border:1px solid #e1e7e2;border-radius:16px;background:#f4f7f4}.flow div{padding:13px;background:#fff;border-radius:11px;border:1px solid #e2e8e3}.flow span,.flow small{display:block;color:#7c887f;font-size:10px}.flow b{display:block;margin:5px 0;font-size:12px}.flow i{text-align:center;color:#78927e;font-style:normal}@media(max-width:850px){.stats{grid-template-columns:1fr 1fr}.layout{grid-template-columns:1fr}.flow{grid-template-columns:1fr 25px 1fr}}@media(max-width:560px){.head{display:block}.back{display:inline-block;margin-top:16px}.stats{grid-template-columns:1fr}.flow{display:block}.flow i{display:block;padding:8px}.rules>div{grid-template-columns:1fr 35px}.rules span{grid-column:1/3}.rules strong{grid-column:2;grid-row:1}}
</style>
