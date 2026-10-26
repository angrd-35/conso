<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

function isActive(name: string) {
  if (name === 'vehicles') {
    return route.name === 'vehicles' || route.name === 'vehicle-detail' || String(route.name).startsWith('fillup')
  }
  return route.name === name
}
</script>

<template>
  <nav
    class="fixed inset-x-0 bottom-0 z-10 mx-auto flex max-w-lg border-t border-gray-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-gray-800 dark:bg-gray-900/95"
  >
    <router-link
      to="/vehicles"
      class="flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium"
      :class="isActive('vehicles') ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="size-6">
        <path stroke-linecap="round" stroke-linejoin="round" d="M3 13l1.5-4.5A2 2 0 0 1 6.4 7h11.2a2 2 0 0 1 1.9 1.5L21 13m-18 0v5a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h12v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-5m-18 0h18M6.5 16.5h.01M17.5 16.5h.01" />
      </svg>
      Véhicules
    </router-link>
    <router-link
      to="/fuel-types"
      class="flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium"
      :class="isActive('fuel-types') ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="size-6">
        <path stroke-linecap="round" stroke-linejoin="round" d="M5 21V8.5A2.5 2.5 0 0 1 7.5 6H12v15M5 21h9M14 10h1.5A1.5 1.5 0 0 1 17 11.5V13l2 1.2V19a1.5 1.5 0 0 1-3 0v-1" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 6V4a1 1 0 0 1 1-1H10" />
      </svg>
      Carburants
    </router-link>
    <!-- Navigation complète (pas router-link) : on quitte l'app pour le logout du portail Authelia -->
    <a
      href="https://auth.angrd.ovh/logout?rd=https://conso.angrd.ovh"
      class="flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="size-6">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 17l5-5-5-5M20 12H9M12 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6" />
      </svg>
      Déconnexion
    </a>
  </nav>
</template>
