import { Module } from '@nestjs/common';
import { VehiclesModule } from '../vehicles/vehicles.module.js';
import { FillUpsController } from './fill-ups.controller.js';
import { FillUpsService } from './fill-ups.service.js';
import { StationsController } from './stations.controller.js';

@Module({
  imports: [VehiclesModule],
  controllers: [FillUpsController, StationsController],
  providers: [FillUpsService],
})
export class FillUpsModule {}
