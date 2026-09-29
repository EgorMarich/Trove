<template>
  <div class="app-shell">
    <Header />
    <main><slot /></main>
    <Footer />
  </div>
</template>

<script setup lang="ts">
import Header from '@widgets/header/Header.vue'
import Footer from '@widgets/footer/Footer.vue'
</script>

<style lang="scss">
html, body, #__nuxt { margin: 0; min-height: 100%; }
.app-shell { min-height: 100vh; }
main { min-height: calc(100vh - var(--header-height)); }
</style>
