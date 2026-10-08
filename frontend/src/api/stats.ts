import { apiClient } from './client'
import type { VehicleStats } from './types'

export const statsApi = {
  get: (vehicleId: string) => apiClient.get<VehicleStats>(`/vehicles/${vehicleId}/stats`).then((r) => r.data),
}
