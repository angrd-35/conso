<script setup lang="ts">
import Papa from 'papaparse'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { extractErrorMessage } from '../api/client'
import { fillUpsApi } from '../api/fillUps'
import type { BulkFillUpItem } from '../api/types'

const props = defineProps<{ id: string }>()
const router = useRouter()

type FieldKey =
  | 'date'
  | 'odometerKm'
  | 'quantityLiters'
  | 'totalPrice'
  | 'fuelTypeName'
  | 'fullTank'
  | 'remainingRangeKm'
  | 'station'

const fields: { key: FieldKey; label: string; required: boolean }[] = [
  { key: 'date', label: 'Date', required: true },
  { key: 'odometerKm', label: 'Kilométrage', required: true },
  { key: 'quantityLiters', label: 'Quantité (L)', required: true },
  { key: 'totalPrice', label: 'Prix total', required: true },
  { key: 'fuelTypeName', label: 'Type de carburant', required: true },
  { key: 'fullTank', label: 'Plein complet', required: false },
  { key: 'remainingRangeKm', label: 'Km restants (jauge)', required: false },
  { key: 'station', label: 'Enseigne', required: false },
]

const headers = ref<string[]>([])
const rawRows = ref<Record<string, string>[]>([])
const mapping = ref<Record<FieldKey, string>>({
  date: '',
  odometerKm: '',
  quantityLiters: '',
  totalPrice: '',
  fuelTypeName: '',
  fullTank: '',
  remainingRangeKm: '',
  station: '',
})
const fileName = ref('')
const importing = ref(false)
const importResult = ref<{ imported: number } | null>(null)
const importError = ref('')

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  fileName.value = file.name
  importResult.value = null
  importError.value = ''

  Papa.parse<Record<string, string>>(file, {
    header: true,
    skipEmptyLines: true,
    complete: (result) => {
      headers.value = result.meta.fields ?? []
      rawRows.value = result.data
      autoGuessMapping()
    },
  })
}

function autoGuessMapping() {
  const guesses: Record<FieldKey, string[]> = {
    date: ['date'],
    odometerKm: ['km', 'kilometrage', 'kilométrage', 'odometer', 'compteur'],
    quantityLiters: ['litres', 'liters', 'quantite', 'quantité', 'volume'],
    totalPrice: ['prix', 'price', 'montant', 'total', 'cout', 'coût'],
    fuelTypeName: ['carburant', 'fuel', 'type'],
    fullTank: ['plein', 'fulltank', 'complet'],
    remainingRangeKm: ['autonomie', 'jauge', 'restant', 'range'],
    station: ['enseigne', 'station', 'marque'],
  }
  for (const field of fields) {
    if (mapping.value[field.key]) continue
    const normalized = headers.value.map((h) => ({ header: h, norm: h.toLowerCase().trim() }))
    const found = normalized.find((h) => guesses[field.key].some((g) => h.norm.includes(g)))
    if (found) mapping.value[field.key] = found.header
  }
}

function parseDate(raw: string): string | null {
  const value = raw.trim()
  if (!value) return null
  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`
  const frMatch = value.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/)
  if (frMatch) {
    const [, d, m, y] = frMatch
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  const parsed = new Date(value)
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10)
  return null
}

function parseNumber(raw: string): number | null {
  const value = raw.trim().replace(/\s/g, '').replace(',', '.').replace(/[€$]/g, '')
  if (!value) return null
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

function parseBoolean(raw: string | undefined): boolean {
  if (!raw) return true
  const value = raw.trim().toLowerCase()
  return !['0', 'false', 'non', 'faux', 'no', 'partiel'].includes(value)
}

interface ParsedRow {
  index: number
  item: BulkFillUpItem | null
  errors: string[]
}

const isMappingComplete = computed(() =>
  fields.filter((f) => f.required).every((f) => mapping.value[f.key]),
)

const parsedRows = computed<ParsedRow[]>(() => {
  if (!isMappingComplete.value) return []
  return rawRows.value.map((row, index) => {
    const errors: string[] = []
    const date = parseDate(row[mapping.value.date] ?? '')
    if (!date) errors.push('date invalide')
    const odometerKm = parseNumber(row[mapping.value.odometerKm] ?? '')
    if (odometerKm === null) errors.push('kilométrage invalide')
    const quantityLiters = parseNumber(row[mapping.value.quantityLiters] ?? '')
    if (quantityLiters === null) errors.push('quantité invalide')
    const totalPrice = parseNumber(row[mapping.value.totalPrice] ?? '')
    if (totalPrice === null) errors.push('prix invalide')
    const fuelTypeName = (row[mapping.value.fuelTypeName] ?? '').trim()
    if (!fuelTypeName) errors.push('type de carburant manquant')
    const remainingRangeKmRaw = mapping.value.remainingRangeKm ? row[mapping.value.remainingRangeKm] : undefined
    const remainingRangeKm = remainingRangeKmRaw ? parseNumber(remainingRangeKmRaw) ?? undefined : undefined
    const station = mapping.value.station ? row[mapping.value.station]?.trim() || undefined : undefined

    if (errors.length || date === null || odometerKm === null || quantityLiters === null || totalPrice === null) {
      return { index, item: null, errors }
    }

    return {
      index,
      errors: [],
      item: {
        date,
        odometerKm,
        quantityLiters,
        totalPrice,
        fuelTypeName,
        fullTank: parseBoolean(mapping.value.fullTank ? row[mapping.value.fullTank] : undefined),
        remainingRangeKm,
        station,
      },
    }
  })
})

const validCount = computed(() => parsedRows.value.filter((r) => r.item).length)
const invalidRows = computed(() => parsedRows.value.filter((r) => !r.item))

async function submitImport() {
  const items = parsedRows.value.filter((r) => r.item).map((r) => r.item as BulkFillUpItem)
  if (!items.length) return
  importing.value = true
  importError.value = ''
  importResult.value = null
  try {
    importResult.value = await fillUpsApi.bulkImport(props.id, items)
  } catch (e) {
    importError.value = extractErrorMessage(e)
  } finally {
    importing.value = false
  }
}

function goToVehicle() {
  router.push({ name: 'vehicle-detail', params: { id: props.id } })
}
</script>

<template>
  <div>
    <router-link :to="{ name: 'vehicle-detail', params: { id } }" class="text-sm text-gray-500">&larr; Retour</router-link>
    <h1 class="mt-2 text-xl font-semibold">Importer un historique CSV</h1>

    <div class="mt-4 rounded-xl border border-dashed border-gray-300 p-4 text-center dark:border-gray-700">
      <input type="file" accept=".csv,text/csv" class="w-full text-sm" @change="onFileChange" />
      <p v-if="fileName" class="mt-2 text-sm text-gray-500">{{ fileName }} · {{ rawRows.length }} ligne(s) détectée(s)</p>
    </div>

    <template v-if="headers.length">
      <h2 class="mt-6 text-sm font-semibold text-gray-500">Associez vos colonnes</h2>
      <div class="mt-2 space-y-2">
        <div v-for="field in fields" :key="field.key" class="flex items-center gap-2">
          <label class="w-40 shrink-0 text-sm">{{ field.label }} <span v-if="field.required" class="text-red-500">*</span></label>
          <select v-model="mapping[field.key]" class="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-950">
            <option value="">—</option>
            <option v-for="h in headers" :key="h" :value="h">{{ h }}</option>
          </select>
        </div>
      </div>

      <template v-if="isMappingComplete">
        <div class="mt-4 rounded-xl border border-gray-200 bg-white p-3 text-sm dark:border-gray-800 dark:bg-gray-900">
          <p class="font-medium text-emerald-600">{{ validCount }} ligne(s) prête(s) à importer</p>
          <p v-if="invalidRows.length" class="mt-1 text-amber-600">
            {{ invalidRows.length }} ligne(s) ignorée(s) : {{ invalidRows.slice(0, 5).map((r) => `#${r.index + 1} (${r.errors.join(', ')})`).join(' · ') }}
            <span v-if="invalidRows.length > 5">...</span>
          </p>
        </div>

        <div class="mt-3 overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
          <table class="w-full text-left text-xs">
            <thead class="bg-gray-100 dark:bg-gray-800">
              <tr>
                <th class="p-2">Date</th>
                <th class="p-2">Km</th>
                <th class="p-2">L</th>
                <th class="p-2">Prix</th>
                <th class="p-2">Carburant</th>
                <th class="p-2">Plein</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in parsedRows.slice(0, 8)" :key="row.index" class="border-t border-gray-200 dark:border-gray-800">
                <template v-if="row.item">
                  <td class="p-2">{{ row.item.date }}</td>
                  <td class="p-2">{{ row.item.odometerKm }}</td>
                  <td class="p-2">{{ row.item.quantityLiters }}</td>
                  <td class="p-2">{{ row.item.totalPrice }}</td>
                  <td class="p-2">{{ row.item.fuelTypeName }}</td>
                  <td class="p-2">{{ row.item.fullTank ? 'Oui' : 'Non' }}</td>
                </template>
                <td v-else colspan="6" class="p-2 text-red-600">Ligne #{{ row.index + 1 }} ignorée : {{ row.errors.join(', ') }}</td>
              </tr>
            </tbody>
          </table>
          <p v-if="parsedRows.length > 8" class="p-2 text-xs text-gray-400">... et {{ parsedRows.length - 8 }} ligne(s) de plus</p>
        </div>

        <button
          type="button"
          :disabled="!validCount || importing"
          class="mt-4 w-full rounded-lg bg-indigo-600 py-2.5 font-medium text-white disabled:opacity-50"
          @click="submitImport"
        >
          {{ importing ? 'Import en cours...' : `Importer ${validCount} plein(s)` }}
        </button>
      </template>
    </template>

    <div v-if="importResult" class="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
      {{ importResult.imported }} plein(s) importé(s) avec succès.
      <button type="button" class="mt-2 block font-medium underline" @click="goToVehicle">Retour au véhicule</button>
    </div>
    <p v-if="importError" class="mt-4 text-sm text-red-600">{{ importError }}</p>
  </div>
</template>
