<template>
  <div class="page">
    <div class="shell">
      <NuxtLink to="/account/bookings" class="back">← Мои поездки</NuxtLink>
      <span class="kicker">Оплата Trove</span>
      <h1>Оплата поездки 🐱</h1>
      <p class="lead">Тестовый платёжный экран. Реальные данные карты здесь не вводятся и не сохраняются.</p>

      <section class="card">
        <div v-for="step in steps" :key="step.key" class="step" :class="step.state">
          <div class="dot">{{ step.state === 'done' ? '✓' : step.state === 'active' ? '•' : '○' }}</div>
          <div><strong>{{ step.label }}</strong><p>{{ step.description }}</p></div>
        </div>
      </section>

      <div v-if="error" class="error">{{ error }}</div>
      <button class="primary" :disabled="loading || completed" @click="pay">
        {{ buttonLabel }}
      </button>
      <p class="note">В production здесь будет hosted checkout выбранного платёжного провайдера. Trove не хранит данные банковской карты.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatPrice } from '@entities/tours/model/tour'
const route = useRoute()
const bookings = useBookings()
const loading = ref(false)
const completed = ref(false)
const error = ref('');
const payment = ref<any>(null);
const amountLabel = computed(() =>
  payment.value
    ? formatPrice(payment.value.amount, payment.value.currency as Currency)
    : 'сумму'
);
const buttonLabel = computed(() =>
  loading.value
    ? 'Проводим оплату…'
    : completed.value
      ? 'Бронирование подтверждено ✓'
      : `Оплатить ${amountLabel.value}`
);
const steps = computed(() => [
  { key: 'intent', label: 'Платёж создан', description: 'Trove создал Payment Intent.', state: payment.value ? 'done' : 'active' },
  { key: 'processing', label: 'Обработка оплаты', description: completed.value ? 'Платёж подтверждён signed webhook.' : 'После нажатия ниже mock PSP отправит webhook.', state: completed.value ? 'done' : payment.value ? 'active' : 'pending' },
  { key: 'provider', label: 'Бронирование у поставщика', description: completed.value ? 'Поставщик вернул provider order ID.' : 'Запустится после успешной оплаты.', state: completed.value ? 'done' : 'pending' },
  { key: 'confirmed', label: 'Поездка подтверждена', description: completed.value ? 'Бронирование сохранено в My Trips.' : 'Последний этап.', state: completed.value ? 'done' : 'pending' },
])

onMounted(async () => {
  try {
    payment.value = await bookings.reconcilePayment(String(route.params.id))
  } catch {
    error.value = 'Не удалось загрузить платёж.'
  }
})

const pay = async () => {
  if (!payment.value || loading.value || completed.value) return
  const bookingId = String(route.query.bookingId || '')
  const previewToken = String(route.query.previewToken || '')
  if (!bookingId || !previewToken) { error.value = 'Не хватает данных бронирования.'; return }
  loading.value = true
  error.value = ''
  try {
    payment.value = await bookings.confirmPayment(payment.value.id)
    if (payment.value.status !== 'succeeded') throw new Error('Оплата не подтверждена')
    const booking = await bookings.confirm(bookingId, previewToken)
    if (booking.status !== 'confirmed') throw new Error('Поставщик не подтвердил бронирование')
    completed.value = true
    await new Promise((resolve) => setTimeout(resolve, 500))
    await navigateTo(`/account/bookings/${booking.id}`)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось завершить оплату'
  } finally { loading.value = false }
}
</script>

<style scoped lang="scss">
.page{min-height:70vh;padding:56px 24px 90px;background:var(--canvas)}.shell{width:min(720px,100%);margin:auto}.back{display:inline-flex;align-items:center;gap:6px;color:var(--muted)!important;text-decoration:none!important;font-size:12px;font-weight:800}.back:hover{color:var(--ink)!important}.kicker{display:block;margin-top:30px;color:var(--green);font-size:10px;text-transform:uppercase;letter-spacing:.1em;font-weight:900}.shell h1{margin:9px 0 8px;font-family:var(--font-display);font-size:clamp(38px,5vw,52px);line-height:1;letter-spacing:-.055em}.lead{margin:0;color:var(--muted);font-size:13px;line-height:1.65}.card{margin-top:26px;padding:8px 22px;border:1px solid var(--line);border-radius:var(--radius-lg);background:var(--paper);box-shadow:var(--shadow-xs)}.step{display:flex;gap:15px;padding:18px 0;border-bottom:1px solid var(--line)}.step:last-child{border-bottom:0}.dot{width:27px;height:27px;border:1px solid var(--line-strong);border-radius:50%;display:grid;place-items:center;font-size:11px;font-weight:900;flex:none}.step.done .dot{background:var(--ink);color:#fff;border-color:var(--ink)}.step.active .dot{border-color:var(--brand);color:var(--brand)}.step strong{font-size:12px}.step p{margin:5px 0 0;color:var(--muted);font-size:11px;line-height:1.5}.primary{width:100%;min-height:50px;margin-top:18px;border:0;border-radius:12px;background:var(--brand);color:#fff;font-size:13px;font-weight:800;cursor:pointer}.primary:hover{background:var(--brand-dark);transform:translateY(-1px);box-shadow:var(--shadow-sm)}.primary:disabled{opacity:.55;cursor:not-allowed;transform:none}.error{margin-top:15px;padding:12px 14px;border:1px solid #f0cbc4;border-radius:11px;background:var(--brand-soft);color:var(--danger);font-size:11px;line-height:1.5}.note{font-size:10px;color:var(--muted);line-height:1.55;margin-top:12px}@media(max-width:560px){.page{padding:32px 16px 70px}.card{padding:6px 17px}.shell h1{font-size:36px}}
</style>
