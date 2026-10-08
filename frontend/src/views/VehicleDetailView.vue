<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { extractErrorMessage } from '../api/client'
import { fillUpsApi } from '../api/fillUps'
import { statsApi } from '../api/stats'
import { vehiclesApi } from '../api/vehicles'
import type { FillUp, VehicleStats } from '../api/types'
import ConsumptionChart from '../components/ConsumptionChart.vue'
import StatCard from '../components/StatCard.vue'
import { useVehiclesStore } from '../stores/vehicles'

const props = defineProps<{ id: string }>()
const router = useRouter()
const vehiclesStore = useVehiclesStore()

const stats = ref<VehicleStats | null>(null)
const fillUps = ref<FillUp[]>([])
const loading = ref(true)
const error = ref('')
const photoInput = ref<HTMLInputElement | null>(null)
const uploadingPhoto = ref(false)

const vehicle = computed(() => vehiclesStore.getById(props.id))

async function load() {
  loading.value = true
  error.value = ''
  try {
    await Promise.all([vehiclesStore.fetchAll(), vehiclesStore.fetchArchived()])
    const [statsRes, fillUpsRes] = await Promise.all([statsApi.get(props.id), fillUpsApi.list(props.id)])
    stats.value = statsRes
    fillUps.value = fillUpsRes.slice().reverse()
  } catch (e) {
    error.value = extractErrorMessage(e)
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => props.id, load)

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('fr-FR')
}

function componentsSummary(fillUp: FillUp) {
  return fillUp.components.map((c) => `${c.quantityLiters} L ${c.fuelType.name}`).join(' + ')
}

async function removeFillUp(id: string) {
  if (!confirm('Supprimer ce plein ?')) return
  try {
    await fillUpsApi.remove(props.id, id)
    await load()
  } catch (e) {
    error.value = extractErrorMessage(e)
  }
}

async function archiveVehicle() {
  if (!confirm(`Archiver le véhicule "${vehicle.value?.name}" ? Il sera masqué de la liste mais ses données seront conservées.`)) return
  try {
    await vehiclesStore.archive(props.id)
    router.push({ name: 'vehicles' })
  } catch (e) {
    error.value = extractErrorMessage(e)
  }
}

async function unarchiveVehicle() {
  try {
    await vehiclesStore.unarchive(props.id)
  } catch (e) {
    error.value = extractErrorMessage(e)
  }
}

async function onPhotoSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  uploadingPhoto.value = true
  error.value = ''
  try {
    await vehiclesApi.uploadPhoto(props.id, file)
    await vehiclesStore.fetchAll(true)
  } catch (e) {
    error.value = extractErrorMessage(e)
  } finally {
    uploadingPhoto.value = false
    input.value = ''
  }
}

async function removePhoto() {
  if (!confirm('Supprimer la photo du véhicule ?')) return
  try {
    await vehiclesApi.removePhoto(props.id)
    await vehiclesStore.fetchAll(true)
  } catch (e) {
    error.value = extractErrorMessage(e)
  }
}
</script>

<template>
  <div>
    <router-link to="/vehicles" class="text-sm text-gray-500">&larr; Véhicules</router-link>

    <div class="mt-2 flex items-start gap-3">
      <div class="relative shrink-0">
        <img
          v-if="vehicle?.photoUrl"
          :src="vehicle.photoUrl"
          alt=""
          class="size-16 rounded-xl object-cover"
        />
        <div v-else class="flex size-16 items-center justify-center rounded-xl bg-gray-200 text-gray-400 dark:bg-gray-800">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="size-8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 13l1.5-4.5A2 2 0 0 1 6.4 7h11.2a2 2 0 0 1 1.9 1.5L21 13m-18 0v5a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h12v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-5m-18 0h18M6.5 16.5h.01M17.5 16.5h.01" />
          </svg>
        </div>
      </div>
      <div class="flex-1">
        <div class="flex items-center gap-2">
          <h1 class="text-xl font-semibold">{{ vehicle?.name ?? '...' }}</h1>
          <span v-if="vehicle?.archived" class="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            Archivé
          </span>
        </div>
        <p v-if="vehicle?.brand || vehicle?.model" class="text-sm text-gray-500">
          {{ [vehicle?.brand, vehicle?.model].filter(Boolean).join(' ') }}
        </p>
        <div class="mt-1 flex gap-3 text-sm">
          <button type="button" class="text-indigo-600" :disabled="uploadingPhoto" @click="photoInput?.click()">
            {{ uploadingPhoto ? 'Envoi...' : vehicle?.photoUrl ? 'Changer la photo' : 'Ajouter une photo' }}
          </button>
          <button v-if="vehicle?.photoUrl" type="button" class="text-red-600" @click="removePhoto">Retirer</button>
        </div>
        <input ref="photoInput" type="file" accept="image/jpeg,image/png,image/webp" class="hidden" @change="onPhotoSelected" />
      </div>
      <button v-if="vehicle?.archived" type="button" class="text-sm text-indigo-600" @click="unarchiveVehicle">Désarchiver</button>
      <button v-else type="button" class="text-sm text-red-600" @click="archiveVehicle">Archiver</button>
    </div>

    <p v-if="error" class="mt-3 text-sm text-red-600">{{ error }}</p>
    <p v-if="loading" class="mt-8 text-center text-gray-500">Chargement...</p>

    <template v-else-if="stats">
      <div class="mt-4 grid grid-cols-2 gap-2">
        <StatCard label="Conso moyenne" :value="stats.avgConsumptionL100 !== null ? `${stats.avgConsumptionL100} L/100km` : '—'" />
        <StatCard label="Coût / km" :value="stats.costPerKm !== null ? `${stats.costPerKm.toFixed(2)} €/km` : '—'" />
        <StatCard label="Coût total" :value="`${stats.totalCost.toFixed(2)} €`" :sub="`${stats.fillUpsCount} plein(s)`" />
        <StatCard label="Distance totale" :value="`${stats.totalKm} km`" :sub="`${stats.totalLiters} L`" />
      </div>

      <div v-if="stats.history.length" class="mt-4 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
        <p class="mb-2 text-sm font-medium">Évolution de la consommation</p>
        <ConsumptionChart :history="stats.history" />
      </div>

      <div class="mt-4 flex gap-2">
        <router-link
          :to="{ name: 'fillup-new', params: { id } }"
          class="flex-1 rounded-lg bg-indigo-600 py-2.5 text-center text-sm font-medium text-white active:bg-indigo-700"
        >
          + Ajouter un plein
        </router-link>
        <router-link
          :to="{ name: 'fillups-import', params: { id } }"
          class="flex-1 rounded-lg border border-gray-300 py-2.5 text-center text-sm font-medium dark:border-gray-700"
        >
          Importer un CSV
        </router-link>
      </div>

      <h2 class="mt-6 text-sm font-semibold text-gray-500">Historique des pleins</h2>
      <p v-if="!fillUps.length" class="mt-2 text-center text-gray-500">Aucun plein enregistré.</p>
      <ul class="mt-2 space-y-2">
        <li
          v-for="fillUp in fillUps"
          :key="fillUp.id"
          class="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900"
        >
          <div class="flex items-center justify-between">
            <p class="font-medium">
              {{ formatDate(fillUp.date) }} · {{ fillUp.odometerKm }} km
              <span v-if="fillUp.station" class="text-gray-400">· {{ fillUp.station }}</span>
            </p>
            <span
              class="rounded-full px-2 py-0.5 text-xs font-medium"
              :class="fillUp.fullTank ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'"
            >
              {{ fillUp.fullTank ? 'Plein complet' : 'Partiel' }}
            </span>
          </div>
          <p class="mt-1 text-sm text-gray-500">
            {{ componentsSummary(fillUp) }} · {{ fillUp.totalPrice.toFixed(2) }} €
            <span v-if="fillUp.remainingRangeKm !== null"> · autonomie restante {{ fillUp.remainingRangeKm }} km</span>
          </p>
          <div class="mt-2 flex gap-3 text-sm">
            <router-link :to="{ name: 'fillup-edit', params: { id, fillUpId: fillUp.id } }" class="text-indigo-600">Modifier</router-link>
            <button type="button" class="text-red-600" @click="removeFillUp(fillUp.id)">Supprimer</button>
          </div>
        </li>
      </ul>
    </template>
  </div>
</template>
