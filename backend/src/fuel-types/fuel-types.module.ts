import { Module } from '@nestjs/common';
import { FuelTypesController } from './fuel-types.controller.js';
import { FuelTypesService } from './fuel-types.service.js';

@Module({
  controllers: [FuelTypesController],
  providers: [FuelTypesService],
  exports: [FuelTypesService],
})
export class FuelTypesModule {}
