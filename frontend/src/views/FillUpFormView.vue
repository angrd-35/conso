<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { extractErrorMessage } from '../api/client'
import { fillUpsApi } from '../api/fillUps'
import { useFuelTypesStore } from '../stores/fuelTypes'

const props = defineProps<{ id: string; fillUpId?: string }>()
const router = useRouter()
const fuelTypesStore = useFuelTypesStore()

const isEdit = computed(() => Boolean(props.fillUpId))
const loading = ref(true)
const submitting = ref(false)
const error = ref('')
const stations = ref<string[]>([])

interface ComponentRow {
  fuelTypeId: string
  quantityLiters: number | string
  pricePerLiter: number | string
}

function emptyComponent(): ComponentRow {
  return { fuelTypeId: fuelTypesStore.fuelTypes[0]?.id ?? '', quantityLiters: '', pricePerLiter: '' }
}

const form = reactive({
  date: new Date().toISOString().slice(0, 10),
  odometerKm: '' as number | string,
  station: '',
  fullTank: true,
  remainingRangeKm: '' as number | string,
})

const components = ref<ComponentRow[]>([])

const totalPrice = computed(() =>
  components.value.reduce((sum, c) => sum + (Number(c.quantityLiters) || 0) * (Number(c.pricePerLiter) || 0), 0),
)
const totalLiters = computed(() =>
  components.value.reduce((sum, c) => sum + (Number(c.quantityLiters) || 0), 0),
)

function addComponent() {
  components.value.push(emptyComponent())
}

function removeComponent(index: number) {
  components.value.splice(index, 1)
}

onMounted(async () => {
  await fuelTypesStore.fetchAll()
  fillUpsApi.listStations().then((list) => (stations.value = list))
  if (isEdit.value && props.fillUpId) {
    const fillUp = await fillUpsApi.get(props.id, props.fillUpId)
    form.date = fillUp.date.slice(0, 10)
    form.odometerKm = fillUp.odometerKm
    form.station = fillUp.station ?? ''
    form.fullTank = fillUp.fullTank
    form.remainingRangeKm = fillUp.remainingRangeKm ?? ''
    components.value = fillUp.components.map((c) => ({
      fuelTypeId: c.fuelTypeId,
      quantityLiters: c.quantityLiters,
      pricePerLiter: c.pricePerLiter,
    }))
  } else {
    components.value = [emptyComponent()]
  }
  loading.value = false
})

async function submit() {
  if (components.value.some((c) => !c.fuelTypeId)) {
    error.value = 'Choisissez un type de carburant pour chaque ligne'
    return
  }
  submitting.value = true
  error.value = ''
  try {
    const payload = {
      date: form.date,
      odometerKm: Number(form.odometerKm),
      station: form.station.trim() || undefined,
      fullTank: form.fullTank,
      remainingRangeKm: form.remainingRangeKm === '' ? undefined : Number(form.remainingRangeKm),
      components: components.value.map((c) => ({
        fuelTypeId: c.fuelTypeId,
        quantityLiters: Number(c.quantityLiters),
        pricePerLiter: Number(c.pricePerLiter),
      })),
    }
    if (isEdit.value && props.fillUpId) {
      await fillUpsApi.update(props.id, props.fillUpId, payload)
    } else {
      await fillUpsApi.create(props.id, payload)
    }
    router.push({ name: 'vehicle-detail', params: { id: props.id } })
  } catch (e) {
    error.value = extractErrorMessage(e)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div>
    <router-link :to="{ name: 'vehicle-detail', params: { id } }" class="text-sm text-gray-500">&larr; Retour</router-link>
    <h1 class="mt-2 text-xl font-semibold">{{ isEdit ? 'Modifier le plein' : 'Nouveau plein' }}</h1>

    <p v-if="loading" class="mt-8 text-center text-gray-500">Chargement...</p>

    <form v-else class="mt-4 space-y-4" @submit.prevent="submit">
      <div>
        <label class="mb-1 block text-sm font-medium">Date *</label>
        <input v-model="form.date" type="date" required class="w-full rounded-lg border border-gray-300 px-3 py-2 text-base dark:border-gray-700 dark:bg-gray-950" />
      </div>

      <div>
        <label class="mb-1 block text-sm font-medium">Kilométrage *</label>
        <input v-model="form.odometerKm" type="number" inputmode="numeric" min="0" required class="w-full rounded-lg border border-gray-300 px-3 py-2 text-base dark:border-gray-700 dark:bg-gray-950" />
      </div>

      <div>
        <label class="mb-1 block text-sm font-medium">Enseigne</label>
        <input
          v-model="form.station"
          list="stations-list"
          placeholder="Ex : TotalEnergies, Leclerc..."
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-base dark:border-gray-700 dark:bg-gray-950"
        />
        <datalist id="stations-list">
          <option v-for="s in stations" :key="s" :value="s" />
        </datalist>
      </div>

      <div>
        <label class="mb-1 block text-sm font-medium">Km restants sur la jauge</label>
        <input v-model="form.remainingRangeKm" type="number" inputmode="numeric" min="0" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-base dark:border-gray-700 dark:bg-gray-950" />
      </div>

      <div>
        <div class="mb-1 flex items-center justify-between">
          <label class="block text-sm font-medium">Carburant(s) *</label>
          <button type="button" class="text-sm font-medium text-indigo-600" @click="addComponent">+ Ajouter un carburant</button>
        </div>

        <p v-if="!fuelTypesStore.fuelTypes.length" class="text-xs text-amber-600">
          Aucun type de carburant : ajoutez-en un depuis l'onglet Carburants.
        </p>

        <div v-for="(component, index) in components" :key="index" class="mt-2 rounded-lg border border-gray-300 p-3 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <select
              v-model="component.fuelTypeId"
              required
              class="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-base dark:border-gray-700 dark:bg-gray-950"
            >
              <option v-for="fuel in fuelTypesStore.fuelTypes" :key="fuel.id" :value="fuel.id">{{ fuel.name }}</option>
            </select>
            <button
              v-if="components.length > 1"
              type="button"
              class="ml-2 text-sm text-red-600"
              @click="removeComponent(index)"
            >
              Retirer
            </button>
          </div>
          <div class="mt-2 flex gap-3">
            <div class="flex-1">
              <label class="mb-1 block text-xs text-gray-500">Quantité (L) *</label>
              <input
                v-model="component.quantityLiters"
                type="number"
                inputmode="decimal"
                step="0.01"
                min="0"
                required
                class="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-base dark:border-gray-700 dark:bg-gray-950"
              />
            </div>
            <div class="flex-1">
              <label class="mb-1 block text-xs text-gray-500">Prix au litre (€) *</label>
              <input
                v-model="component.pricePerLiter"
                type="number"
                inputmode="decimal"
                step="0.001"
                min="0"
                required
                class="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-base dark:border-gray-700 dark:bg-gray-950"
              />
            </div>
          </div>
        </div>

        <p class="mt-2 text-sm text-gray-500">
          Total : {{ totalLiters.toFixed(2) }} L · {{ totalPrice.toFixed(2) }} €
        </p>
      </div>

      <label class="flex items-center gap-2 text-sm font-medium">
        <input v-model="form.fullTank" type="checkbox" class="size-4 rounded" />
        Plein complet
      </label>

      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

      <button type="submit" :disabled="submitting" class="w-full rounded-lg bg-indigo-600 py-2.5 font-medium text-white disabled:opacity-50">
        {{ isEdit ? 'Enregistrer' : 'Ajouter' }}
      </button>
    </form>
  </div>
</template>
