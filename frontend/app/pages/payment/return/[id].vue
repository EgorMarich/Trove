<template>
  <div class="page">
    <div class="shell">
      <span class="kicker">Trove · оплата</span>
      <h1>{{ state === 'success' ? 'Оплата получена 🐱' : state === 'pending' ? 'Проверяем оплату…' : 'Нужно проверить оплату' }}</h1>
      <p class="lead">{{ message }}</p>
      <div v-if="error" class="error">{{ error }}</div>
      <div class="actions"><NuxtLink to="/account/bookings" class="secondary">Мои поездки</NuxtLink><NuxtLink to="/support" class="secondary">Поддержка</NuxtLink></div>
      <button class="primary" :disabled="loading" @click="finish">{{ loading ? 'Проверяем…' : state === 'success' ? 'Открыть поездку →' : 'Проверить ещё раз' }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const bookings = useBookings()
const analytics = useAnalytics()
const state = ref<'pending'|'success'|'unknown'|'failed'>('pending')
const message = ref('ЮKassa вернула вас в Trove. Мы не доверяем redirect сам по себе — сначала проверяем платеж через API провайдера.')
const error = ref('')
const loading = ref(false)

const finish = async () => {
  if (loading.value) return
  loading.value = true
  void analytics.track('payment_returned', { paymentIntentId: String(route.params.id) })
  error.value = ''
  try {
    const payment = await bookings.reconcilePayment(String(route.params.id))
    if (payment.status !== 'succeeded') {
      state.value = payment.status === 'failed' || payment.status === 'expired' ? 'failed' : 'unknown'
      message.value = payment.status === 'failed' || payment.status === 'expired'
        ? 'Платёж не был завершён. Бронирование не подтверждено.'
        : 'Провайдер ещё не подтвердил оплату. Повторите проверку через несколько секунд.'
      return
    }
    const bookingId = payment.bookingId as string
    const booking = await bookings.get(bookingId)
    if (!booking?.previewToken) {
      message.value = 'Платёж подтверждён. Откройте раздел «Мои поездки», чтобы продолжить.'
      return
    }
    const confirmed = await bookings.confirm(bookingId, booking.previewToken)
    if (confirmed.status !== 'confirmed') {
      state.value = 'unknown'
      message.value = 'Оплата подтверждена, но поставщик ещё не завершил бронирование. Мы продолжим проверку.'
      return
    }
    state.value = 'success'
    void analytics.track('booking_confirmed', { bookingId: confirmed.id })
    await navigateTo(`/account/bookings/${confirmed.id}`)
  } catch (e) {
    state.value = 'unknown'
    error.value = e instanceof Error ? e.message : 'Не удалось проверить платёж'
    message.value = 'Платёж не считается подтверждённым, пока Trove не получит подтверждение от провайдера.'
  } finally {
    loading.value = false
  }
}

const waitAndRetry = async () => {
  for (const delay of [2000, 4000, 6000]) {
    await new Promise((resolve) => setTimeout(resolve, delay))
    await finish()
    if (state.value === 'success' || state.value === 'failed') return
  }
}

onMounted(async () => { await finish(); if (state.value === 'unknown') void waitAndRetry() })
</script>

<style scoped lang="scss">
.page{min-height:70vh;padding:70px 24px 90px;background:var(--canvas);display:grid;place-items:center}.shell{width:min(650px,100%);padding:34px;border:1px solid var(--line);border-radius:var(--radius-xl);background:var(--paper);box-shadow:var(--shadow-sm)}.kicker{display:block;color:var(--green);font-size:10px;text-transform:uppercase;letter-spacing:.1em;font-weight:900}.shell h1{margin:10px 0 9px;font-family:var(--font-display);font-size:clamp(36px,5vw,50px);line-height:1;letter-spacing:-.055em}.lead{margin:0;color:var(--muted);font-size:13px;line-height:1.7}.error{margin-top:16px;padding:12px 14px;border:1px solid #f0cbc4;border-radius:11px;background:var(--brand-soft);color:var(--danger);font-size:11px;line-height:1.5}.actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:22px}.secondary{display:flex;align-items:center;justify-content:center;min-height:46px;padding:0 14px;border:1px solid var(--line-strong);border-radius:11px;background:var(--paper);color:var(--ink)!important;text-decoration:none!important;font-size:12px;font-weight:800}.secondary:hover{background:var(--surface);border-color:var(--ink)}.primary{width:100%;min-height:50px;margin-top:10px;border:0;border-radius:12px;background:var(--brand);color:#fff;font-size:13px;font-weight:800;cursor:pointer}.primary:hover{background:var(--brand-dark);transform:translateY(-1px);box-shadow:var(--shadow-sm)}.primary:disabled{opacity:.55;cursor:not-allowed;transform:none}@media(max-width:560px){.page{padding:32px 16px}.shell{padding:24px 20px}.actions{grid-template-columns:1fr}.shell h1{font-size:36px}}
</style>
