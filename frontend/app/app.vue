<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
useSeoMeta({
  title: 'Trove — путешествия без лишней суеты',
  description: 'Trove собирает предложения для путешествий, сравнивает цены и помогает забронировать подходящий вариант.',
  ogTitle: 'Trove — путешествия без лишней суеты',
  ogDescription: 'Сравниваем предложения и помогаем найти путешествие, которое подходит именно вам.',
  ogType: 'website',
  twitterCard: 'summary_large_image',
})
</script>
