import { defineNuxtConfig } from 'nuxt/config'
import { fileURLToPath } from 'url'

export default defineNuxtConfig({
  // Load the design system globally. Keeping this in Nuxt config avoids relying on a layout SFC style block for global CSS.
  css: ['./shared/styles/global.scss'],
  compatibilityDate: '2025-07-15',
   modules: ['@nuxtjs/i18n'],
  devtools: { enabled: true },
  runtimeConfig: {
    public: {
      useDemoFallback: process.env.NUXT_PUBLIC_USE_DEMO_FALLBACK === 'true',
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:3001',
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    },
  },
  app: {
    head: {
      title: 'Trove — сравнивайте путешествия в одном месте',
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Manrope:wght@500;600;700;800&display=swap' },
      ],
      meta: [
        {
          name: 'description',
          content:
            'Trove собирает предложения для путешествий и помогает выбрать подходящий вариант.',
        },
      ],
    },
  },
  alias: {
    '@widgets': fileURLToPath(new URL('./widgets', import.meta.url)),
    '@features': fileURLToPath(new URL('./features', import.meta.url)),
    '@entities': fileURLToPath(new URL('./entities', import.meta.url)),
    '@shared': fileURLToPath(new URL('./shared', import.meta.url)),
    '@pages': fileURLToPath(new URL('./pages', import.meta.url)),
    '@types': fileURLToPath(new URL('./types', import.meta.url)),
    '@composables': fileURLToPath(new URL('./composables', import.meta.url)),
    '@': fileURLToPath(new URL('./app', import.meta.url)),
    '~': fileURLToPath(new URL('./app', import.meta.url)),
  },
})