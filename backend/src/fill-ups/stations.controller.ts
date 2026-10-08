import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FillUpsService } from './fill-ups.service.js';

@ApiTags('stations')
@Controller('stations')
export class StationsController {
  constructor(private readonly fillUpsService: FillUpsService) {}

  @Get()
  findAll() {
    return this.fillUpsService.listStations();
  }
}
