import { defineStore } from 'pinia'
import { ref } from 'vue'
import { vehiclesApi } from '../api/vehicles'
import type { CreateVehicleInput, UpdateVehicleInput, Vehicle } from '../api/types'

export const useVehiclesStore = defineStore('vehicles', () => {
  const vehicles = ref<Vehicle[]>([])
  const archivedVehicles = ref<Vehicle[]>([])
  const loaded = ref(false)
  const archivedLoaded = ref(false)
  const loading = ref(false)
  const archivedLoading = ref(false)

  async function fetchAll(force = false) {
    if (loaded.value && !force) return
    loading.value = true
    try {
      vehicles.value = await vehiclesApi.list(false)
      loaded.value = true
    } finally {
      loading.value = false
    }
  }

  async function fetchArchived(force = false) {
    if (archivedLoaded.value && !force) return
    archivedLoading.value = true
    try {
      archivedVehicles.value = await vehiclesApi.list(true)
      archivedLoaded.value = true
    } finally {
      archivedLoading.value = false
    }
  }

  async function create(input: CreateVehicleInput) {
    const vehicle = await vehiclesApi.create(input)
    vehicles.value.push(vehicle)
    return vehicle
  }

  async function update(id: string, input: UpdateVehicleInput) {
    const vehicle = await vehiclesApi.update(id, input)
    const index = vehicles.value.findIndex((v) => v.id === id)
    if (index !== -1) vehicles.value[index] = vehicle
    return vehicle
  }

  async function archive(id: string) {
    const vehicle = await vehiclesApi.archive(id)
    vehicles.value = vehicles.value.filter((v) => v.id !== id)
    archivedVehicles.value.push(vehicle)
    return vehicle
  }

  async function unarchive(id: string) {
    const vehicle = await vehiclesApi.unarchive(id)
    archivedVehicles.value = archivedVehicles.value.filter((v) => v.id !== id)
    vehicles.value.push(vehicle)
    return vehicle
  }

  function getById(id: string) {
    return vehicles.value.find((v) => v.id === id) ?? archivedVehicles.value.find((v) => v.id === id)
  }

  return {
    vehicles,
    archivedVehicles,
    loaded,
    archivedLoaded,
    loading,
    archivedLoading,
    fetchAll,
    fetchArchived,
    create,
    update,
    archive,
    unarchive,
    getById,
  }
})
