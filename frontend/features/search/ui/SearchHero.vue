<template>
  <section class="hero">
    <div class="hero-inner trove-container">
      <div class="hero-top">
        <div class="hero-copy">
          <h1>Хорошая поездка<br /><em>начинается с поиска.</em></h1>
          <p>Собираем туры из разных источников, показываем важные условия рядом и помогаем понять, за что вы платите.</p>
          <div class="hero-proof">
            <span><ShieldCheck :size="17" /> Цена проверяется перед бронированием</span>
            <span><Star :size="16" fill="currentColor" /> 4.8 средняя оценка</span>
          </div>
        </div>
        <div class="hero-gallery" aria-hidden="true">
          <div class="gallery-main"><img src="https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1400&q=88" alt="" @error="fallbackImage" /></div>
          <div class="gallery-side"><img src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=700&q=88" alt="" @error="fallbackImage" /></div>
          <div class="gallery-card"><b>120 000+</b><span>вариантов поездок</span></div>
        </div>
      </div>

      <form class="search-shell" @submit.prevent="submit">
        <div class="search-head">
          <div class="search-tabs"><button class="search-tab active" type="button">Туры</button><button class="search-tab" type="button" disabled>Отели <small>скоро</small></button></div>
          <span>Найдите направление, даты и состав поездки</span>
        </div>
        <div class="search-grid">
          <div ref="destinationRoot" class="search-field destination" :class="{ open: destinationOpen }">
            <MapPin :size="20" class="field-icon" />
            <div class="field-content"><label for="destination">Куда</label><input id="destination" v-model="destinationQuery" autocomplete="off" placeholder="Страна или город" @focus="destinationOpen = true" /></div>
            <ChevronDown :size="17" class="field-chevron" />
            <div v-if="destinationOpen" class="suggestions">
              <div class="suggestions-head"><div><strong>Куда поедем?</strong><span>Выберите страну или город</span></div><button type="button" @click="destinationOpen = false"><X :size="17" /></button></div>
              <div class="suggestions-list">
                <button v-for="country in filteredCountries" :key="country.code" type="button" class="suggestion" @click="selectCountry(country)">
                  <span class="flag">{{ country.flag }}</span><span class="suggestion-copy"><b>{{ country.name }}</b><small>{{ country.cities.slice(0, 4).join(' · ') }}</small></span><ArrowRight :size="16" />
                </button>
                <div v-if="!filteredCountries.length" class="suggestion-empty">Не нашли направление. Попробуйте город или страну.</div>
              </div>
            </div>
          </div>
          <label class="search-field"><Plane :size="20" class="field-icon" /><span class="field-content"><span>Откуда</span><input v-model="form.departure" placeholder="Город вылета" /></span></label>
          <div class="search-field date-field"><DateRangePicker v-model="dateRange" mode="range" /></div>
          <div class="search-field guests"><GuestPicker v-model:adults="form.adults" v-model:children="form.children" /></div>
          <button class="search-submit" type="submit" :disabled="loading"><span v-if="loading" class="spinner"></span><Search v-else :size="19" /><span>{{ loading ? 'Ищем…' : 'Найти тур' }}</span></button>
        </div>
        <div class="quick-row"><span>Популярно сейчас</span><div><button v-for="item in quick" :key="item.name" type="button" @click="quickSearch(item.name)">{{ item.flag }} {{ item.name }}</button></div></div>
      </form>
    </div>
  </section>
</template>
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { ArrowRight, ChevronDown, MapPin, Plane, Search, ShieldCheck, Star, X } from '@lucide/vue'
import GuestPicker from '@shared/ui/guests/GuestPicker.vue'
import DateRangePicker, { type DateRangeValue } from '@shared/ui/datePicker/DateRangePicker.vue'
import { COUNTRIES, POPULAR_COUNTRIES, type CountryOption } from '@shared/config/countries'
import { useAnalytics } from '@composables/useAnalytics'
const emit = defineEmits<{ search: [payload: { destination: string; departure: string; date: string; dateTo: string; guests: number; children: number }] }>()
const analytics = useAnalytics(); const destinationQuery = ref(''); const destinationOpen = ref(false); const loading = ref(false); const destinationRoot = ref<HTMLElement | null>(null)
const form = reactive({ departure: 'Москва', dateFrom: '', dateTo: '', adults: 2, children: 0 });
const dateRange = computed<DateRangeValue>({ get: () => ({ from: form.dateFrom, to: form.dateTo }), set: (value) => { form.dateFrom = value.from; form.dateTo = value.to } }); const quick = POPULAR_COUNTRIES.slice(0, 5)
const fallback = '/images/trove-landscape.svg'
const filteredCountries = computed(() => { const q = destinationQuery.value.trim().toLowerCase(); return (q ? COUNTRIES.filter(c => c.name.toLowerCase().includes(q) || c.cities.some(city => city.toLowerCase().includes(q))) : POPULAR_COUNTRIES).slice(0, 8) })
const selectCountry = (country: CountryOption) => { destinationQuery.value = country.name; destinationOpen.value = false }
const quickSearch = (destination: string) => { destinationQuery.value = destination; void submit() }
const submit = async () => { if (!destinationQuery.value.trim()) { destinationOpen.value = true; return }; loading.value = true; void analytics.track('search_submitted', { destination: destinationQuery.value, departure: form.departure, guests: form.adults + form.children }); await new Promise(resolve => setTimeout(resolve, 520)); emit('search', { destination: destinationQuery.value, departure: form.departure, date: form.dateFrom, dateTo: form.dateTo, guests: form.adults, children: form.children }); loading.value = false }
const close = (event: MouseEvent) => { if (destinationRoot.value && !destinationRoot.value.contains(event.target as Node)) destinationOpen.value = false }
const fallbackImage = (event: Event) => { const image = event.target as HTMLImageElement; if (!image.src.endsWith(fallback)) image.src = fallback }
onMounted(() => document.addEventListener('click', close)); onBeforeUnmount(() => document.removeEventListener('click', close))
</script>
<style scoped lang="scss">
.hero {
  position: relative;
  overflow: visible;
  background: var(--forest);
  color: #fff;
}
.hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 78% 8%, rgba(82,151,116,.24), transparent 30%),
    linear-gradient(180deg, #123c2b 0%, #0e3023 100%);
}
.hero-inner { position: relative; padding: 58px 0 34px; }

.hero-top {
  display: grid;
  grid-template-columns: minmax(0,1fr) 510px;
  gap: 56px;
  align-items: center;
  min-height: 410px;
}
.hero-copy { max-width: 700px; }

.eyebrow {
  display: inline-flex; align-items: center; gap: 9px;
  color: #b9d4c6; font-size: 13px; font-weight: 700;
}
.eyebrow span {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--brand); box-shadow: 0 0 0 5px rgba(255,103,77,.13);
}

h1 {
  margin: 18px 0 17px;
  font-family: var(--font-display);
  font-size: clamp(50px,5.5vw,76px);
  line-height: .98; font-weight: 800; letter-spacing: -.065em; color: #fff;
}
h1 em { font-style: normal; color: #ff8e78; }
.hero-copy > p { max-width: 610px; margin: 0; color: #d2ded7; font-size: 17px; line-height: 1.65; }

.hero-proof {
  display: flex; flex-wrap: wrap; gap: 12px 22px; margin-top: 24px;
}
.hero-proof span {
  display: inline-flex; align-items: center; gap: 7px;
  color: #e4ece7; font-size: 13px; font-weight: 700;
}
.hero-proof span:first-child svg { color: #8bd1ac; }

.hero-gallery { position: relative; height: 410px; }
.gallery-main,.gallery-side {
  position: absolute; overflow: hidden; box-shadow: 0 24px 60px rgba(0,0,0,.24);
}
.gallery-main { inset: 0 78px 34px 0; border-radius: 24px; }
.gallery-side {
  right: 0; bottom: 0; width: 200px; height: 150px;
  border: 7px solid var(--forest); border-radius: 20px;
}
.gallery-main img,.gallery-side img {
  width: 100%; height: 100%; display: block; object-fit: cover;
}
.gallery-card {
  position: absolute; left: -20px; bottom: 2px;
  display: flex; align-items: center; gap: 10px; padding: 13px 15px;
  background: #fff; color: var(--ink); border-radius: 13px;
  box-shadow: var(--shadow-md);
}
.gallery-card b { font-family: var(--font-display); font-size: 19px; }
.gallery-card span { color: var(--muted); font-size: 12px; }

.search-shell {
  position: relative; z-index: 20; margin-top: 8px; padding: 14px;
  background: #fff; color: var(--ink); border: 1px solid #d8e0da;
  border-radius: 20px; box-shadow: 0 22px 60px rgba(0,0,0,.18);
}
.search-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 3px 11px;
}
.search-head > span { color: var(--muted); font-size: 12px; }
.search-tabs { display: flex; gap: 4px; }
.search-tab {
  min-height: 34px; padding: 0 13px; border: 0; border-radius: 9px;
  background: transparent; color: var(--muted); font-size: 13px; font-weight: 800;
}
.search-tab.active { background: var(--surface); color: var(--ink); }
.search-tab:disabled { opacity: .55; }
.search-tab small { margin-left: 4px; font-size: 10px; }

.search-grid {
  display: grid;
  grid-template-columns: 1.55fr 1.05fr 1fr 1.25fr 158px;
  border: 1px solid var(--line-strong);
  border-radius: 14px; overflow: visible;
}
.search-field {
  position: relative; display: flex; align-items: center; gap: 11px;
  min-width: 0; min-height: 76px; padding: 11px 15px;
  border-right: 1px solid var(--line); background: #fff;
}
.search-field:first-child { border-radius: 13px 0 0 13px; }
.field-icon { flex: 0 0 auto; color: var(--green); }
.field-content { min-width: 0; flex: 1; }
.field-content > span,.field-content > label {
  display: block; margin-bottom: 5px; color: var(--muted);
  font-size: 11px; line-height: 1; font-weight: 800;
}
.field-content input {
  width: 100%; min-width: 0; padding: 0; border: 0; outline: 0;
  background: transparent; color: var(--ink); font-size: 15px; font-weight: 700;
}
.field-content input::placeholder { color: #9aa49e; font-weight: 600; }
.field-chevron { color: var(--muted-2); }

.guests { padding: 0; border-right: 0; }
.date-field { padding: 0; overflow: visible; }
.search-submit {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  margin: 6px; border: 0; border-radius: 11px;
  background: var(--brand); color: #fff; font-size: 14px; font-weight: 800;
  cursor: pointer; transition: background .2s var(--ease), transform .2s var(--ease), box-shadow .2s var(--ease);
}
.search-submit:hover { background: var(--brand-dark); transform: translateY(-1px); box-shadow: 0 8px 20px rgba(255,103,77,.24); }
.search-submit:disabled { opacity: .7; cursor: wait; transform: none; }

.quick-row { display: flex; align-items: center; gap: 14px; padding: 9px 2px 0; }
.quick-row > span { color: var(--muted); font-size: 11px; font-weight: 800; white-space: nowrap; }
.quick-row > div { display: flex; flex-wrap: wrap; gap: 6px; }
.quick-row button {
  padding: 6px 9px; border: 1px solid var(--line); border-radius: 8px;
  background: #fff; color: var(--ink-2); font-size: 11px; font-weight: 700; cursor: pointer;
}
.quick-row button:hover { background: var(--surface); border-color: var(--line-strong); }

.suggestions {
  position: absolute; left: -1px; right: -1px; top: calc(100% + 9px);
  min-width: 410px; max-width: min(450px,calc(100vw - 32px));
  padding: 8px; background: #fff; border: 1px solid var(--line-strong);
  border-radius: 16px; box-shadow: var(--shadow-lg); z-index: 100;
}
.suggestions-head {
  display: flex; justify-content: space-between; gap: 12px;
  padding: 9px 9px 12px; border-bottom: 1px solid var(--line);
}
.suggestions-head strong,.suggestions-head span { display: block; }
.suggestions-head strong { font-family: var(--font-display); font-size: 17px; }
.suggestions-head span { margin-top: 3px; color: var(--muted); font-size: 11px; }
.suggestions-head button {
  display: grid; place-items: center; width: 32px; height: 32px;
  border: 0; border-radius: 9px; background: var(--surface); color: var(--ink); cursor: pointer;
}
.suggestion {
  display: flex; align-items: center; gap: 11px; width: 100%; padding: 12px 9px;
  border: 0; border-radius: 10px; background: #fff; color: var(--ink);
  text-align: left; cursor: pointer;
}
.suggestion:hover { background: var(--surface); }
.flag { display: grid; place-items: center; width: 34px; font-size: 22px; }
.suggestion-copy { min-width: 0; flex: 1; }
.suggestion-copy b,.suggestion-copy small { display: block; }
.suggestion-copy b { font-size: 14px; }
.suggestion-copy small {
  margin-top: 3px; overflow: hidden; color: var(--muted);
  font-size: 11px; white-space: nowrap; text-overflow: ellipsis;
}
.suggestion-empty { padding: 20px 10px; color: var(--muted); font-size: 12px; }

@media(max-width:1050px) {
  .hero-top { grid-template-columns: 1fr 410px; gap: 30px; }
  .search-grid { grid-template-columns: 1.4fr 1fr 1fr 1.15fr; }
  .search-submit { grid-column: span 4; min-height: 54px; }
  .search-field:nth-child(4) { border-right: 0; border-top: 1px solid var(--line); }
}
@media(max-width:800px) {
  .hero-inner { padding: 40px 0 24px; }
  .hero-top { display: block; min-height: 0; }
  .hero-gallery { height: 280px; margin-top: 30px; }
  .gallery-main { inset: 0 50px 20px 0; }
  .gallery-side { width: 150px; height: 110px; }
  .gallery-card { left: 0; }
  .search-shell { margin-top: 20px; }
  .search-head { display: block; }
  .search-head > span { display: block; margin-top: 8px; }
  .search-grid { grid-template-columns: 1fr 1fr; }
  .search-field:nth-child(2) { border-right: 0; }
  .search-field:nth-child(3),.search-field:nth-child(4) { border-top: 1px solid var(--line); }
  .search-field:nth-child(3) { border-right: 1px solid var(--line); }
  .search-submit { grid-column: span 2; min-height: 54px; }
  .quick-row { display: block; }
  .quick-row > span { display: block; margin-bottom: 7px; }
  .suggestions { min-width: 0; width: calc(100vw - 48px); }
}
@media(max-width:520px) {
  h1 { font-size: 48px; }
  .hero-copy > p { font-size: 16px; }
  .hero-proof { display: block; }
  .hero-proof span { display: flex; margin-top: 9px; }
  .hero-gallery { height: 220px; }
  .search-grid { grid-template-columns: 1fr; }
  .search-field,.search-field:nth-child(2),.search-field:nth-child(3),.search-field:nth-child(4) {
    border-right: 0; border-top: 1px solid var(--line); border-radius: 0;
  }
  .search-field:first-child { border-top: 0; border-radius: 12px 12px 0 0; }
  .search-submit { grid-column: auto; }
}
</style>
