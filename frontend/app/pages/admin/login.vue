<template><div class="login-page"><form class="login-card" @submit.prevent="submit"><img src="/logo/trove-logo.svg" alt="Trove"><h1>Вход в админку</h1><p>Back office Trove</p><div class="field"><label>Email или телефон</label><input v-model="identifier" class="input" autocomplete="username"></div><div class="field"><label>Пароль</label><input v-model="password" type="password" class="input" autocomplete="current-password"></div><p v-if="error" class="error">{{ error }}</p><button class="btn primary" :disabled="loading">{{ loading?'Входим…':'Войти' }}</button></form></div></template>
<script setup lang="ts">
definePageMeta({layout:false})
const admin=useAdmin(); const route=useRoute(); const identifier=ref(''); const password=ref(''); const loading=ref(false); const error=ref('')
const submit=async()=>{error.value='';loading.value=true;try{await admin.login(identifier.value,password.value);await navigateTo(typeof route.query.redirect==='string'?route.query.redirect:'/admin')}catch(e:any){error.value=e?.data?.error==='ADMIN_UNAUTHORIZED'?'У аккаунта нет доступа к админке':'Не удалось войти'}finally{loading.value=false}}
</script>
<style lang="scss">
@use '../../../shared/styles/admin/base.scss'; .error{color:#b64242;font-size:13px}
</style>
