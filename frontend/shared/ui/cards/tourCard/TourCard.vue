<script setup lang="ts">
import TourCard from '@entities/tours/ui/cards/TourCard.vue'
import type { Tour } from '~/types/tours'
defineProps<{ tour: Tour }>()
</script>
<template><TourCard :tour="tour" /></template>
