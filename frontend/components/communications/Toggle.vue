<template>
  <label class="toggle-row"><span><strong>{{ title }}</strong><small>{{ description }}</small></span><input v-model="model" type="checkbox"><i aria-hidden="true"></i></label>
</template>
<script setup lang="ts">
const props=defineProps<{modelValue:boolean,title:string,description:string}>();const emit=defineEmits<{ 'update:modelValue':[value:boolean] }>();const model=computed({get:()=>props.modelValue,set:(value)=>emit('update:modelValue',value)})
</script>
<style scoped lang="scss">
@use '@shared/styles/variables/colors.scss';.toggle-row{display:flex;justify-content:space-between;align-items:center;gap:20px;padding:17px 0;border-top:1px solid colors.$gray-100;cursor:pointer}.toggle-row span{display:block}.toggle-row strong{display:block;font-size:12px}.toggle-row small{display:block;margin-top:4px;color:colors.$text-muted;font-size:10px}.toggle-row input{position:absolute;opacity:0;pointer-events:none}.toggle-row i{position:relative;width:40px;height:22px;background:colors.$gray-200;flex:none;transition:.15s}.toggle-row i:after{content:'';position:absolute;width:16px;height:16px;left:3px;top:3px;background:#fff;transition:.15s}.toggle-row input:checked+i{background:colors.$gray-900}.toggle-row input:checked+i:after{transform:translateX(18px)}
</style>
