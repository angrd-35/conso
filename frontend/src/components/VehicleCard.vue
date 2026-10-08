<script setup lang="ts">
import type { Vehicle } from '../api/types'

defineProps<{ vehicle: Vehicle }>()
</script>

<template>
  <router-link
    :to="{ name: 'vehicle-detail', params: { id: vehicle.id } }"
    class="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 active:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:active:bg-gray-800"
    :class="{ 'opacity-60': vehicle.archived }"
  >
    <img v-if="vehicle.photoUrl" :src="vehicle.photoUrl" alt="" class="size-12 shrink-0 rounded-lg object-cover" />
    <div v-else class="flex size-12 shrink-0 items-center justify-center rounded-lg bg-gray-200 text-gray-400 dark:bg-gray-800">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="size-6">
        <path stroke-linecap="round" stroke-linejoin="round" d="M3 13l1.5-4.5A2 2 0 0 1 6.4 7h11.2a2 2 0 0 1 1.9 1.5L21 13m-18 0v5a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h12v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-5m-18 0h18M6.5 16.5h.01M17.5 16.5h.01" />
      </svg>
    </div>
    <div>
      <div class="flex items-center gap-2">
        <p class="font-medium">{{ vehicle.name }}</p>
        <span v-if="vehicle.archived" class="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
          Archivé
        </span>
      </div>
      <p v-if="vehicle.brand || vehicle.model" class="text-sm text-gray-500">
        {{ [vehicle.brand, vehicle.model].filter(Boolean).join(' ') }}
      </p>
    </div>
  </router-link>
</template>
