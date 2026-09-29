<template>
  <header class="site-header">
    <div class="header-inner">
      <NuxtLink to="/" class="logo" aria-label="Trove">
        <img src="/logo/trove-logo.svg" alt="Trove" />
      </NuxtLink>

      <nav class="desktop-nav" aria-label="Основная навигация">
        <NuxtLink to="/tours" :class="{ active: route.path.startsWith('/tours') }">{{ t('navTours') }}</NuxtLink>
        <NuxtLink to="/hot" :class="{ active: route.path === '/hot' }">{{ t('navHot') }}</NuxtLink>
        <NuxtLink to="/guides" :class="{ active: route.path.startsWith('/guides') }">Гид</NuxtLink>
      </nav>

      <div class="header-actions"><select class="header-locale" :value="locale" aria-label="Язык" @change="setLocale(($event.target as HTMLSelectElement).value as any)"><option value="ru">RU</option><option value="en">EN</option><option value="es">ES</option><option value="kk">KZ</option></select>
        <NuxtLink to="/favorites" class="favorite-link"><Heart :size="17" /><span>Избранное</span></NuxtLink>
        <div v-if="user" class="profile-wrap">
          <button class="profile-button" type="button" :aria-expanded="profileOpen" @click="profileOpen=!profileOpen">
            <span>{{ user.firstName?.slice(0,1) || 'T' }}</span>{{ user.firstName }}<ChevronDown :size="14" :class="{ rotated: profileOpen }" />
          </button>
          <div v-if="profileOpen" class="profile-menu">
            <NuxtLink to="/account" @click="profileOpen=false"><UserRound :size="16" />Профиль</NuxtLink>
            <NuxtLink to="/account/bookings" @click="profileOpen=false"><Heart :size="16" />Мои брони</NuxtLink>
            <NuxtLink to="/account" @click="profileOpen=false"><Settings :size="16" />Настройки</NuxtLink>
            <button type="button" @click="logout"><LogOut :size="16" />Выйти</button>
          </div>
        </div>
        <div v-else class="guest-actions">
          <NuxtLink to="/auth/login" class="login-link"><UserRound :size="16" />{{ t('login') }}</NuxtLink>
          <NuxtLink to="/auth/register" class="register-link">{{ t('register') }}</NuxtLink>
        </div>
        <button class="menu-button" type="button" aria-label="Меню" @click="menuOpen=!menuOpen">
          <X v-if="menuOpen" :size="21" /><Menu v-else :size="21" />
        </button>
      </div>
    </div>

    <div v-if="menuOpen" class="mobile-menu-backdrop" @click="menuOpen=false"></div>
    <div v-if="menuOpen" class="mobile-menu">
      <NuxtLink to="/tours" @click="menuOpen=false">{{ t('navTours') }}</NuxtLink>
      <NuxtLink to="/hot" @click="menuOpen=false">Горящие предложения</NuxtLink>
      <NuxtLink to="/guides" @click="menuOpen=false">{{ t('navGuides') }}</NuxtLink>
      <NuxtLink to="/favorites" @click="menuOpen=false">Избранное</NuxtLink>
      <NuxtLink to="/support" @click="menuOpen=false">{{ t('navSupport') }}</NuxtLink>
      <NuxtLink v-if="user" to="/account" @click="menuOpen=false">Личный кабинет</NuxtLink>
      <NuxtLink v-else to="/auth/login" @click="menuOpen=false" class="mobile-login">Войти в аккаунт <span>→</span></NuxtLink>
      <NuxtLink v-if="!user" to="/auth/register" @click="menuOpen=false" class="mobile-register">Создать аккаунт</NuxtLink>
      <button v-if="user" type="button" class="mobile-logout" @click="logout">Выйти</button>
    </div>
  </header>
</template>

<script setup lang="ts">
const { t, locale, setLocale } = useI18n()

import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from '../../composables/useAuth'
import { ChevronDown, Heart, LogOut, Menu, Settings, UserRound, X } from '@lucide/vue'

const route = useRoute()
const auth = useAuth()
const menuOpen = ref(false)
const profileOpen = ref(false)
onMounted(() => auth.load())
const logout = async () => { profileOpen.value = false; await auth.logout(); await navigateTo('/') }
const user = auth.user
</script>

<style scoped lang="scss">
.site-header{position:sticky;top:0;z-index:100;background:color-mix(in srgb,var(--paper) 90%,transparent);border-bottom:1px solid color-mix(in srgb,var(--line) 90%,transparent);backdrop-filter:blur(18px) saturate(150%);-webkit-backdrop-filter:blur(18px) saturate(150%)}
.header-inner{width:min(1240px,calc(100% - 48px));min-height:70px;margin:auto;display:flex;align-items:center;gap:44px}.logo{display:inline-flex;align-items:center;width:118px;height:38px;color:var(--ink)!important;text-decoration:none!important}.logo img{display:block;width:118px;height:auto}
.desktop-nav{display:flex;align-items:center;gap:28px;flex:1}.desktop-nav a{position:relative;padding:25px 0 23px;color:var(--ink-2)!important;text-decoration:none!important;font-size:13px;font-weight:700}.desktop-nav a:hover,.desktop-nav a.active{color:var(--ink)!important}.desktop-nav a.active::after{content:'';position:absolute;left:0;right:0;bottom:13px;height:3px;border-radius:3px;background:var(--brand)}
.header-locale{height:36px;border:1px solid var(--line);border-radius:9px;background:var(--paper);color:var(--ink);padding:0 7px;font-size:10px;font-weight:800}.header-actions{display:flex;align-items:center;gap:8px}.favorite-link{display:inline-flex;align-items:center;gap:7px;padding:9px 10px;color:var(--ink-2)!important;text-decoration:none!important;font-size:13px;font-weight:700;border-radius:10px}.favorite-link:hover{background:var(--surface);color:var(--ink)!important}.guest-actions{display:flex;align-items:center;gap:7px}.profile-wrap{position:relative}.profile-button{display:inline-flex;align-items:center;gap:8px;min-height:42px;padding:0 8px 0 4px;border:1px solid transparent;border-radius:12px;background:transparent;color:var(--ink);font-size:13px;font-weight:800;cursor:pointer}.profile-button:hover,.profile-button[aria-expanded="true"]{background:var(--surface);border-color:var(--line)}.profile-button>span{display:grid;place-items:center;width:34px;height:34px;border-radius:50%;background:var(--forest);color:#fff;font-weight:800}.profile-button svg{transition:transform .18s var(--ease)}.profile-button svg.rotated{transform:rotate(180deg)}.profile-menu{position:absolute;top:calc(100% + 9px);right:0;width:210px;padding:6px;background:var(--paper);border:1px solid var(--line-strong);border-radius:14px;box-shadow:var(--shadow-lg)}.profile-menu a,.profile-menu button{display:flex;align-items:center;gap:9px;width:100%;min-height:40px;padding:0 10px;border:0;border-radius:9px;background:transparent;color:var(--ink)!important;text-decoration:none!important;text-align:left;font-size:12px;font-weight:700;cursor:pointer}.profile-menu a:hover,.profile-menu button:hover{background:var(--surface)}.profile-menu button{color:var(--danger)!important;border-top:1px solid var(--line);margin-top:4px;border-radius:0}.login-link,.register-link{display:inline-flex;align-items:center;gap:7px;justify-content:center;min-height:40px;padding:0 14px;border-radius:10px;text-decoration:none!important;font-size:12px;font-weight:800}.login-link{background:var(--ink);color:#fff!important}.login-link:hover{background:#26372e;transform:translateY(-1px)}.register-link{border:1px solid var(--line-strong);background:var(--paper);color:var(--ink)!important}.register-link:hover{background:var(--surface)}
.menu-button{display:none;width:42px;height:42px;border:1px solid var(--line);border-radius:11px;background:var(--paper);color:var(--ink)}.mobile-menu-backdrop{position:fixed;inset:64px 0 0;background:rgba(8,18,13,.24);backdrop-filter:blur(2px);z-index:-1}.mobile-menu{width:min(1240px,calc(100% - 32px));margin:auto;padding:3px 0 16px;background:var(--paper)}.mobile-menu a{display:block;padding:14px 0;border-bottom:1px solid var(--line);color:var(--ink)!important;text-decoration:none!important;font-weight:700}.mobile-menu a:last-child{border-bottom:0}.mobile-logout{display:block;width:100%;padding:14px 0;border:0;background:transparent;color:var(--danger);text-align:left;font-weight:800;cursor:pointer}
@media(max-width:900px){.guest-actions .register-link{display:none}.header-inner{gap:18px}}@media(max-width:800px){.mobile-menu{box-shadow:0 18px 36px rgba(16,32,25,.12)}.header-inner{width:calc(100% - 32px);min-height:64px;gap:15px}.desktop-nav,.favorite-link,.profile-button{display:none}.profile-wrap{display:none}.header-actions{margin-left:auto}.menu-button{display:grid;place-items:center}}@media(max-width:500px){.logo{width:104px}.logo img{width:104px}}
</style>
