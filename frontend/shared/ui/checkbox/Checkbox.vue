<template>
  <label class="checkbox" :class="{ disabled }">
    <input
      ref="input"
      type="checkbox"
      :checked="modelValue"
      :disabled="disabled"
      :aria-label="ariaLabel"
      @change="onChange"
    />
    <span class="box" aria-hidden="true"><Check :size="13" /></span>
    <span v-if="$slots.default" class="label"><slot /></span>
  </label>
</template>
<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import { Check } from '@lucide/vue'
const props = withDefaults(defineProps<{ modelValue: boolean; indeterminate?: boolean; disabled?: boolean; ariaLabel?: string }>(), { indeterminate: false, disabled: false, ariaLabel: undefined })
const emit = defineEmits<{ 'update:modelValue': [boolean] }>()
const input = ref<HTMLInputElement | null>(null)
const sync = async () => { await nextTick(); if (input.value) input.value.indeterminate = props.indeterminate }
const onChange = (event: Event) => emit('update:modelValue', (event.target as HTMLInputElement).checked)
watch(() => props.indeterminate, sync)
onMounted(sync)
</script>
<style scoped lang="scss">
.checkbox{display:inline-flex;align-items:flex-start;gap:9px;min-height:28px;color:var(--ink-2);font-size:12px;line-height:1.45;cursor:pointer}.checkbox input{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none}.box{display:grid;place-items:center;flex:0 0 20px;width:20px;height:20px;margin-top:1px;border:1.5px solid var(--line-strong);border-radius:6px;background:var(--paper);color:transparent;transition:all .16s var(--ease)}.box svg{transform:scale(.4);transition:transform .16s var(--ease)}.checkbox:hover .box{border-color:var(--brand)}.checkbox:has(input:checked) .box{border-color:var(--brand);background:var(--brand);color:#fff}.checkbox:has(input:checked) .box svg{transform:scale(1)}.checkbox:has(input:indeterminate) .box{border-color:var(--brand);background:var(--brand);color:#fff}.checkbox:has(input:indeterminate) .box svg{transform:scale(.75)}.checkbox:has(input:focus-visible) .box{outline:3px solid color-mix(in srgb,var(--brand) 25%,transparent);outline-offset:2px}.checkbox.disabled{opacity:.5;cursor:not-allowed}.label{padding-top:1px}
</style>
