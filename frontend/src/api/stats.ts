import { apiClient } from './client'
import type { VehicleStats } from './types'

export const statsApi = {
  get: (vehicleId: string, range: { from?: string; to?: string } = {}) =>
    apiClient.get<VehicleStats>(`/vehicles/${vehicleId}/stats`, { params: range }).then((r) => r.data),
}
