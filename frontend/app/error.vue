<template>
  <main class="error-page">
    <div class="error-card">
      <div class="error-mark" aria-hidden="true"><MapPinned :size="24" /></div>
      <span class="error-kicker">Trove · {{ error?.statusCode || 500 }}</span>
      <h1>{{ title }}</h1>
      <p>{{ message }}</p>
      <div class="error-actions">
        <button class="trove-button trove-button--brand" type="button" @click="retry">Вернуться к поиску <ArrowRight :size="17" /></button>
        <NuxtLink class="trove-button trove-button--light" to="/">На главную</NuxtLink>
      </div>
    </div>
  </main>
</template>
<script setup lang="ts">
import { ArrowRight, MapPinned } from '@lucide/vue'
const props = defineProps<{ error?: { statusCode?: number; statusMessage?: string } }>()
const title = computed(() => props.error?.statusCode === 404 ? 'Такой страницы нет' : 'Что-то пошло не так')
const message = computed(() => props.error?.statusCode === 404 ? 'Похоже, эта страница уехала в отпуск. Найдём другое направление?' : 'Не удалось открыть страницу. Попробуйте ещё раз или вернитесь к поиску.')
const retry = async () => { await clearError({ redirect: '/tours' }) }
</script>
<style scoped lang="scss">
.error-page{min-height:calc(100vh - 70px);display:grid;place-items:center;padding:40px 16px;background:radial-gradient(circle at 50% 15%,var(--green-soft),transparent 35%),var(--canvas)}
.error-card{width:min(620px,100%);padding:48px;text-align:center;background:var(--paper);border:1px solid var(--line);border-radius:24px;box-shadow:var(--shadow-lg)}
.error-mark{display:grid;place-items:center;width:56px;height:56px;margin:0 auto 18px;border-radius:17px;background:var(--green-soft);color:var(--green)}
.error-kicker{color:var(--green);font-size:11px;font-weight:900;letter-spacing:.1em;text-transform:uppercase}.error-card h1{margin:12px 0 10px;font-family:var(--font-display);font-size:clamp(38px,6vw,60px);line-height:.98;letter-spacing:-.06em}.error-card p{max-width:470px;margin:0 auto;color:var(--muted);font-size:15px;line-height:1.65}.error-actions{display:flex;justify-content:center;gap:10px;margin-top:26px}@media(max-width:560px){.error-card{padding:34px 22px}.error-actions{display:grid;grid-template-columns:1fr}.error-actions .trove-button{width:100%}}
</style>
