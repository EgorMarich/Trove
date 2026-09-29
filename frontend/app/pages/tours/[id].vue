<template>
  <div v-if="tour" class="page">
    <nav class="breadcrumbs" aria-label="Хлебные крошки"><NuxtLink to="/">Главная</NuxtLink><span>/</span><NuxtLink to="/tours">Туры</NuxtLink><span>/</span><strong>{{ tour.destination }}</strong></nav>

    <div class="hero">
      <div class="visual"><img :src="tour.image" :alt="tour.title" loading="eager" /><div class="visual-top"><span>{{ tour.badge ? badgeLabel[tour.badge] : "Подобрано Trove" }}</span><button type="button" aria-label="Добавить в избранное" @click="toggleFavorite">♥</button></div><div class="visual-bottom"><span>{{ tour.destination }} · {{ tour.city }}</span><span><Star :size="13" fill="currentColor" /> {{ tour.rating }}</span></div></div>
      <div class="hero__info">
        <span class="kicker">{{ tour.destination }} · {{ tour.city }}</span>
        <div class="title-row"><h1>{{ tour.title }}</h1><button class="favorite-detail" type="button" @click="toggleFavorite">{{ isFavorite ? '♥' : '♡' }} <span>{{ isFavorite ? 'В избранном' : 'В избранное' }}</span></button></div>
        <p class="hotel">{{ tour.hotel }}</p>
        <div class="rating">★ {{ tour.rating }} <span>{{ tour.reviews.toLocaleString('ru-RU') }} отзывов</span></div>
        <div class="tags"><span v-for="tag in tour.tags" :key="tag">{{ tag }}</span></div>

        <div class="trip-grid">
          <div><small>Вылет</small><strong>{{ tour.departureDate }}</strong><span>{{ tour.departure }}</span></div>
          <div><small>Длительность</small><strong>{{ tour.duration }} ночей</strong><span>{{ tour.meal === 'all-inclusive' ? 'Всё включено' : tour.meal === 'breakfast' ? 'Завтраки' : 'Питание по тарифу' }}</span></div>
          <div v-if="hasFlight"><small>Перелёт</small><strong>{{ tour.flight.direct ? 'Прямой' : 'С пересадкой' }}</strong><span>{{ tour.flight.departureAirport }} → {{ tour.flight.arrivalAirport }}</span></div><div v-else><small>Тип предложения</small><strong>Отель</strong><span>Проживание через {{ providerName }}</span></div>
        </div>

        <div class="price"><small>Цена на момент поиска</small><strong>{{ formatPrice(tour.price, tour.currency) }}</strong><span>за человека</span></div>

        <div class="trust">
          <span>Источник: {{ providerName }}</span>
          <span>Обновлено {{ updatedLabel }}</span>
        </div>

        <div v-if="priceCheck" class="price-check" :class="{ 'price-check--changed': priceCheck.price !== tour.price }">
          <strong>{{ priceCheck.available ? '✓ Цена подтверждена' : '× Предложение недоступно' }}</strong>
          <span v-if="priceCheck.available">{{ formatPrice(priceCheck.price, priceCheck.currency) }} · {{ checkedLabel }}</span>
        </div>

        <div class="action-note"><ShieldCheck :size="16" /><span>Цена и наличие перепроверяются перед созданием заказа.</span></div>
        <button v-if="providerCapabilities.booking" class="primary" type="button" @click="goToBooking">
          Забронировать в Trove →
        </button>
        <button v-else class="primary" :disabled="checking || !canRedirect" @click="continueToProvider">
          {{ checking ? 'Проверяем цену…' : 'Проверить цену и перейти →' }}
        </button>
        <p v-if="actionError" class="action-error">{{ actionError }}</p>
      </div>
    </div>

    <section class="highlights"><div><ShieldCheck :size="19" /><strong>Цена под контролем</strong><span>Проверяем предложение ещё раз перед бронированием.</span></div><div><Star :size="19" /><strong>{{ tour.rating }} · {{ tour.reviews.toLocaleString('ru-RU') }} отзывов</strong><span>Рейтинг отеля и реальные оценки гостей.</span></div><div><CheckIcon :size="19" /><strong>Важные условия рядом</strong><span>Питание, длительность и перелёт видны до клика.</span></div></section>

    <section class="why">
      <span class="kicker">🐱 Почему Trove показывает этот вариант</span>
      <h2>Что нам в нём понравилось</h2>
      <div class="reasons"><div v-for="reason in tour.reasons" :key="reason">✓ {{ reason }}</div></div>
    </section>

    <section v-if="hasFlight" class="route-card">
      <div><span class="kicker">Маршрут</span><h2>{{ tour.flight.departureAirport }} → {{ tour.flight.arrivalAirport }}</h2></div>
      <div class="route-times"><span>{{ tour.flight.departureTime }}</span><i></i><span>{{ tour.flight.arrivalTime }}</span></div>
      <span>{{ tour.flight.direct ? 'Прямой перелёт' : 'Перелёт с пересадкой' }}</span>
    </section>
  <div v-if="tour" class="mobile-booking-bar"><div><small>от</small><strong>{{ formatPrice(tour.price, tour.currency) }}</strong><span>/ чел.</span></div><button type="button" @click="providerCapabilities.booking ? goToBooking() : continueToProvider()">{{ providerCapabilities.booking ? "Забронировать" : "Проверить цену" }}</button></div>
  </div>
  <div v-else-if="loading" class="detail-loading trove-container"><div class="loading-photo"></div><div class="loading-copy"><i></i><b></b><span></span><span></span><div></div></div></div><div v-else class="not-found"><div>🐱</div><h1>Тур не найден</h1><NuxtLink to="/tours">Вернуться к поиску</NuxtLink></div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Check as CheckIcon, ShieldCheck, Star } from '@lucide/vue'
import { formatPrice } from '@entities/tours/model/tour'
import { useTours } from '@composables/useTours'
import type { PriceCheckResponse, Tour } from '~/types/tours'
import { badgeLabel } from '@entities/tours/model/tour'

const route = useRoute()
const analytics = useAnalytics()
const auth = useAuth()
const { getDetail, checkPrice, getRedirect } = useTours()
const personalization = usePersonalization()
const tour = ref<Tour | null>(null)
const providerName = ref('Trove')
const providerId = ref('')
const providerCapabilities = ref({ search: false, priceCheck: false, booking: false, redirect: false })
const checking = ref(false)
const priceCheck = ref<PriceCheckResponse | null>(null)
const actionError = ref('')
const loading = ref(true)

const updatedLabel = computed(() => tour.value ? new Date(tour.value.priceUpdatedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '')
const checkedLabel = computed(() => priceCheck.value ? new Date(priceCheck.value.checkedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '')
const isFavorite = computed(() => tour.value ? personalization.isFavorite(tour.value.id) : false)
const hasFlight = computed(() => Boolean(tour.value && tour.value.flight.departureAirport !== '—'))

const toggleFavorite = async () => {
  if (!tour.value) return
  await auth.load()
  if (!auth.user.value) { await navigateTo({ path: '/auth/login', query: { redirect: `/tours/${tour.value.id}` } }); return }
  await personalization.toggleFavorite(tour.value.id)
}

const canRedirect = computed(() => Boolean(tour.value?.bookingUrl && providerId.value))

onMounted(async () => {
  void analytics.track('offer_viewed', { offerId: String(route.params.id) })
  const detail = await getDetail(String(route.params.id))
  if (detail) {
    tour.value = detail.item
    personalization.addViewed(detail.item.id)
    providerId.value = detail.provider.id
    providerName.value = detail.provider.name
    providerCapabilities.value = detail.provider.capabilities
  }
  loading.value = false
})

const goToBooking = async () => { if (!tour.value) return; await navigateTo(`/booking/${tour.value.id}`) }

const continueToProvider = async () => {
  if (!tour.value || !providerId.value) return
  checking.value = true
  actionError.value = ''
  try {
    priceCheck.value = await checkPrice(tour.value.id, providerId.value)
    if (!priceCheck.value.available) {
      actionError.value = 'Предложение больше недоступно. Вернитесь к поиску и выберите другой вариант.'
      return
    }
    const redirect = await getRedirect(tour.value.id, providerId.value)
    if (!redirect.url) throw new Error('Ссылка на бронирование недоступна')
    window.location.href = redirect.url
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : 'Не удалось проверить предложение'
  } finally {
    checking.value = false
  }
}
</script>

<style scoped lang="scss">
.page{width:min(1240px,calc(100% - 48px));margin:auto;padding:22px 0 88px}.breadcrumbs{display:flex;align-items:center;gap:8px;color:var(--muted);font-size:12px}.breadcrumbs a{color:var(--muted)!important;text-decoration:none!important}.breadcrumbs a:hover{color:var(--ink)!important}.breadcrumbs strong{color:var(--ink);font-weight:800}
.hero{display:grid;grid-template-columns:1.03fr .97fr;margin-top:16px;overflow:hidden;background:var(--paper);border:1px solid var(--line);border-radius:24px;box-shadow:var(--shadow-sm)}.visual{height:660px;background:var(--surface);position:relative}.visual img{width:100%;height:100%;display:block;object-fit:cover}.visual:after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.22),transparent 24%,transparent 65%,rgba(0,0,0,.42));pointer-events:none}.visual-top,.visual-bottom{position:absolute;left:18px;right:18px;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:12px}.visual-top{top:18px}.visual-top span,.visual-bottom span{display:inline-flex;align-items:center;gap:5px;padding:7px 10px;border-radius:999px;background:rgba(16,32,25,.72);color:#fff;font-size:10px;font-weight:800;backdrop-filter:blur(12px)}.visual-top button{display:grid;place-items:center;width:40px;height:40px;border:1px solid rgba(255,255,255,.65);border-radius:50%;background:rgba(255,255,255,.88);color:var(--brand);cursor:pointer}.hero__info{padding:38px 36px;display:flex;flex-direction:column}.kicker{font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:var(--green);font-weight:800}.title-row{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}.hero h1{flex:1;margin:9px 0 6px;font-family:var(--font-display);font-size:clamp(40px,4vw,58px);line-height:.99;font-weight:800;letter-spacing:-.06em}.favorite-detail{display:inline-flex;align-items:center;gap:7px;min-height:42px;padding:0 12px;border:1px solid var(--line-strong);border-radius:11px;background:var(--paper);color:var(--ink);font-size:11px;font-weight:800;cursor:pointer}.favorite-detail:hover{border-color:var(--brand);color:var(--brand-dark)}.hotel{margin:0;color:var(--muted);font-size:14px}.rating{display:flex;align-items:center;gap:7px;margin:16px 0;color:var(--ink);font-size:15px;font-weight:800}.rating span{color:var(--muted);font-size:12px;font-weight:500}.tags{display:flex;gap:6px;flex-wrap:wrap}.tags span{padding:7px 9px;border:1px solid var(--line);border-radius:8px;background:var(--surface);color:var(--ink-2);font-size:10px;font-weight:800}.trip-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;margin-top:22px;overflow:hidden;border:1px solid var(--line);border-radius:13px;background:var(--line)}.trip-grid>div{padding:14px;background:var(--paper)}.trip-grid small,.trip-grid span{display:block;color:var(--muted);font-size:10px}.trip-grid strong{display:block;margin:4px 0;font-size:13px}.price{margin-top:24px}.price small,.price span{display:block;color:var(--muted);font-size:11px}.price strong{display:block;margin:4px 0;font-family:var(--font-display);font-size:44px;line-height:1;font-weight:800;letter-spacing:-.055em}.trust{display:flex;justify-content:space-between;gap:12px;margin-top:17px;padding:12px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line);color:var(--muted);font-size:10px}.action-note{display:flex;align-items:flex-start;gap:8px;margin-top:11px;padding:11px 12px;border-radius:11px;background:var(--surface);color:var(--muted);font-size:10px;line-height:1.45}.action-note svg{flex:0 0 auto;color:var(--green)}.price-check{margin-top:11px;padding:12px 13px;border:1px solid #cbe8d8;border-radius:11px;background:#eef8f2;font-size:11px}.price-check--changed{border-color:#f2cbc1;background:var(--brand-soft)}.price-check strong,.price-check span{display:block}.price-check span{margin-top:3px;color:var(--muted)}.primary{width:100%;min-height:54px;margin-top:13px;border:0;border-radius:12px;background:var(--brand);color:#fff;font-size:13px;font-weight:800;cursor:pointer;transition:.2s}.primary:hover{background:var(--brand-dark);transform:translateY(-1px);box-shadow:var(--shadow-md)}.primary:disabled{opacity:.55;cursor:not-allowed}.action-error{margin:9px 0 0;color:var(--danger);font-size:11px}.highlights{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;margin-top:18px;overflow:hidden;border:1px solid var(--line);border-radius:16px;background:var(--line)}.highlights>div{padding:18px;background:var(--paper)}.highlights svg{color:var(--green);margin-bottom:11px}.highlights strong,.highlights span{display:block}.highlights strong{font-size:13px}.highlights span{margin-top:4px;color:var(--muted);font-size:11px;line-height:1.5}.why{margin-top:48px;padding:30px;background:var(--surface);border:1px solid var(--line);border-radius:20px}.why h2,.route-card h2{margin:7px 0 18px;font-family:var(--font-display);font-size:30px;line-height:1.05;letter-spacing:-.045em}.reasons{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.reasons div{padding:15px;border:1px solid var(--line);border-radius:12px;background:var(--paper);font-size:12px;line-height:1.45}.route-card{display:grid;grid-template-columns:1fr auto auto;align-items:end;gap:24px;margin-top:18px;padding:25px;background:var(--paper);border:1px solid var(--line);border-radius:18px;box-shadow:var(--shadow-xs)}.route-card>span{color:var(--muted);font-size:11px}.route-times{display:flex;align-items:center;gap:14px;font-family:var(--font-display);font-size:24px;font-weight:800}.route-times i{width:70px;height:1px;background:var(--line-strong)}.detail-loading{display:grid;grid-template-columns:1fr 1fr;gap:24px;padding:30px 0}.loading-photo,.loading-copy{border-radius:20px;background:linear-gradient(90deg,var(--surface) 25%,var(--surface-2) 50%,var(--surface) 75%);background-size:200% 100%;animation:shimmer 1.4s infinite}.loading-photo{height:620px}.loading-copy{height:620px}.not-found{text-align:center;padding:100px 20px}.not-found>div{font-size:48px}.not-found a{color:var(--ink);font-weight:800}.mobile-booking-bar{display:none}@keyframes shimmer{to{background-position:-200% 0}}
@media(max-width:900px){.hero{grid-template-columns:1fr}.visual{height:430px}.hero__info{padding:28px 24px}.highlights{grid-template-columns:1fr}.reasons{grid-template-columns:1fr 1fr}.route-card{grid-template-columns:1fr}.detail-loading{grid-template-columns:1fr}.loading-photo{height:380px}.mobile-booking-bar{position:fixed;left:12px;right:12px;bottom:12px;z-index:90;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:10px 10px 10px 16px;background:color-mix(in srgb,var(--paper) 94%,transparent);border:1px solid var(--line-strong);border-radius:16px;box-shadow:var(--shadow-lg);backdrop-filter:blur(16px)}.mobile-booking-bar>div{display:flex;align-items:baseline;gap:4px}.mobile-booking-bar small,.mobile-booking-bar span{color:var(--muted);font-size:9px}.mobile-booking-bar strong{font-family:var(--font-display);font-size:21px;letter-spacing:-.04em}.mobile-booking-bar button{min-height:44px;padding:0 16px;border:0;border-radius:11px;background:var(--brand);color:#fff;font-size:12px;font-weight:800}}
@media(max-width:560px){.page{width:calc(100% - 32px);padding-top:16px}.visual{height:330px}.title-row{display:block}.favorite-detail{margin-top:8px}.hero h1{font-size:40px}.trip-grid{grid-template-columns:1fr}.reasons{grid-template-columns:1fr}.route-times{font-size:20px}.route-times i{width:38px}.mobile-booking-bar{bottom:8px}}
</style>