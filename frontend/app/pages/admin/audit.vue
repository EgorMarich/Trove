<template>
<div><div class="admin-page-head"><div><h1>Журнал действий</h1><p>Аудит изменений и административных операций.</p></div><button class="btn" @click="load">Обновить</button></div>
<div class="table-wrap"><table class="admin-table"><thead><tr><th>Дата</th><th>Действие</th><th>Администратор</th><th>Детали</th></tr></thead><tbody><tr v-for="item in items" :key="item.id"><td>{{ date(item.created_at) }}</td><td><span class="pill">{{ item.type }}</span></td><td><b>{{ item.first_name }} {{ item.last_name || '' }}</b><div class="muted">{{ item.email || item.user_id || 'system' }}</div></td><td><code>{{ JSON.stringify(item.metadata || {}) }}</code></td></tr></tbody></table><div v-if="!items.length" class="empty">Журнал пока пуст.</div></div></div>
</template>
<script setup lang="ts">
definePageMeta({layout:'admin',middleware:'admin'});const api=useApi();const items=ref<any[]>([]);const load=async()=>{const r=await api<{items:any[]}>('/api/admin/audit?limit=200');items.value=r.items};await load();const date=(v:string)=>new Date(v).toLocaleString('ru-RU')
</script>
<style scoped>code{font-size:11px;color:#657084;white-space:pre-wrap}</style>