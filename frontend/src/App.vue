<script setup lang="ts">
import BottomNav from './components/BottomNav.vue'
</script>

<template>
  <div class="mx-auto flex min-h-screen max-w-lg flex-col bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
    <main class="flex-1 px-4 pt-4 pb-24">
      <router-view />
    </main>
    <BottomNav />
  </div>
</template>
