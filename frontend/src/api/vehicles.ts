import { apiClient } from './client'
import type { CreateVehicleInput, UpdateVehicleInput, Vehicle } from './types'

export const vehiclesApi = {
  list: (archived = false) =>
    apiClient.get<Vehicle[]>('/vehicles', { params: { archived } }).then((r) => r.data),
  get: (id: string) => apiClient.get<Vehicle>(`/vehicles/${id}`).then((r) => r.data),
  create: (input: CreateVehicleInput) => apiClient.post<Vehicle>('/vehicles', input).then((r) => r.data),
  update: (id: string, input: UpdateVehicleInput) =>
    apiClient.patch<Vehicle>(`/vehicles/${id}`, input).then((r) => r.data),
  archive: (id: string) => apiClient.post<Vehicle>(`/vehicles/${id}/archive`).then((r) => r.data),
  unarchive: (id: string) => apiClient.delete<Vehicle>(`/vehicles/${id}/archive`).then((r) => r.data),
  uploadPhoto: (id: string, file: File) => {
    const formData = new FormData()
    formData.append('photo', file)
    return apiClient
      .post<Vehicle>(`/vehicles/${id}/photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },
  removePhoto: (id: string) => apiClient.delete<Vehicle>(`/vehicles/${id}/photo`).then((r) => r.data),
}
