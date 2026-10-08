import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { VehiclesService } from '../vehicles/vehicles.service.js';
import { BulkImportFillUpsDto } from './dto/bulk-import-fill-ups.dto.js';
import { CreateFillUpDto } from './dto/create-fill-up.dto.js';
import { UpdateFillUpDto } from './dto/update-fill-up.dto.js';

const FILL_UP_INCLUDE = { components: { include: { fuelType: true } } } as const;

@Injectable()
export class FillUpsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vehiclesService: VehiclesService,
  ) {}

  async findAllForVehicle(vehicleId: string) {
    await this.vehiclesService.findOne(vehicleId);
    const fillUps = await this.prisma.fillUp.findMany({
      where: { vehicleId },
      include: FILL_UP_INCLUDE,
      orderBy: [{ date: 'asc' }, { odometerKm: 'asc' }],
    });
    return fillUps.map(withTotals);
  }

  async findOne(vehicleId: string, id: string) {
    const fillUp = await this.prisma.fillUp.findFirst({
      where: { id, vehicleId },
      include: FILL_UP_INCLUDE,
    });
    if (!fillUp) {
      throw new NotFoundException(`Plein ${id} introuvable pour ce véhicule`);
    }
    return withTotals(fillUp);
  }

  async create(vehicleId: string, dto: CreateFillUpDto) {
    await this.vehiclesService.findOne(vehicleId);
    await this.assertFuelTypesExist(dto.components.map((c) => c.fuelTypeId));
    await this.assertOdometerProgression(vehicleId, null, new Date(dto.date), dto.odometerKm);
    const fillUp = await this.prisma.fillUp.create({
      data: {
        vehicleId,
        date: new Date(dto.date),
        odometerKm: dto.odometerKm,
        station: dto.station,
        fullTank: dto.fullTank ?? true,
        remainingRangeKm: dto.remainingRangeKm,
        components: { create: dto.components },
      },
      include: FILL_UP_INCLUDE,
    });
    return withTotals(fillUp);
  }

  async update(vehicleId: string, id: string, dto: UpdateFillUpDto) {
    const existing = await this.findOne(vehicleId, id);
    if (dto.components) {
      await this.assertFuelTypesExist(dto.components.map((c) => c.fuelTypeId));
    }
    if (dto.date !== undefined || dto.odometerKm !== undefined) {
      const effectiveDate = dto.date ? new Date(dto.date) : existing.date;
      const effectiveOdometerKm = dto.odometerKm ?? existing.odometerKm;
      await this.assertOdometerProgression(vehicleId, id, effectiveDate, effectiveOdometerKm);
    }

    const fillUp = await this.prisma.fillUp.update({
      where: { id },
      data: {
        date: dto.date ? new Date(dto.date) : undefined,
        odometerKm: dto.odometerKm,
        station: dto.station,
        fullTank: dto.fullTank,
        remainingRangeKm: dto.remainingRangeKm,
        components: dto.components
          ? { deleteMany: {}, create: dto.components }
          : undefined,
      },
      include: FILL_UP_INCLUDE,
    });
    return withTotals(fillUp);
  }

  async remove(vehicleId: string, id: string) {
    await this.findOne(vehicleId, id);
    await this.prisma.fillUp.delete({ where: { id } });
  }

  async bulkImport(vehicleId: string, dto: BulkImportFillUpsDto) {
    await this.vehiclesService.findOne(vehicleId);

    return this.prisma.$transaction(async (tx) => {
      let imported = 0;
      const fuelTypeCache = new Map<string, string>();

      for (const item of dto.items) {
        const key = item.fuelTypeName.trim().toLowerCase();
        let fuelTypeId = fuelTypeCache.get(key);
        if (!fuelTypeId) {
          const fuelType = await tx.fuelType.upsert({
            where: { name: item.fuelTypeName.trim() },
            update: {},
            create: { name: item.fuelTypeName.trim() },
          });
          fuelTypeId = fuelType.id;
          fuelTypeCache.set(key, fuelTypeId);
        }

        await tx.fillUp.create({
          data: {
            vehicleId,
            date: new Date(item.date),
            station: item.station,
            fullTank: item.fullTank ?? true,
            remainingRangeKm: item.remainingRangeKm,
            odometerKm: item.odometerKm,
            components: {
              create: [
                {
                  fuelTypeId,
                  quantityLiters: item.quantityLiters,
                  pricePerLiter: item.totalPrice / item.quantityLiters,
                },
              ],
            },
          },
        });
        imported += 1;
      }

      return { imported };
    });
  }

  private async assertFuelTypesExist(fuelTypeIds: string[]) {
    const uniqueIds = [...new Set(fuelTypeIds)];
    const count = await this.prisma.fuelType.count({ where: { id: { in: uniqueIds } } });
    if (count !== uniqueIds.length) {
      throw new NotFoundException('Un des types de carburant indiqués est introuvable');
    }
  }

  private async assertOdometerProgression(
    vehicleId: string,
    excludeId: string | null,
    date: Date,
    odometerKm: number,
  ) {
    const previous = await this.prisma.fillUp.findFirst({
      where: {
        vehicleId,
        date: { lte: date },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      orderBy: [{ date: 'desc' }, { odometerKm: 'desc' }],
    });

    if (previous && odometerKm <= previous.odometerKm) {
      throw new BadRequestException(
        `Le kilométrage (${odometerKm} km) doit être supérieur à celui du plein précédent du ${previous.date.toLocaleDateString('fr-FR')} (${previous.odometerKm} km)`,
      );
    }
  }

  async listStations() {
    const rows = await this.prisma.fillUp.findMany({
      where: { station: { not: null } },
      select: { station: true },
      distinct: ['station'],
      orderBy: { station: 'asc' },
    });
    return rows.map((r) => r.station as string);
  }
}

function withTotals<T extends { components: { quantityLiters: number; pricePerLiter: number }[] }>(fillUp: T) {
  return {
    ...fillUp,
    totalLiters: round(fillUp.components.reduce((sum, c) => sum + c.quantityLiters, 0)),
    totalPrice: round(fillUp.components.reduce((sum, c) => sum + c.quantityLiters * c.pricePerLiter, 0)),
  };
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}
