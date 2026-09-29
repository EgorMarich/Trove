<template>
  <div ref="root" class="guest-picker">
    <button class="trigger" type="button" :aria-expanded="open" @click="open = !open">
      <Users :size="20" class="trigger-icon" />
      <span class="trigger-copy"><small>Путешественники</small><strong>{{ summary }}</strong></span>
      <ChevronDown :size="18" class="trigger-chevron" />
    </button>
    <div v-if="open" class="popover">
      <div class="popover-title"><div><strong>Кто едет?</strong><span>Состав поездки</span></div><button type="button" aria-label="Закрыть" @click="open = false"><X :size="18" /></button></div>
      <div class="row"><div><strong>Взрослые</strong><small>18 лет и старше</small></div><div class="stepper"><button type="button" :disabled="adults <= 1" @click="adults--">−</button><b>{{ adults }}</b><button type="button" @click="adults++">+</button></div></div>
      <div class="row"><div><strong>Дети</strong><small>до 17 лет</small></div><div class="stepper"><button type="button" :disabled="children <= 0" @click="children--">−</button><b>{{ children }}</b><button type="button" :disabled="children >= 8" @click="children++">+</button></div></div>
      <div v-if="children" class="hint">Возраст детей уточним после выбора предложения.</div>
      <button class="done" type="button" @click="open = false">Готово</button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ChevronDown, Users, X } from '@lucide/vue'
const adults = defineModel<number>('adults', { default: 2 })
const children = defineModel<number>('children', { default: 0 })
const open = ref(false)
const root = ref<HTMLElement | null>(null)
const summary = computed(() => `${adults.value} ${adults.value === 1 ? 'взрослый' : 'взрослых'}${children.value ? ` · ${children.value} ${children.value === 1 ? 'ребёнок' : 'детей'}` : ''}`)
const close = (event: MouseEvent) => { if (root.value && !root.value.contains(event.target as Node)) open.value = false }
onMounted(() => document.addEventListener('click', close))
onBeforeUnmount(() => document.removeEventListener('click', close))
</script>
<style scoped lang="scss">
.guest-picker{position:relative;width:100%;height:100%}.trigger{width:100%;height:100%;display:flex;align-items:center;gap:11px;padding:12px 16px;border:0;background:transparent;text-align:left;cursor:pointer}.trigger-icon{flex:0 0 auto;color:var(--green)}.trigger-copy{min-width:0;flex:1}.trigger-copy small,.trigger-copy strong{display:block}.trigger-copy small{margin-bottom:4px;color:var(--muted);font-size:11px;font-weight:800}.trigger-copy strong{overflow:hidden;color:var(--ink);font-size:15px;white-space:nowrap;text-overflow:ellipsis}.trigger-chevron{color:var(--muted-2)}.popover{position:absolute;right:0;top:calc(100% + 12px);width:360px;padding:14px;background:#fff;border:1px solid var(--line-strong);border-radius:16px;box-shadow:var(--shadow-lg);z-index:100}.popover-title{display:flex;align-items:flex-start;justify-content:space-between;padding:2px 3px 14px;border-bottom:1px solid var(--line)}.popover-title strong,.popover-title span{display:block}.popover-title strong{font-family:var(--font-display);font-size:18px}.popover-title span{margin-top:3px;color:var(--muted);font-size:12px}.popover-title button{display:grid;place-items:center;width:32px;height:32px;border:0;border-radius:9px;background:var(--surface);color:var(--ink);cursor:pointer}.row{display:flex;align-items:center;justify-content:space-between;padding:17px 3px;border-bottom:1px solid var(--line)}.row strong,.row small{display:block}.row strong{font-size:14px}.row small{margin-top:3px;color:var(--muted);font-size:11px}.stepper{display:flex;align-items:center;gap:12px}.stepper button{width:36px;height:36px;border:1px solid var(--line-strong);border-radius:50%;background:#fff;color:var(--ink);font-size:19px;line-height:1;cursor:pointer}.stepper button:hover:not(:disabled){border-color:var(--brand);color:var(--brand)}.stepper button:disabled{opacity:.35;cursor:not-allowed}.stepper b{width:18px;text-align:center}.hint{margin-top:12px;padding:11px;border-radius:10px;background:var(--surface);color:var(--muted);font-size:11px;line-height:1.45}.done{width:100%;margin-top:12px;min-height:46px;border:0;border-radius:11px;background:var(--ink);color:#fff;font-weight:800;cursor:pointer}.done:hover{background:var(--forest-2)}
@media(max-width:520px){.popover{right:-8px;width:min(360px,calc(100vw - 32px))}}
</style>
