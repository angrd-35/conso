import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { VehiclesService } from '../vehicles/vehicles.service.js';

interface ConsumptionPoint {
  date: string;
  odometerKm: number;
  deltaKm: number;
  litersUsed: number;
  cost: number;
  consumptionL100: number;
  costPerKm: number;
}

@Injectable()
export class StatsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vehiclesService: VehiclesService,
  ) {}

  async getVehicleStats(vehicleId: string, from?: string, to?: string) {
    await this.vehiclesService.findOne(vehicleId);

    const rawFillUps = await this.prisma.fillUp.findMany({
      where: {
        vehicleId,
        date: {
          gte: from ? new Date(from) : undefined,
          lte: to ? new Date(to) : undefined,
        },
      },
      include: { components: true },
      orderBy: [{ date: 'asc' }, { odometerKm: 'asc' }],
    });

    const fillUps = rawFillUps.map((f) => ({
      ...f,
      quantityLiters: f.components.reduce((sum, c) => sum + c.quantityLiters, 0),
      totalPrice: f.components.reduce((sum, c) => sum + c.quantityLiters * c.pricePerLiter, 0),
    }));

    const history: ConsumptionPoint[] = [];
    let litersAccum = 0;
    let costAccum = 0;
    let lastFull: { date: Date; odometerKm: number } | null = null;

    for (const fillUp of fillUps) {
      litersAccum += fillUp.quantityLiters;
      costAccum += fillUp.totalPrice;

      if (fillUp.fullTank) {
        if (lastFull) {
          const deltaKm = fillUp.odometerKm - lastFull.odometerKm;
          if (deltaKm > 0) {
            history.push({
              date: fillUp.date.toISOString(),
              odometerKm: fillUp.odometerKm,
              deltaKm,
              litersUsed: round(litersAccum),
              cost: round(costAccum),
              consumptionL100: round((litersAccum / deltaKm) * 100),
              costPerKm: round(costAccum / deltaKm),
            });
          }
        }
        lastFull = { date: fillUp.date, odometerKm: fillUp.odometerKm };
        litersAccum = 0;
        costAccum = 0;
      }
    }

    const totalCost = fillUps.reduce((sum, f) => sum + f.totalPrice, 0);
    const totalLiters = fillUps.reduce((sum, f) => sum + f.quantityLiters, 0);
    const totalKm =
      fillUps.length >= 2 ? fillUps[fillUps.length - 1].odometerKm - fillUps[0].odometerKm : 0;
    const segmentKm = history.reduce((sum, p) => sum + p.deltaKm, 0);
    const segmentLiters = history.reduce((sum, p) => sum + p.litersUsed, 0);

    return {
      fillUpsCount: fillUps.length,
      totalCost: round(totalCost),
      totalLiters: round(totalLiters),
      totalKm: round(totalKm),
      costPerKm: totalKm > 0 ? round(totalCost / totalKm) : null,
      avgConsumptionL100: segmentKm > 0 ? round((segmentLiters / segmentKm) * 100) : null,
      history,
    };
  }
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}
