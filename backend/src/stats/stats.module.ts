import { Module } from '@nestjs/common';
import { VehiclesModule } from '../vehicles/vehicles.module.js';
import { StatsController } from './stats.controller.js';
import { StatsService } from './stats.service.js';

@Module({
  imports: [VehiclesModule],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
