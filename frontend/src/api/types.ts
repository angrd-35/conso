export interface FuelType {
  id: string
  name: string
  ethanolRate: number | null
}

export interface Vehicle {
  id: string
  name: string
  brand: string | null
  model: string | null
  photoFilename: string | null
  photoUrl: string | null
  archived: boolean
  defaultFuelId: string | null
  defaultFuel: FuelType | null
  createdAt: string
  updatedAt: string
}

export interface FillUpComponent {
  id: string
  fillUpId: string
  fuelTypeId: string
  fuelType: FuelType
  quantityLiters: number
  pricePerLiter: number
}

export interface FillUp {
  id: string
  vehicleId: string
  date: string
  odometerKm: number
  station: string | null
  fullTank: boolean
  remainingRangeKm: number | null
  createdAt: string
  components: FillUpComponent[]
  totalLiters: number
  totalPrice: number
}

export interface CreateVehicleInput {
  name: string
  brand?: string
  model?: string
  defaultFuelId?: string
}

export type UpdateVehicleInput = Partial<CreateVehicleInput>

export interface CreateFuelTypeInput {
  name: string
  ethanolRate?: number
}

export interface FillUpComponentInput {
  fuelTypeId: string
  quantityLiters: number
  pricePerLiter: number
}

export interface CreateFillUpInput {
  date: string
  odometerKm: number
  components: FillUpComponentInput[]
  station?: string
  fullTank: boolean
  remainingRangeKm?: number
}

export type UpdateFillUpInput = Partial<CreateFillUpInput>

export interface BulkFillUpItem {
  fuelTypeName: string
  date: string
  odometerKm: number
  quantityLiters: number
  pricePerLiter: number
  fullTank: boolean
  remainingRangeKm?: number
  station?: string
}

export interface BulkImportResult {
  imported: number
}

export interface ConsumptionPoint {
  date: string
  odometerKm: number
  deltaKm: number
  litersUsed: number
  cost: number
  consumptionL100: number
  costPerKm: number
  ethanolRate: number | null
}

export interface VehicleStats {
  fillUpsCount: number
  totalCost: number
  totalLiters: number
  totalKm: number
  costPerKm: number | null
  avgConsumptionL100: number | null
  history: ConsumptionPoint[]
}
