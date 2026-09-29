<template>
  <div ref="root" class="date-picker">
    <button
      ref="trigger"
      type="button"
      class="date-trigger"
      :aria-expanded="open"
      aria-haspopup="dialog"
      @click="open = !open"
    >
      <CalendarDays :size="19" class="trigger-icon" />
      <span class="trigger-copy">
        <small>{{ mode === 'range' ? 'Даты поездки' : 'Дата поездки' }}</small>
        <strong>{{ displayValue }}</strong>
      </span>
      <ChevronDown :size="17" class="trigger-chevron" :class="{ rotated: open }" />
    </button>

    <Transition name="calendar-pop">
      <div v-if="open" class="calendar-popover" role="dialog" aria-label="Выбор даты">
        <div class="calendar-head">
          <div>
            <span class="calendar-kicker">Когда поедем?</span>
            <strong>{{ mode === 'range' ? 'Вылет и возвращение' : 'Выберите дату' }}</strong>
          </div>
          <button type="button" class="icon-button" aria-label="Закрыть календарь" @click="close">
            <X :size="18" />
          </button>
        </div>

        <div v-if="mode === 'range'" class="preset-row" aria-label="Быстрый выбор">
          <button v-for="preset in presets" :key="preset.key" type="button" class="preset" @click="applyPreset(preset.key)">
            {{ preset.label }}
          </button>
        </div>

        <div class="calendar-toolbar">
          <button type="button" class="nav-button" aria-label="Предыдущий месяц" @click="shiftMonth(-1)">
            <ChevronLeft :size="18" />
          </button>
          <strong>{{ monthTitle(leftMonth) }}</strong>
          <strong class="desktop-month">{{ monthTitle(rightMonth) }}</strong>
          <button type="button" class="nav-button" aria-label="Следующий месяц" @click="shiftMonth(1)">
            <ChevronRight :size="18" />
          </button>
        </div>

        <div class="months">
          <CalendarMonth
            :month="leftMonth"
            :selected-from="draftFrom"
            :selected-to="draftTo"
            :range-mode="mode === 'range'"
            :focused-date="focusedDate"
            @select="selectDate"
            @focus-date="focusDate"
            @hover-date="hoverDate"
          />
          <CalendarMonth
            v-if="!isMobile"
            :month="rightMonth"
            :selected-from="draftFrom"
            :selected-to="draftTo"
            :range-mode="mode === 'range'"
            :focused-date="focusedDate"
            @select="selectDate"
            @focus-date="focusDate"
            @hover-date="hoverDate"
          />
        </div>

        <div class="calendar-footer">
          <div class="trip-summary">
            <span>{{ mode === 'range' ? 'Поездка' : 'Дата' }}</span>
            <strong>{{ footerValue }}</strong>
            <small v-if="nights !== null">{{ nights }} {{ pluralize(nights, 'ночь', 'ночи', 'ночей') }}</small>
          </div>
          <div class="footer-actions">
            <button type="button" class="clear-button" @click="clear">Сбросить</button>
            <button type="button" class="apply-button" :disabled="!draftFrom" @click="apply">Готово</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, X } from '@lucide/vue'

export interface DateRangeValue { from: string; to: string }

type CalendarCell = { date: Date; key: string; day: number; disabled: boolean; outside: boolean }

const props = withDefaults(defineProps<{
  modelValue: DateRangeValue
  mode?: 'single' | 'range'
  placeholder?: string
}>(), { mode: 'range', placeholder: 'Когда вы хотите поехать?' })

const emit = defineEmits<{ 'update:modelValue': [DateRangeValue] }>()
const root = ref<HTMLElement | null>(null)
const trigger = ref<HTMLButtonElement | null>(null)
const open = ref(false)
const isMobile = ref(false)
const today = startOfDay(new Date())
const cursor = ref(new Date(today.getFullYear(), today.getMonth(), 1))
const draftFrom = ref(props.modelValue.from || '')
const draftTo = ref(props.modelValue.to || '')
const focusedDate = ref(props.modelValue.from || toKey(today))
const hoveredDate = ref('')

const presets = [
  { key: 'today', label: 'Сегодня' },
  { key: 'tomorrow', label: 'Завтра' },
  { key: 'weekend', label: 'На выходных' },
  { key: 'seven', label: '+7 дней' },
  { key: 'flexible', label: 'Гибкие даты' },
]

const leftMonth = computed(() => cursor.value)
const rightMonth = computed(() => new Date(cursor.value.getFullYear(), cursor.value.getMonth() + 1, 1))
const displayValue = computed(() => {
  if (!draftFrom.value) return props.placeholder
  if (props.mode === 'single' || !draftTo.value) return formatShort(draftFrom.value)
  return `${formatShort(draftFrom.value)} — ${formatShort(draftTo.value)}`
})
const footerValue = computed(() => displayValue.value)
const nights = computed(() => draftFrom.value && draftTo.value ? diffDays(parseKey(draftFrom.value), parseKey(draftTo.value)) : null)

function startOfDay(date: Date) { return new Date(date.getFullYear(), date.getMonth(), date.getDate()) }
function toKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}` }
function parseKey(value: string) { const [y,m,d] = value.split('-').map(Number); return new Date(y, m - 1, d) }
function diffDays(a: Date, b: Date) { return Math.max(0, Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86400000)) }
function formatShort(value: string) { return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(parseKey(value)) }
function monthTitle(date: Date) { return new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(date).replace(/^./, (c) => c.toUpperCase()) }
function pluralize(value: number, one: string, few: string, many: string) { const n = value % 100; if (n >= 11 && n <= 14) return many; const last = n % 10; return last === 1 ? one : last >= 2 && last <= 4 ? few : many }

function shiftMonth(delta: number) { cursor.value = new Date(cursor.value.getFullYear(), cursor.value.getMonth() + delta, 1) }
function selectDate(value: string) {
  if (props.mode === 'single') { draftFrom.value = value; draftTo.value = ''; return }
  if (!draftFrom.value || (draftFrom.value && draftTo.value)) { draftFrom.value = value; draftTo.value = ''; return }
  if (parseKey(value) < parseKey(draftFrom.value)) { draftTo.value = draftFrom.value; draftFrom.value = value }
  else { draftTo.value = value; hoveredDate.value = '' }
  cursor.value = new Date(parseKey(value).getFullYear(), parseKey(value).getMonth(), 1)
}
function hoverDate(value: string) {
  if (props.mode === 'range' && draftFrom.value && !draftTo.value) hoveredDate.value = value
}

function focusDate(value: string) { focusedDate.value = value }
function applyPreset(key: string) {
  const base = startOfDay(new Date())
  if (key === 'flexible') { draftFrom.value = ''; draftTo.value = ''; emit('update:modelValue', { from: '', to: '' }); close(); return }
  let from = base
  let to = base
  if (key === 'tomorrow') { from = addDays(base, 1); to = addDays(from, 2) }
  if (key === 'today') { to = addDays(from, 2) }
  if (key === 'seven') { from = addDays(base, 7); to = addDays(from, 7) }
  if (key === 'weekend') {
    const day = base.getDay()
    const daysToSaturday = day === 6 ? 0 : (6 - day + 7) % 7
    from = addDays(base, daysToSaturday)
    to = addDays(from, 1)
  }
  draftFrom.value = toKey(from); draftTo.value = props.mode === 'range' ? toKey(to) : ''
  cursor.value = new Date(from.getFullYear(), from.getMonth(), 1)
}
function addDays(date: Date, amount: number) { const next = new Date(date); next.setDate(next.getDate() + amount); return next }
function clear() { draftFrom.value = ''; draftTo.value = ''; hoveredDate.value = '' }
function apply() {
  if (!draftFrom.value) return
  emit('update:modelValue', { from: draftFrom.value, to: draftTo.value })
  close()
}
function close() { open.value = false; requestAnimationFrame(() => trigger.value?.focus()) }
function handleOutside(event: MouseEvent) { if (root.value && !root.value.contains(event.target as Node)) open.value = false }
function updateViewport() { isMobile.value = window.matchMedia('(max-width: 720px)').matches }
function onKeydown(event: KeyboardEvent) {
  if (!open.value) return
  if (event.key === 'Escape') { close(); return }
  if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) return
  event.preventDefault()
  const current = parseKey(focusedDate.value)
  const delta = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : event.key === 'ArrowUp' ? -7 : 7
  const next = addDays(current, delta)
  if (next < today) return
  focusedDate.value = toKey(next)
  nextTick(() => root.value?.querySelector<HTMLElement>(`[data-date=\"${focusedDate.value}\"]`)?.focus())
  if (next.getMonth() !== cursor.value.getMonth()) cursor.value = new Date(next.getFullYear(), next.getMonth(), 1)
}
watch(() => props.modelValue, (value) => { draftFrom.value = value.from || ''; draftTo.value = value.to || '' }, { deep: true })
onMounted(() => { document.addEventListener('mousedown', handleOutside); window.addEventListener('resize', updateViewport); window.addEventListener('keydown', onKeydown); updateViewport() })
onBeforeUnmount(() => { document.removeEventListener('mousedown', handleOutside); window.removeEventListener('resize', updateViewport); window.removeEventListener('keydown', onKeydown) })

const CalendarMonth = defineComponent({
  props: {
    month: { type: Date, required: true }, selectedFrom: { type: String, default: '' }, selectedTo: { type: String, default: '' }, rangeMode: Boolean, focusedDate: { type: String, default: '' },
  },
  emits: ['select', 'focusDate', 'hoverDate'],
  setup(p, { emit }) {
    const cells = computed<CalendarCell[]>(() => {
      const first = new Date(p.month.getFullYear(), p.month.getMonth(), 1)
      const offset = (first.getDay() + 6) % 7
      const start = addDays(first, -offset)
      return Array.from({ length: 42 }, (_, index) => {
        const date = addDays(start, index)
        return { date, key: toKey(date), day: date.getDate(), disabled: date < today, outside: date.getMonth() !== p.month.getMonth() }
      })
    })
    return () => h('div', { class: 'calendar-month' }, [
      h('div', { class: 'weekdays' }, ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(day => h('span', day))),
      h('div', { class: 'days-grid' }, cells.value.map(cell => {
        const rangeEnd = p.selectedTo || ''
        const previewEnd = !rangeEnd && p.selectedFrom && hoveredDate.value ? hoveredDate.value : ''
        const rangeMin = previewEnd && previewEnd < p.selectedFrom ? previewEnd : p.selectedFrom
        const rangeMax = previewEnd && previewEnd < p.selectedFrom ? p.selectedFrom : (rangeEnd || previewEnd)
        const inRange = Boolean(rangeMin && rangeMax && cell.key >= rangeMin && cell.key <= rangeMax)
        const preview = Boolean(!p.selectedTo && p.selectedFrom && hoveredDate.value && inRange && cell.key !== p.selectedFrom)
        const selected = cell.key === p.selectedFrom || cell.key === p.selectedTo
        return h('button', {
          type: 'button', class: ['day', { disabled: cell.disabled, outside: cell.outside, selected, 'in-range': inRange, preview, focused: cell.key === p.focusedDate }], 'data-date': cell.key,
          disabled: cell.disabled, 'aria-label': new Intl.DateTimeFormat('ru-RU', { dateStyle: 'long' }).format(cell.date), 'aria-selected': selected,
          onClick: () => emit('select', cell.key), onFocus: () => emit('focusDate', cell.key), onMouseenter: () => emit('hoverDate', cell.key),
        }, cell.day)
      }))
    ])
  },
})
</script>

<style scoped lang="scss">
.date-picker{position:relative;min-width:0}.date-trigger{width:100%;min-height:76px;display:flex;align-items:center;gap:11px;padding:11px 15px;border:0;background:#fff;color:var(--ink);text-align:left;cursor:pointer}.trigger-icon{color:var(--green);flex:0 0 auto}.trigger-copy{min-width:0;flex:1}.trigger-copy small,.trigger-copy strong{display:block}.trigger-copy small{margin-bottom:5px;color:var(--muted);font-size:11px;line-height:1;font-weight:800}.trigger-copy strong{overflow:hidden;font-size:15px;white-space:nowrap;text-overflow:ellipsis}.trigger-chevron{color:var(--muted-2);transition:transform .2s var(--ease)}.trigger-chevron.rotated{transform:rotate(180deg)}
.calendar-popover{position:absolute;z-index:120;top:calc(100% + 10px);left:50%;width:min(760px,calc(100vw - 32px));padding:18px;background:var(--paper);border:1px solid var(--line);border-radius:22px;box-shadow:0 24px 70px rgba(16,32,25,.18);transform:translateX(-50%)}.calendar-head{display:flex;align-items:center;justify-content:space-between;gap:15px;padding:2px 2px 14px}.calendar-kicker{display:block;color:var(--green);font-size:10px;font-weight:900;letter-spacing:.09em;text-transform:uppercase}.calendar-head strong{display:block;margin-top:4px;font-family:var(--font-display);font-size:19px;letter-spacing:-.03em}.icon-button,.nav-button{display:grid;place-items:center;border:1px solid var(--line);background:var(--paper);color:var(--ink);cursor:pointer}.icon-button{width:36px;height:36px;border-radius:11px}.preset-row{display:flex;gap:7px;overflow:auto;padding:0 0 14px}.preset{flex:0 0 auto;min-height:34px;padding:0 12px;border:1px solid var(--line);border-radius:999px;background:var(--surface);color:var(--ink-2);font-size:11px;font-weight:800;cursor:pointer}.preset:hover{border-color:var(--brand);background:var(--brand-soft);color:var(--brand-dark)}.calendar-toolbar{display:grid;grid-template-columns:38px 1fr 1fr 38px;align-items:center;gap:12px;padding:12px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}.calendar-toolbar strong{text-align:center;font-family:var(--font-display);font-size:14px}.nav-button{width:38px;height:38px;border-radius:11px}.months{display:grid;grid-template-columns:1fr 1fr;gap:26px;padding:18px 2px}.calendar-month{min-width:0}.weekdays,.days-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr))}.weekdays{margin-bottom:8px}.weekdays span{text-align:center;color:var(--muted);font-size:10px;font-weight:900;letter-spacing:.04em;text-transform:uppercase}.day{position:relative;display:grid;place-items:center;width:100%;min-height:42px;padding:0;border:0;background:transparent;color:var(--ink);font-size:13px;font-weight:700;cursor:pointer;z-index:0}.day::before{content:'';position:absolute;inset:2px 0;z-index:-1;background:transparent}.day:hover:not(:disabled)::before{background:var(--surface);border-radius:12px}.day.in-range::before{background:var(--brand-soft);border-radius:0}.day.preview::before{background:#fff4f1;border-radius:0}.day.in-range:first-child::before{border-radius:12px 0 0 12px}.day.in-range:last-child::before{border-radius:0 12px 12px 0}.day.selected::before{background:var(--brand);border-radius:50%;inset:2px 5px}.day.selected{color:#fff;font-weight:900}.day.outside{color:#b8c1bb;font-weight:600}.day.disabled{color:#d3d9d5;cursor:not-allowed}.day.focused:not(.selected){outline:2px solid color-mix(in srgb,var(--brand) 48%,transparent);outline-offset:-2px;border-radius:12px}.calendar-footer{display:flex;align-items:center;justify-content:space-between;gap:15px;padding-top:14px;border-top:1px solid var(--line)}.trip-summary span,.trip-summary strong,.trip-summary small{display:block}.trip-summary span{color:var(--muted);font-size:10px;font-weight:800}.trip-summary strong{margin-top:2px;font-size:13px}.trip-summary small{margin-top:1px;color:var(--green);font-size:11px;font-weight:800}.footer-actions{display:flex;align-items:center;gap:8px}.clear-button,.apply-button{min-height:40px;padding:0 14px;border-radius:11px;font-size:12px;font-weight:800;cursor:pointer}.clear-button{border:1px solid transparent;background:transparent;color:var(--ink-2)}.clear-button:hover{background:var(--surface)}.apply-button{border:0;background:var(--brand);color:#fff}.apply-button:hover:not(:disabled){background:var(--brand-dark);transform:translateY(-1px)}.apply-button:disabled{opacity:.45;cursor:not-allowed}.calendar-pop-enter-active,.calendar-pop-leave-active{transition:opacity .18s var(--ease),transform .22s var(--ease)}.calendar-pop-enter-from,.calendar-pop-leave-to{opacity:0;transform:translate(-50%,-7px)}
@media(max-width:720px){.calendar-popover{position:fixed;inset:0;width:100%;height:100dvh;max-height:100dvh;overflow:auto;padding:18px;border:0;border-radius:0;transform:none;background:var(--paper)}.calendar-pop-enter-from,.calendar-pop-leave-to{transform:translateY(12px)}.months{grid-template-columns:1fr}.desktop-month{display:none}.calendar-toolbar{grid-template-columns:38px 1fr 38px}.calendar-toolbar strong:nth-of-type(2){display:none}.months{padding-top:14px}.day{min-height:48px}.calendar-footer{position:sticky;bottom:0;margin-inline:-18px;padding:14px 18px;background:color-mix(in srgb,var(--paper) 95%,transparent);backdrop-filter:blur(12px)}.footer-actions{margin-left:auto}}
</style>
