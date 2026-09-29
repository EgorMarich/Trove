<template>
  <div class="admin-shell">
    <aside class="admin-sidebar">
      <NuxtLink to="/admin" class="admin-brand"><img src="/logo/trove-logo.svg" alt="Trove"><span>Admin</span></NuxtLink>
      <nav>
        <NuxtLink to="/admin" exact-active-class="active"><span>Overview</span></NuxtLink>
        <NuxtLink to="/admin/users" active-class="active"><span>Пользователи</span></NuxtLink>
        <NuxtLink to="/admin/bookings" active-class="active"><span>Бронирования</span></NuxtLink>
        <NuxtLink to="/admin/tours" active-class="active"><span>Туры</span></NuxtLink><NuxtLink to="/admin/providers" active-class="active"><span>Поставщики</span></NuxtLink>
        <NuxtLink to="/admin/guides" active-class="active"><span>Guides</span></NuxtLink><NuxtLink to="/admin/content" active-class="active"><span>Главная и акции</span></NuxtLink>
        <NuxtLink to="/admin/marketing" active-class="active"><span>Marketing OS</span></NuxtLink><NuxtLink to="/admin/audit" active-class="active"><span>Журнал действий</span></NuxtLink>
      </nav>
      <div class="sidebar-bottom"><NuxtLink to="/">← Вернуться на сайт</NuxtLink></div>
    </aside>
    <div class="admin-main">
      <header class="admin-topbar">
        <div><span class="eyebrow">TROVE BACK OFFICE</span><strong>{{ pageTitle }}</strong></div>
        <div class="admin-account" v-if="admin.user"><span class="avatar">{{ initials }}</span><div><b>{{ admin.user.firstName }}</b><small>{{ admin.user.role }}</small></div><button @click="admin.logout">Выйти</button></div>
      </header>
      <main class="admin-content"><slot /></main>
    </div>
  </div>
</template>
<script setup lang="ts">
const route=useRoute(); const admin=useAdmin(); await admin.load().catch(()=>undefined)
const titles:Record<string,string>={'/admin':'Dashboard','/admin/users':'Пользователи','/admin/bookings':'Бронирования','/admin/tours':'Туры','/admin/providers':'Поставщики','/admin/guides':'Guides','/admin/content':'Главная и акции','/admin/audit':'Журнал действий','/admin/marketing':'Marketing OS'}
const pageTitle=computed(()=>titles[route.path] || (route.path.startsWith('/admin/users/')?'Профиль пользователя':route.path.startsWith('/admin/guides/')?'Редактор статьи':route.path.startsWith('/admin/marketing/')?'Marketing OS':'Trove Admin'))
const initials=computed(()=>`${admin.user.value?.firstName?.[0]??''}${admin.user.value?.lastName?.[0]??''}`.toUpperCase())
</script>
<style lang="scss">
@use '../../shared/styles/admin/base.scss';
</style>
