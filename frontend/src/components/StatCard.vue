<script setup lang="ts">
defineProps<{
  label: string
  value: string
  sub?: string
}>()
</script>

<template>
  <div class="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
    <p class="text-xs text-gray-500 dark:text-gray-400">{{ label }}</p>
    <p class="mt-1 text-lg font-semibold tabular-nums">{{ value }}</p>
    <p v-if="sub" class="text-xs text-gray-400 dark:text-gray-500">{{ sub }}</p>
  </div>
</template>
