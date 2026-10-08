import { apiClient } from './client'
import type { CreateFuelTypeInput, FuelType } from './types'

export const fuelTypesApi = {
  list: () => apiClient.get<FuelType[]>('/fuel-types').then((r) => r.data),
  create: (input: CreateFuelTypeInput) => apiClient.post<FuelType>('/fuel-types', input).then((r) => r.data),
  update: (id: string, input: CreateFuelTypeInput) =>
    apiClient.patch<FuelType>(`/fuel-types/${id}`, input).then((r) => r.data),
  remove: (id: string) => apiClient.delete(`/fuel-types/${id}`).then(() => undefined),
}
