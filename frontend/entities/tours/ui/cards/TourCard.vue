<template>
  <NuxtLink :to="`/tours/${tour.id}`" class="link">
    <article class="tour-card">
      <div class="image-link">
        <div class="image-wrap">
          <img :src="tour.image" :alt="tour.title" loading="lazy" @error="fallbackImage" />
        </div>
        <span v-if="tour.badge" class="badge" :class="`badge--${tour.badge}`">{{ badgeLabel[tour.badge] }}</span>
        <button class="favorite" :class="{ active: isFavorite(tour.id) }" type="button"
          :aria-label="isFavorite(tour.id) ? 'Удалить из избранного' : 'Добавить в избранное'"
          @click.prevent="toggleFavorite">
          <Heart :size="18" :fill="isFavorite(tour.id) ? 'currentColor' : 'none'" />
        </button>
        <div class="image-bottom">
          <span>{{ tour.destination }} · {{ tour.city }}</span>
          <b><Star :size="13" fill="currentColor" /> {{ tour.rating }}</b>
        </div>
      </div>

      <div class="content">
        <div class="score-row">
          <span class="score"><Sparkles :size="13" /> Trove Score {{ tour.troveScore }}</span>
          <span class="reviews">{{ tour.reviews.toLocaleString('ru-RU') }} отзывов</span>
        </div>

        <h3>{{ tour.title }}</h3>
        <p class="hotel">{{ tour.hotel }}</p>

        <div class="details">
          <span><Clock3 :size="15" /> {{ tour.duration }} ночей</span>
          <span><Utensils :size="15" /> {{ tour.meal === 'all-inclusive' ? 'Всё включено' : 'Завтраки' }}</span>
          <span><Plane :size="15" /> {{ tour.flight.direct ? 'Прямой рейс' : 'Пересадка' }}</span>
        </div>

        <div class="price-row">
          <div>
            <small>от</small>
            <strong>{{ formatPrice(tour.price) }}</strong>
            <small> / чел.</small>
          </div>
          <div class="details-link">Смотреть <ArrowRight :size="15" class="arrow-icon" /></div>
        </div>
      </div>
    </article>
  </NuxtLink>
</template>

<script setup lang="ts">
import { ArrowRight, Clock3, Heart, Plane, Sparkles, Star, Utensils } from '@lucide/vue'
import type { Tour } from '~/types/tours'
import { badgeLabel, formatPrice } from '@entities/tours/model/tour'
import { useAuth } from '../../../../composables/useAuth';
import { usePersonalization } from '../../../../composables/usePersonalization';

const props = defineProps<{ tour: Tour }>()
const auth = useAuth()
const personalization = usePersonalization()
const fallback = '/images/trove-landscape.svg'

const isFavorite = (id: string) => personalization.isFavorite(id)

const toggleFavorite = async () => {
  await auth.load()
  if (!auth.user.value) {
    await navigateTo({ path: '/auth/login', query: { redirect: `/tours/${props.tour.id}` } })
    return
  }
  await personalization.toggleFavorite(props.tour.id)
}

const fallbackImage = (event: Event) => {
  const image = event.target as HTMLImageElement
  if (!image.src.endsWith(fallback)) image.src = fallback
}

onMounted(async () => {
  if (auth.user.value) await personalization.load()
})
</script>

<style scoped lang="scss">
.link{text-decoration:none!important}.tour-card{display: flex;flex-direction: column;min-height: 460px; overflow:hidden;background:var(--paper);border:1px solid var(--line);border-radius:18px;box-shadow:var(--shadow-xs);transition:transform .25s var(--ease),box-shadow .25s var(--ease),border-color .25s var(--ease)}.tour-card:hover{transform:translateY(-4px);border-color:var(--line-strong);box-shadow:var(--shadow-md)}
.image-link{flex: 0 0 auto;position:relative;display:block;color:#fff!important;text-decoration:none!important}.image-wrap{height:238px;overflow:hidden;background:var(--surface-2)}.image-wrap img{width:100%;height:100%;display:block;object-fit:cover;transition:transform .55s var(--ease)}.tour-card:hover .image-wrap img{transform:scale(1.045)}
.badge{position:absolute;left:13px;top:13px;padding:7px 10px;border-radius:var(--radius-pill);background:rgba(255,255,255,.94);color:var(--ink);font-size:10px;font-weight:800;box-shadow:0 5px 18px rgba(0,0,0,.09);backdrop-filter:blur(10px)}.badge--hot{color:#c83f35}.badge--sale{color:#8a5a00}.badge--recommended{color:var(--green)}.badge--new{color:#526eaf}
.favorite{position:absolute;right:13px;top:13px;display:grid;place-items:center;width:40px;height:40px;border:1px solid rgba(255,255,255,.7);border-radius:50%;background:rgba(255,255,255,.92);color:var(--ink);cursor:pointer;box-shadow:0 5px 18px rgba(0,0,0,.08);backdrop-filter:blur(10px);transition:transform .18s var(--ease),color .18s var(--ease)}.favorite:hover{transform:scale(1.06)}.favorite.active{color:var(--brand)}
.image-bottom{position:absolute;left:14px;right:14px;bottom:12px;display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:12px;text-shadow:0 2px 9px rgba(0,0,0,.35)}.image-bottom b{display:inline-flex;align-items:center;gap:4px;padding:6px 8px;border-radius:9px;background:rgba(16,32,25,.72);backdrop-filter:blur(8px)}
.content{display: flex; flex-direction: column; flex: 1 1 auto; padding:17px 18px 18px}.score-row{display:flex;align-items:center;justify-content:space-between;gap:10px}.score{display:inline-flex;align-items:center;gap:5px;color:var(--green);font-size:10px;font-weight:800}.reviews{color:var(--muted);font-size:10px}.content h3{margin:9px 0 3px;color:var(--ink);font-family:var(--font-display);font-size:21px;line-height:1.1;font-weight:800;letter-spacing:-.04em}.hotel{margin:0;color:var(--muted);font-size:13px}.details{display:flex;flex-wrap:wrap;gap:8px 12px;margin-top:15px}.details span{display:inline-flex;align-items:center;gap:5px;color:var(--ink-2);font-size:11px}.details svg{color:var(--muted-2)}
.price-row{display:flex;align-items:end;justify-content:space-between;gap:12px;margin-top: auto;padding-top:14px;border-top:1px solid var(--line)}.price-row>div{display:flex;align-items:baseline;gap:4px}.price-row small{color:var(--muted);font-size:10px}.price-row strong{font-family:var(--font-display);font-size:26px;line-height:1;font-weight:800;letter-spacing:-.045em}.details-link{display:flex;align-items:center;gap:5px;color:var(--ink)!important;text-decoration:none!important;font-size:12px;font-weight:800}.details-link:hover{color:var(--brand-dark)!important}.arrow-icon{align-self: center;}
@media(max-width:650px){.image-wrap{height:220px}.content h3{font-size:20px}}
</style>
