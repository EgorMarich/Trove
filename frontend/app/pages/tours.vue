<template>
  <div class="tours-page">
    <section class="results-header">
      <div class="trove-container">
        <div class="crumbs"><NuxtLink to="/">Главная</NuxtLink><ChevronRight :size="14" /><span>Туры</span></div>
        <div class="header-row">
          <div><span class="section-kicker">Результаты поиска</span><h1>{{ title }}</h1><p>{{ filteredTours.length }} предложений · сравнили {{ providers }} источника</p></div>
          <NuxtLink to="/" class="change-search"><Search :size="17" /> Изменить поиск</NuxtLink>
        </div>
      </div>
    </section>

    <section class="trove-container search-summary">
      <div class="summary-item"><MapPin :size="18" /><div><small>Куда</small><strong>{{ route.query.destination || 'Любое направление' }}</strong></div></div>
      <div class="summary-item"><Plane :size="18" /><div><small>Откуда</small><strong>{{ route.query.departure || 'Москва' }}</strong></div></div>
      <div class="summary-item"><CalendarDays :size="18" /><div><small>Дата</small><strong>{{ dateSummary }}</strong></div></div>
      <div class="summary-item"><Users :size="18" /><div><small>Путешественники</small><strong>{{ route.query.guests || 2 }} взрослых{{ route.query.children ? ` · ${route.query.children} детей` : '' }}</strong></div></div>
      <NuxtLink to="/" class="summary-button">Изменить</NuxtLink>
    </section>

    <div class="mobile-filter-bar trove-container">
      <button class="mobile-filter-trigger" type="button" @click="filtersOpen=true"><SlidersHorizontal :size="17" /> Фильтры <span v-if="activeFilterCount">{{ activeFilterCount }}</span></button>
      <span>{{ filteredTours.length }} вариантов</span>
    </div>

    <div v-if="filtersOpen" class="filter-backdrop" @click="filtersOpen=false"></div>
    <section class="trove-container results-layout">
      <aside class="filters" :class="{ open: filtersOpen }" aria-label="Фильтры поиска">
        <div class="filters-mobile-head"><div><SlidersHorizontal :size="18" /><b>Фильтры</b><span v-if="activeFilterCount">{{ activeFilterCount }}</span></div><button type="button" aria-label="Закрыть фильтры" @click="filtersOpen=false"><X :size="19" /></button></div>

        <div class="filters-head"><div><SlidersHorizontal :size="18" /><b>Настроить поиск</b></div><button type="button" @click="resetFilters">Сбросить всё</button></div>

        <div class="filter-scroll">
          <section class="filter-block price-block">
            <div class="filter-title"><label>Цена за человека</label><span>{{ formatPrice(draft.priceFrom) }} — {{ formatPrice(draft.priceTo) }}</span></div>
            <div class="range-wrap" :style="{ '--from': `${priceFromPercent}%`, '--to': `${priceToPercent}%` }">
              <div class="range-track"></div><div class="range-fill"></div>
              <input v-model.number="draft.priceFrom" class="range-input" type="range" :min="PRICE_MIN" :max="PRICE_MAX" :step="1000" aria-label="Минимальная цена" @input="normalizePrice('from')" />
              <input v-model.number="draft.priceTo" class="range-input" type="range" :min="PRICE_MIN" :max="PRICE_MAX" :step="1000" aria-label="Максимальная цена" @input="normalizePrice('to')" />
            </div>
            <div class="price-inputs"><label><span>От</span><input v-model.number="draft.priceFrom" type="number" :min="PRICE_MIN" :max="PRICE_MAX" :step="1000" inputmode="numeric" @change="normalizePrice('from')" /></label><span class="dash">—</span><label><span>До</span><input v-model.number="draft.priceTo" type="number" :min="PRICE_MIN" :max="PRICE_MAX" :step="1000" inputmode="numeric" @change="normalizePrice('to')" /></label></div>
          </section>

          <section class="filter-block">
            <div class="filter-title"><label>Питание</label></div>
            <Checkbox v-for="item in mealOptions" :key="item.value" :model-value="draft.meals.includes(item.value)" @update:model-value="toggleArray('meals', item.value, $event)">{{ item.label }}</Checkbox>
          </section>

          <section class="filter-block">
            <div class="filter-title"><label>Звёздность</label></div>
            <div class="star-options"><button v-for="star in 5" :key="star" type="button" :class="{ active: draft.stars.includes(star) }" @click="toggleArray('stars', star)"><Star :size="15" fill="currentColor" /> {{ star }}</button></div>
          </section>

          <section class="filter-block">
            <div class="filter-title"><label>Тип размещения</label></div>
            <Checkbox v-for="item in accommodationOptions" :key="item.value" :model-value="draft.accommodation.includes(item.value)" @update:model-value="toggleArray('accommodation', item.value, $event)">{{ item.label }}</Checkbox>
          </section>

          <section class="filter-block">
            <div class="filter-title"><label>Рейтинг</label></div>
            <div class="rating-options"><button v-for="rating in [3,3.5,4,4.5]" :key="rating" type="button" :class="{ active: draft.rating === rating }" @click="draft.rating = draft.rating === rating ? undefined : rating"><Star :size="14" fill="currentColor" /> {{ rating }}+</button></div>
          </section>

          <section class="filter-block">
            <div class="filter-title"><label>Даты поездки</label><span v-if="dateRange.from && dateRange.to">{{ nights }} ночей</span></div>
            <DateRangePicker v-model="dateRange" mode="range" />
            <div class="flexible-options"><button v-for="item in flexibleOptions" :key="item.value" type="button" :class="{ active: draft.flexible === item.value }" @click="draft.flexible = draft.flexible === item.value ? '' : item.value">{{ item.label }}</button></div>
          </section>

          <section class="filter-block">
            <div class="filter-title"><label>Длительность</label></div>
            <div class="duration-options"><button v-for="item in durationOptions" :key="item.value" type="button" :class="{ active: draft.duration === item.value }" @click="draft.duration = draft.duration === item.value ? '' : item.value">{{ item.label }}</button></div>
          </section>

          <section class="filter-block">
            <div class="filter-title"><label>Вылет из</label><span>{{ draft.departures.length || 'Все' }}</span></div>
            <div class="search-filter-input"><Search :size="14" /><input v-model="departureSearch" placeholder="Город или аэропорт" /></div>
            <Checkbox v-for="item in departureOptions" :key="item" :model-value="draft.departures.includes(item)" @update:model-value="toggleArray('departures', item, $event)">{{ item }}</Checkbox>
          </section>

          <section class="filter-block">
            <div class="filter-title"><label>Курорт / регион</label><span>{{ draft.regions.length || 'Все' }}</span></div>
            <div class="search-filter-input"><Search :size="14" /><input v-model="regionSearch" placeholder="Найти регион" /></div>
            <Checkbox v-for="item in regionOptions" :key="item" :model-value="draft.regions.includes(item)" @update:model-value="toggleArray('regions', item, $event)">{{ item }}</Checkbox>
          </section>

          <section class="filter-block">
            <div class="filter-title"><label>Особенности</label></div>
            <div class="amenity-grid"><button v-for="item in amenityOptions" :key="item.value" type="button" :class="{ active: draft.amenities.includes(item.value) }" @click="toggleArray('amenities', item.value)"><component :is="item.icon" :size="15" />{{ item.label }}</button></div>
          </section>
        </div>

        <div class="filters-actions"><button type="button" class="reset-button" @click="resetFilters">Сбросить</button><button type="button" class="apply-button" @click="applyFilters">Показать {{ filteredTours.length }} туров</button></div>
      </aside>

      <div class="results-main">
        <div class="toolbar"><div class="chips"><button v-for="item in chips" :key="item.key" :class="{active: item.active()}" @click="quickFilter(item.key)">{{ item.label }}</button></div><label class="sort"><span>Сортировка</span><select v-model="sort"><option value="recommended">Рекомендуемые</option><option value="price">Сначала дешевле</option><option value="rating">Высокий рейтинг</option><option value="duration">Короткие поездки</option></select></label></div>
        <div v-if="loading" class="grid"><div v-for="item in 6" :key="item" class="skeleton"><div class="skeleton-image"></div><div class="skeleton-body"><i></i><b></b><span></span><span></span></div></div></div>
        <div v-else-if="error" class="state"><div class="state-icon">!</div><h2>Не удалось загрузить предложения</h2><p>{{ error }}</p><button class="trove-button" @click="load">Попробовать ещё раз</button></div>
        <div v-else-if="filteredTours.length" class="grid"><TourCard v-for="tour in filteredTours" :key="tour.id" :tour="tour" /></div>
        <div v-else class="state"><div class="state-icon">⌕</div><h2>Ничего не нашли</h2><p>Попробуйте расширить диапазон цены или убрать один из фильтров.</p><button class="trove-button trove-button--brand" @click="resetFilters">Сбросить фильтры</button></div>
        <div v-if="!loading && total > 0" class="result-note"><span><ShieldCheck :size="16" /> Цены проверяем перед бронированием</span><span>Собрано из нескольких источников</span></div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { CalendarDays, ChevronRight, Heart, MapPin, Plane, Search, ShieldCheck, SlidersHorizontal, Sparkles, Star, Users, Waves, X, CheckCircle2, PawPrint, BadgeCheck } from '@lucide/vue'
import { useRoute, useRouter } from 'vue-router'
import TourCard from '@entities/tours/ui/cards/TourCard.vue'
import DateRangePicker, { type DateRangeValue } from '@shared/ui/datePicker/DateRangePicker.vue'
import Checkbox from '@shared/ui/checkbox/Checkbox.vue'
import { useTours } from '@composables/useTours'
import type { Tour } from '~/types/tours'

const route = useRoute(); const router = useRouter()
const { tours, total, providers, loading, error, search } = useTours()
const filtersOpen = ref(false)
const sort = ref((route.query.sort as string) || 'recommended')
const departureSearch = ref(''); const regionSearch = ref('')
const PRICE_MIN = 10000; const PRICE_MAX = 250000

type DraftFilters = { priceFrom:number; priceTo:number; meals:string[]; stars:number[]; accommodation:string[]; rating?:number; duration:string; flexible:string; departures:string[]; regions:string[]; amenities:string[] }
const draft = reactive<DraftFilters>({ priceFrom: Number(route.query.priceFrom) || 20000, priceTo: Number(route.query.priceTo) || 200000, meals: csv(route.query.meal), stars: csv(route.query.stars).map(Number).filter(Boolean), accommodation: csv(route.query.accommodation), rating: route.query.rating ? Number(route.query.rating) : undefined, duration: String(route.query.duration || ''), flexible: String(route.query.flexible || ''), departures: csv(route.query.departureAirport), regions: csv(route.query.region), amenities: csv(route.query.amenities) })
const dateRange = ref<DateRangeValue>({ from: String(route.query.dateFrom || ''), to: String(route.query.dateTo || '') })
const title = computed(() => route.query.destination ? `Туры в ${route.query.destination}` : 'Подберём подходящее путешествие')
const dateSummary = computed(() => dateRange.value.from ? `${formatDate(dateRange.value.from)}${dateRange.value.to ? ` — ${formatDate(dateRange.value.to)}` : ''}` : 'Любая дата')
const nights = computed(() => dateRange.value.from && dateRange.value.to ? Math.round((new Date(dateRange.value.to).getTime() - new Date(dateRange.value.from).getTime()) / 86400000) : 0)
const priceFromPercent = computed(() => ((draft.priceFrom - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100)
const priceToPercent = computed(() => ((draft.priceTo - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100)

const mealOptions = [{value:'all-inclusive',label:'Всё включено'},{value:'ultra-all-inclusive',label:'Ультра всё включено'},{value:'breakfast',label:'Завтрак'},{value:'half-board',label:'Полупансион'},{value:'room-only',label:'Без питания'}]
const accommodationOptions = [{value:'hotel',label:'Отель'},{value:'apartments',label:'Апартаменты'},{value:'villa',label:'Вилла'},{value:'hostel',label:'Хостел'},{value:'guest-house',label:'Гостевой дом'}]
const flexibleOptions = [{value:'3',label:'±3 дня'},{value:'7',label:'±7 дней'}]
const durationOptions = [{value:'week',label:'До 7 ночей'},{value:'medium',label:'8–12 ночей'},{value:'long',label:'13+ ночей'}]
const amenityOptions = [
  {value:'instant',label:'Мгновенное подтверждение',icon:CheckCircle2},{value:'early',label:'Раннее бронирование',icon:BadgeCheck},{value:'pets',label:'С животными',icon:PawPrint},{value:'family',label:'Для семьи',icon:Heart},{value:'pool',label:'Бассейн',icon:Waves},{value:'spa',label:'SPA',icon:Sparkles},{value:'all-inclusive',label:'Всё включено',icon:CheckCircle2},{value:'beach',label:'Собственный пляж',icon:Waves}
]

function csv(value: unknown): string[] { const raw = Array.isArray(value) ? value[0] : value; return typeof raw === 'string' && raw ? raw.split(',').filter(Boolean) : [] }
function formatPrice(value:number){ return new Intl.NumberFormat('ru-RU').format(Math.round(value)) + ' ₽' }
function formatDate(value:string){ return new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short'}).format(new Date(value)) }
function toggleArray(key: 'meals'|'stars'|'accommodation'|'departures'|'regions'|'amenities', value: string|number, explicit?: boolean){ const list = draft[key] as Array<string|number>; const shouldAdd = explicit ?? !list.includes(value); const next = shouldAdd ? [...list, value] : list.filter(item => item !== value); (draft as any)[key] = next }
function normalizePrice(side:'from'|'to'){ if (side==='from') draft.priceFrom=Math.min(Math.max(Number(draft.priceFrom)||PRICE_MIN,PRICE_MIN),draft.priceTo-1000); else draft.priceTo=Math.max(Math.min(Number(draft.priceTo)||PRICE_MAX,PRICE_MAX),draft.priceFrom+1000) }
function resetFilters(){ Object.assign(draft,{priceFrom:20000,priceTo:200000,meals:[],stars:[],accommodation:[],rating:undefined,duration:'',flexible:'',departures:[],regions:[],amenities:[]}); dateRange.value={from:'',to:''}; departureSearch.value=''; regionSearch.value=''; applyFilters() }
function quickFilter(key:string){ if(key==='price'){draft.priceTo=draft.priceTo===100000?200000:100000} if(key==='rating'){draft.rating=draft.rating===4.7?undefined:4.7} if(key==='meal'){toggleArray('meals','all-inclusive')} void applyFilters() }
function queryFromDraft(){ return { ...route.query, priceFrom:String(draft.priceFrom), priceTo:String(draft.priceTo), meal:draft.meals.length?draft.meals.join(','):undefined, stars:draft.stars.length?draft.stars.join(','):undefined, accommodation:draft.accommodation.length?draft.accommodation.join(','):undefined, rating:draft.rating ? String(draft.rating) : undefined, duration:draft.duration || undefined, flexible:draft.flexible || undefined, departureAirport:draft.departures.length?draft.departures.join(','):undefined, region:draft.regions.length?draft.regions.join(','):undefined, amenities:draft.amenities.length?draft.amenities.join(','):undefined, dateFrom:dateRange.value.from || undefined, dateTo:dateRange.value.to || undefined, page:'1', sort:sort.value === 'recommended' ? undefined : sort.value } }
async function applyFilters(){ await router.replace({query:queryFromDraft()}); filtersOpen.value=false; await load() }
const load=()=>search({search:route.query.search?String(route.query.search):undefined,destination:route.query.destination?String(route.query.destination):undefined,departure:route.query.departure?String(route.query.departure):undefined,priceFrom:route.query.priceFrom?Number(route.query.priceFrom):undefined,priceTo:route.query.priceTo?Number(route.query.priceTo):undefined,rating:route.query.rating?Number(route.query.rating):undefined,duration:route.query.duration?String(route.query.duration) as 'week'|'medium'|'long':undefined,sort:sort.value as 'recommended'|'price'|'rating'|'duration',order:sort.value==='rating'?'desc':'asc',page:1,limit:12,dateFrom:route.query.dateFrom?String(route.query.dateFrom):undefined,dateTo:route.query.dateTo?String(route.query.dateTo):undefined,guests:route.query.guests?Number(route.query.guests):undefined})
function tourStars(tour:Tour){ return Math.max(1,Math.min(5,Math.round(tour.rating))) }
function accommodationFor(tour:Tour){ const tag=tour.tags.find(item=>['apartments','villa','hostel','guest-house'].includes(item)); return tag || 'hotel' }
function amenitiesFor(tour:Tour){ return new Set([...(tour.tags || []), tour.meal === 'all-inclusive' ? 'all-inclusive' : '', tour.rating >= 4.8 ? 'instant' : '', tour.tags.includes('family') ? 'family' : ''].filter(Boolean)) }
const filteredTours = computed(() => tours.value.filter(tour => {
  if(tour.price < draft.priceFrom || tour.price > draft.priceTo) return false
  if(draft.rating && tour.rating < draft.rating) return false
  if(draft.stars.length && !draft.stars.includes(tourStars(tour))) return false
  if(draft.meals.length && !draft.meals.includes(tour.meal)) return false
  if(draft.accommodation.length && !draft.accommodation.includes(accommodationFor(tour))) return false
  if(draft.duration==='week' && tour.duration>7) return false
  if(draft.duration==='medium' && (tour.duration<8 || tour.duration>12)) return false
  if(draft.duration==='long' && tour.duration<13) return false
  if(draft.departures.length && !draft.departures.includes(tour.flight.departureAirport)) return false
  if(draft.regions.length && !draft.regions.includes(tour.city) && !draft.regions.includes(tour.destination)) return false
  if(draft.amenities.length){ const set=amenitiesFor(tour); if(!draft.amenities.every(item=>set.has(item))) return false }
  return true
}))
const departureOptions = computed(() => [...new Set(tours.value.map(t => t.flight.departureAirport))].filter(v => v.toLowerCase().includes(departureSearch.value.toLowerCase())).slice(0,6))
const regionOptions = computed(() => [...new Set(tours.value.flatMap(t => [t.city,t.destination]))].filter(Boolean).filter(v => v.toLowerCase().includes(regionSearch.value.toLowerCase())).slice(0,8))
const activeFilterCount = computed(() => (draft.priceFrom!==20000 || draft.priceTo!==200000 ? 1:0) + draft.meals.length + draft.stars.length + draft.accommodation.length + (draft.rating?1:0) + (draft.duration?1:0) + (draft.flexible?1:0) + draft.departures.length + draft.regions.length + draft.amenities.length + (dateRange.value.from?1:0))
const chips = [
  {key:'price',label:'До 100 000 ₽',active:()=>draft.priceTo<=100000},
  {key:'rating',label:'Рейтинг 4.7+',active:()=>draft.rating===4.7},
  {key:'meal',label:'Всё включено',active:()=>draft.meals.includes('all-inclusive')},
]
watch(sort, async () => { await router.replace({query:{...route.query,sort:sort.value==='recommended'?undefined:sort.value}}); await load() })
watch(dateRange, () => { if (route.query.dateFrom === dateRange.value.from && route.query.dateTo === dateRange.value.to) return }, {deep:true})
watch(()=>route.query,()=>{ if(route.query.priceFrom) draft.priceFrom=Number(route.query.priceFrom); if(route.query.priceTo) draft.priceTo=Number(route.query.priceTo); dateRange.value={from:String(route.query.dateFrom||''),to:String(route.query.dateTo||'')}; },{deep:true})
onMounted(load)
</script>

<style scoped lang="scss">
.tours-page{min-height:100vh;background:var(--canvas)}.results-header{padding:30px 0 24px;background:var(--paper);border-bottom:1px solid var(--line)}.crumbs{display:flex;align-items:center;gap:7px;color:var(--muted);font-size:12px}.crumbs a{color:var(--muted)!important;text-decoration:none!important}.header-row{display:flex;align-items:end;justify-content:space-between;gap:30px;margin-top:18px}.header-row h1{margin:7px 0 5px;font-family:var(--font-display);font-size:clamp(38px,4.5vw,58px);line-height:1;font-weight:800;letter-spacing:-.055em}.header-row p{margin:0;color:var(--muted);font-size:13px}.change-search{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 14px;border:1px solid var(--line-strong);border-radius:11px;background:var(--paper);color:var(--ink)!important;text-decoration:none!important;font-size:12px;font-weight:800}.search-summary{display:grid;grid-template-columns:1.2fr 1fr 1fr 1.2fr auto;align-items:stretch;margin-top:18px;background:var(--paper);border:1px solid var(--line-strong);border-radius:16px;box-shadow:var(--shadow-sm);overflow:hidden}.summary-item{display:flex;align-items:center;gap:10px;padding:15px 17px;border-right:1px solid var(--line)}.summary-item>svg{color:var(--green);flex:0 0 auto}.summary-item small,.summary-item strong{display:block}.summary-item small{color:var(--muted);font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.06em}.summary-item strong{margin-top:3px;overflow:hidden;font-size:13px;white-space:nowrap;text-overflow:ellipsis}.summary-button{display:grid;place-items:center;padding:0 20px;background:var(--ink);color:#fff!important;text-decoration:none!important;font-size:12px;font-weight:800}.mobile-filter-bar{display:none}.results-layout{display:grid;grid-template-columns:290px minmax(0,1fr);gap:24px;padding-top:22px;padding-bottom:60px}.filters{position:sticky;top:86px;height:max-content;background:var(--paper);border:1px solid var(--line);border-radius:18px;box-shadow:var(--shadow-xs);overflow:hidden}.filters-head{display:flex;align-items:center;justify-content:space-between;padding:16px;border-bottom:1px solid var(--line)}.filters-head>div{display:flex;align-items:center;gap:8px}.filters-head button{border:0;background:transparent;color:var(--brand-dark);font-size:10px;font-weight:800;cursor:pointer}.filters-mobile-head{display:none}.filter-scroll{max-height:calc(100vh - 180px);overflow:auto}.filter-block{padding:18px 16px;border-bottom:1px solid var(--line)}.filter-block:last-child{border-bottom:0}.filter-block>.checkbox{display:flex;margin-top:11px}.filter-title{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:11px}.filter-title label{font-size:12px;font-weight:900}.filter-title span{color:var(--muted);font-size:10px;font-weight:700}.range-wrap{position:relative;height:34px;margin:2px 4px}.range-track,.range-fill{position:absolute;top:15px;height:4px;border-radius:99px}.range-track{left:0;right:0;background:var(--line)}.range-fill{left:var(--from);right:calc(100% - var(--to));background:var(--brand)}.range-input{position:absolute;inset:0;width:100%;height:34px;margin:0;background:transparent;pointer-events:none;appearance:none;-webkit-appearance:none}.range-input::-webkit-slider-thumb{appearance:none;-webkit-appearance:none;width:20px;height:20px;border:4px solid var(--paper);border-radius:50%;background:var(--brand);box-shadow:0 0 0 1px var(--brand),0 3px 8px rgba(16,32,25,.16);pointer-events:auto;cursor:grab}.range-input::-moz-range-thumb{width:13px;height:13px;border:4px solid var(--paper);border-radius:50%;background:var(--brand);box-shadow:0 0 0 1px var(--brand),0 3px 8px rgba(16,32,25,.16);pointer-events:auto;cursor:grab}.range-input:focus-visible::-webkit-slider-thumb{box-shadow:0 0 0 4px rgba(242,100,74,.18)}.price-inputs{display:grid;grid-template-columns:1fr 12px 1fr;align-items:end;gap:6px;margin-top:6px}.price-inputs label span{display:block;margin-bottom:4px;color:var(--muted);font-size:9px;font-weight:800}.price-inputs input{width:100%;height:37px;padding:0 9px;border:1px solid var(--line);border-radius:9px;background:var(--surface);font-size:12px;font-weight:700;outline:0}.price-inputs input:focus{border-color:var(--brand);background:var(--paper)}.dash{padding-bottom:9px;color:var(--muted);text-align:center}.star-options,.rating-options,.duration-options,.flexible-options{display:flex;flex-wrap:wrap;gap:6px}.star-options button,.rating-options button,.duration-options button,.flexible-options button{display:inline-flex;align-items:center;justify-content:center;gap:5px;min-height:34px;padding:0 9px;border:1px solid var(--line);border-radius:9px;background:var(--paper);color:var(--ink-2);font-size:11px;font-weight:800;cursor:pointer}.star-options button.active,.rating-options button.active,.duration-options button.active,.flexible-options button.active{border-color:var(--brand);background:var(--brand-soft);color:var(--brand-dark)}.star-options button svg,.rating-options button svg{color:var(--yellow)}.search-filter-input{display:flex;align-items:center;gap:7px;height:36px;margin-bottom:9px;padding:0 9px;border:1px solid var(--line);border-radius:9px;background:var(--surface);color:var(--muted)}.search-filter-input input{width:100%;border:0;outline:0;background:transparent;font-size:11px}.amenity-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}.amenity-grid button{display:flex;align-items:center;gap:7px;min-height:42px;padding:7px 8px;border:1px solid var(--line);border-radius:10px;background:var(--paper);color:var(--ink-2);text-align:left;font-size:10px;font-weight:700;cursor:pointer}.amenity-grid button.active{border-color:var(--brand);background:var(--brand-soft);color:var(--brand-dark)}.filters-actions{display:flex;gap:7px;padding:12px;border-top:1px solid var(--line);background:color-mix(in srgb,var(--paper) 96%,var(--surface))}.reset-button{min-height:42px;padding:0 12px;border:1px solid var(--line);border-radius:10px;background:var(--paper);color:var(--ink-2);font-size:11px;font-weight:800;cursor:pointer}.apply-button{flex:1;min-height:42px;border:0;border-radius:10px;background:var(--brand);color:#fff;font-size:11px;font-weight:900;cursor:pointer}.toolbar{display:flex;align-items:center;justify-content:space-between;gap:15px;margin-bottom:15px}.chips{display:flex;flex-wrap:wrap;gap:7px}.chips button{min-height:34px;padding:0 11px;border:1px solid var(--line);border-radius:999px;background:var(--paper);color:var(--ink-2);font-size:11px;font-weight:800;cursor:pointer}.chips button.active{border-color:var(--brand);background:var(--brand-soft);color:var(--brand-dark)}.sort{display:flex;align-items:center;gap:8px;white-space:nowrap}.sort span{color:var(--muted);font-size:10px;font-weight:700}.sort select{height:36px;padding:0 30px 0 10px;border:1px solid var(--line);border-radius:9px;background:var(--paper);color:var(--ink);font-size:11px;font-weight:800}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.skeleton{overflow:hidden;background:var(--paper);border:1px solid var(--line);border-radius:16px}.skeleton-image{height:220px;background:linear-gradient(90deg,var(--surface) 25%,var(--surface-2) 50%,var(--surface) 75%);background-size:200% 100%;animation:skeleton 1.3s infinite}.skeleton-body{display:grid;gap:9px;padding:16px}.skeleton-body i,.skeleton-body b,.skeleton-body span{display:block;border-radius:5px;background:var(--surface);height:10px}.skeleton-body i{width:35%}.skeleton-body b{width:78%;height:17px}.skeleton-body span{width:55%}.skeleton-body span:last-child{width:40%}@keyframes skeleton{to{background-position:-200% 0}}.state{display:grid;place-items:center;min-height:430px;padding:50px;text-align:center;background:var(--paper);border:1px solid var(--line);border-radius:18px}.state-icon{display:grid;place-items:center;width:48px;height:48px;border-radius:50%;background:var(--surface);font-weight:900}.state h2{margin:14px 0 5px;font-family:var(--font-display);font-size:25px}.state p{max-width:450px;margin:0 0 18px;color:var(--muted);font-size:13px}.result-note{display:flex;justify-content:space-between;gap:12px;margin-top:15px;padding:13px 2px;color:var(--muted);font-size:10px}.result-note span{display:flex;align-items:center;gap:6px}.result-note svg{color:var(--green)}
@media(max-width:1050px){.results-layout{grid-template-columns:260px 1fr}.grid{grid-template-columns:1fr 1fr}.search-summary{grid-template-columns:1fr 1fr}.summary-button{min-height:52px}.summary-item:nth-child(2){border-right:0}.summary-item:nth-child(3),.summary-item:nth-child(4){border-top:1px solid var(--line)}}
@media(max-width:760px){.header-row{display:block}.change-search{margin-top:15px}.search-summary{grid-template-columns:1fr 1fr}.results-layout{display:block;padding-top:12px}.mobile-filter-bar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-top:14px}.mobile-filter-bar>span{color:var(--muted);font-size:11px}.mobile-filter-trigger{display:inline-flex;align-items:center;gap:7px;min-height:42px;padding:0 13px;border:1px solid var(--line-strong);border-radius:11px;background:var(--paper);color:var(--ink);font-size:12px;font-weight:800}.mobile-filter-trigger span{display:grid;place-items:center;min-width:20px;height:20px;padding:0 5px;border-radius:999px;background:var(--brand);color:#fff;font-size:10px}.filter-backdrop{position:fixed;inset:0;z-index:140;background:rgba(8,18,13,.35);backdrop-filter:blur(2px)}.filters{position:fixed;z-index:150;left:0;right:0;bottom:0;top:auto;width:100%;height:min(88dvh,760px);border:0;border-radius:22px 22px 0 0;box-shadow:0 -20px 50px rgba(16,32,25,.18);transform:translateY(105%);transition:transform .3s var(--ease);display:flex;flex-direction:column}.filters.open{transform:translateY(0)}.filters-mobile-head{display:flex;align-items:center;justify-content:space-between;padding:15px 16px;border-bottom:1px solid var(--line)}.filters-mobile-head>div{display:flex;align-items:center;gap:8px}.filters-mobile-head span{display:grid;place-items:center;min-width:20px;height:20px;border-radius:999px;background:var(--brand-soft);color:var(--brand-dark);font-size:10px;font-weight:900}.filters-mobile-head button{display:grid;place-items:center;width:34px;height:34px;border:0;border-radius:9px;background:var(--surface);color:var(--ink)}.filters-head{display:none}.filter-scroll{max-height:none;flex:1;overflow:auto}.filters-actions{margin-top:auto}.toolbar{display:block}.sort{margin-top:11px}.sort select{flex:1}.grid{grid-template-columns:1fr}.result-note{display:block}.result-note span+span{margin-top:5px}}
@media(max-width:500px){.search-summary{grid-template-columns:1fr}.summary-item{border-right:0!important;border-top:1px solid var(--line)}.summary-item:first-child{border-top:0}.summary-button{min-height:46px}.results-header{padding-top:20px}.header-row h1{font-size:40px}.chips{overflow:auto;flex-wrap:nowrap;padding-bottom:3px}.chips button{flex:0 0 auto}.amenity-grid{grid-template-columns:1fr}.price-inputs{grid-template-columns:1fr 8px 1fr}}
</style>
