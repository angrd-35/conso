<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { extractErrorMessage } from '../api/client'
import { useFuelTypesStore } from '../stores/fuelTypes'

const store = useFuelTypesStore()
const newFuel = reactive({ name: '', ethanolRate: '' as number | string })
const submitting = ref(false)
const error = ref('')
const editingId = ref<string | null>(null)
const editingFuel = reactive({ name: '', ethanolRate: '' as number | string })

onMounted(() => store.fetchAll())

async function submit() {
  if (!newFuel.name.trim()) return
  submitting.value = true
  error.value = ''
  try {
    await store.create({
      name: newFuel.name.trim(),
      ethanolRate: newFuel.ethanolRate === '' ? undefined : Number(newFuel.ethanolRate),
    })
    newFuel.name = ''
    newFuel.ethanolRate = ''
  } catch (e) {
    error.value = extractErrorMessage(e)
  } finally {
    submitting.value = false
  }
}

function startEdit(id: string, name: string, ethanolRate: number | null) {
  editingId.value = id
  editingFuel.name = name
  editingFuel.ethanolRate = ethanolRate ?? ''
}

async function saveEdit() {
  if (!editingId.value || !editingFuel.name.trim()) return
  try {
    await store.update(editingId.value, {
      name: editingFuel.name.trim(),
      ethanolRate: editingFuel.ethanolRate === '' ? undefined : Number(editingFuel.ethanolRate),
    })
    editingId.value = null
  } catch (e) {
    error.value = extractErrorMessage(e)
  }
}

async function remove(id: string) {
  if (!confirm('Supprimer ce type de carburant ?')) return
  try {
    await store.remove(id)
  } catch (e) {
    error.value = extractErrorMessage(e)
  }
}
</script>

<template>
  <div>
    <h1 class="text-xl font-semibold">Types de carburant</h1>

    <form class="mt-4 space-y-2 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900" @submit.prevent="submit">
      <div class="flex gap-2">
        <input
          v-model="newFuel.name"
          placeholder="Ex : SP98, Diesel, E85..."
          class="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-base dark:border-gray-700 dark:bg-gray-950"
        />
        <input
          v-model="newFuel.ethanolRate"
          type="number"
          inputmode="numeric"
          min="0"
          max="100"
          placeholder="% éthanol"
          class="w-28 rounded-lg border border-gray-300 px-3 py-2 text-base dark:border-gray-700 dark:bg-gray-950"
        />
      </div>
      <button type="submit" :disabled="submitting" class="w-full rounded-lg bg-indigo-600 py-2 font-medium text-white disabled:opacity-50">
        Ajouter
      </button>
    </form>
    <p v-if="error" class="mt-2 text-sm text-red-600">{{ error }}</p>

    <p v-if="store.loading && !store.fuelTypes.length" class="mt-8 text-center text-gray-500">Chargement...</p>
    <p v-else-if="!store.fuelTypes.length" class="mt-8 text-center text-gray-500">Aucun type de carburant pour l'instant.</p>

    <ul class="mt-4 space-y-2">
      <li
        v-for="fuel in store.fuelTypes"
        :key="fuel.id"
        class="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900"
      >
        <template v-if="editingId === fuel.id">
          <div class="flex gap-2">
            <input v-model="editingFuel.name" class="flex-1 rounded-lg border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-950" />
            <input
              v-model="editingFuel.ethanolRate"
              type="number"
              inputmode="numeric"
              min="0"
              max="100"
              placeholder="% éthanol"
              class="w-24 rounded-lg border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-950"
            />
          </div>
          <div class="mt-2 flex gap-3 text-sm">
            <button type="button" class="font-medium text-indigo-600" @click="saveEdit">Enregistrer</button>
            <button type="button" class="text-gray-500" @click="editingId = null">Annuler</button>
          </div>
        </template>
        <template v-else>
          <div class="flex items-center gap-2">
            <span class="flex-1">
              {{ fuel.name }}
              <span v-if="fuel.ethanolRate !== null" class="text-sm text-gray-400"> · {{ fuel.ethanolRate }}% éthanol</span>
            </span>
            <button type="button" class="text-sm text-gray-500" @click="startEdit(fuel.id, fuel.name, fuel.ethanolRate)">Modifier</button>
            <button type="button" class="text-sm text-red-600" @click="remove(fuel.id)">Supprimer</button>
          </div>
        </template>
      </li>
    </ul>
  </div>
</template>
