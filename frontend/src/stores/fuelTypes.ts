import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fuelTypesApi } from '../api/fuelTypes'
import type { CreateFuelTypeInput, FuelType } from '../api/types'

export const useFuelTypesStore = defineStore('fuelTypes', () => {
  const fuelTypes = ref<FuelType[]>([])
  const loaded = ref(false)
  const loading = ref(false)

  async function fetchAll(force = false) {
    if (loaded.value && !force) return
    loading.value = true
    try {
      fuelTypes.value = await fuelTypesApi.list()
      loaded.value = true
    } finally {
      loading.value = false
    }
  }

  async function create(input: CreateFuelTypeInput) {
    const fuelType = await fuelTypesApi.create(input)
    fuelTypes.value.push(fuelType)
    fuelTypes.value.sort((a, b) => a.name.localeCompare(b.name))
    return fuelType
  }

  async function update(id: string, input: CreateFuelTypeInput) {
    const fuelType = await fuelTypesApi.update(id, input)
    const index = fuelTypes.value.findIndex((f) => f.id === id)
    if (index !== -1) fuelTypes.value[index] = fuelType
    return fuelType
  }

  async function remove(id: string) {
    await fuelTypesApi.remove(id)
    fuelTypes.value = fuelTypes.value.filter((f) => f.id !== id)
  }

  return { fuelTypes, loaded, loading, fetchAll, create, update, remove }
})
