import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { StatsService } from './stats.service.js';

@ApiTags('stats')
@Controller('vehicles/:vehicleId/stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get()
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getStats(@Param('vehicleId') vehicleId: string, @Query('from') from?: string, @Query('to') to?: string) {
    return this.statsService.getVehicleStats(vehicleId, from, to);
  }
}
