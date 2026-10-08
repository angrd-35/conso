import { apiClient } from './client'
import type { BulkFillUpItem, BulkImportResult, CreateFillUpInput, FillUp, UpdateFillUpInput } from './types'

export const fillUpsApi = {
  list: (vehicleId: string) => apiClient.get<FillUp[]>(`/vehicles/${vehicleId}/fillups`).then((r) => r.data),
  get: (vehicleId: string, id: string) =>
    apiClient.get<FillUp>(`/vehicles/${vehicleId}/fillups/${id}`).then((r) => r.data),
  create: (vehicleId: string, input: CreateFillUpInput) =>
    apiClient.post<FillUp>(`/vehicles/${vehicleId}/fillups`, input).then((r) => r.data),
  update: (vehicleId: string, id: string, input: UpdateFillUpInput) =>
    apiClient.patch<FillUp>(`/vehicles/${vehicleId}/fillups/${id}`, input).then((r) => r.data),
  remove: (vehicleId: string, id: string) =>
    apiClient.delete(`/vehicles/${vehicleId}/fillups/${id}`).then(() => undefined),
  bulkImport: (vehicleId: string, items: BulkFillUpItem[]) =>
    apiClient.post<BulkImportResult>(`/vehicles/${vehicleId}/fillups/bulk`, { items }).then((r) => r.data),
  listStations: () => apiClient.get<string[]>('/stations').then((r) => r.data),
}
