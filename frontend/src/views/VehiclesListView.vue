<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { extractErrorMessage } from '../api/client'
import VehicleCard from '../components/VehicleCard.vue'
import { useVehiclesStore } from '../stores/vehicles'

const store = useVehiclesStore()
const showForm = ref(false)
const showArchived = ref(false)
const submitting = ref(false)
const error = ref('')

const form = reactive({ name: '', brand: '', model: '' })

onMounted(() => store.fetchAll())

async function toggleArchived() {
  showArchived.value = !showArchived.value
  if (showArchived.value) await store.fetchArchived()
}

async function submit() {
  if (!form.name.trim()) return
  submitting.value = true
  error.value = ''
  try {
    const vehicle = await store.create({
      name: form.name.trim(),
      brand: form.brand.trim() || undefined,
      model: form.model.trim() || undefined,
    })
    form.name = ''
    form.brand = ''
    form.model = ''
    showForm.value = false
    void vehicle
  } catch (e) {
    error.value = extractErrorMessage(e)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold">Mes véhicules</h1>
      <button
        type="button"
        class="rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white active:bg-indigo-700"
        @click="showForm = !showForm"
      >
        {{ showForm ? 'Annuler' : '+ Véhicule' }}
      </button>
    </div>

    <form v-if="showForm" class="mt-4 space-y-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900" @submit.prevent="submit">
      <div>
        <label class="mb-1 block text-sm font-medium">Nom *</label>
        <input v-model="form.name" required placeholder="Ex : Clio de Marie" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-base dark:border-gray-700 dark:bg-gray-950" />
      </div>
      <div class="flex gap-3">
        <div class="flex-1">
          <label class="mb-1 block text-sm font-medium">Marque</label>
          <input v-model="form.brand" placeholder="Renault" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-base dark:border-gray-700 dark:bg-gray-950" />
        </div>
        <div class="flex-1">
          <label class="mb-1 block text-sm font-medium">Modèle</label>
          <input v-model="form.model" placeholder="Clio V" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-base dark:border-gray-700 dark:bg-gray-950" />
        </div>
      </div>
      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
      <button type="submit" :disabled="submitting" class="w-full rounded-lg bg-indigo-600 py-2.5 font-medium text-white disabled:opacity-50">
        Ajouter
      </button>
    </form>

    <p v-if="store.loading && !store.vehicles.length" class="mt-8 text-center text-gray-500">Chargement...</p>
    <p v-else-if="!store.vehicles.length" class="mt-8 text-center text-gray-500">
      Aucun véhicule pour l'instant. Ajoutez-en un pour commencer à suivre votre consommation.
    </p>

    <ul class="mt-4 space-y-2">
      <li v-for="vehicle in store.vehicles" :key="vehicle.id">
        <VehicleCard :vehicle="vehicle" />
      </li>
    </ul>

    <button type="button" class="mt-6 text-sm text-gray-500" @click="toggleArchived">
      {{ showArchived ? 'Masquer' : 'Afficher' }} les véhicules archivés
    </button>

    <template v-if="showArchived">
      <p v-if="store.archivedLoading && !store.archivedVehicles.length" class="mt-4 text-center text-gray-500">Chargement...</p>
      <p v-else-if="!store.archivedVehicles.length" class="mt-4 text-center text-gray-500">Aucun véhicule archivé.</p>
      <ul v-else class="mt-2 space-y-2">
        <li v-for="vehicle in store.archivedVehicles" :key="vehicle.id">
          <VehicleCard :vehicle="vehicle" />
        </li>
      </ul>
    </template>
  </div>
</template>
