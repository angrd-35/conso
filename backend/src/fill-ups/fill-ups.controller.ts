import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BulkImportFillUpsDto } from './dto/bulk-import-fill-ups.dto.js';
import { CreateFillUpDto } from './dto/create-fill-up.dto.js';
import { UpdateFillUpDto } from './dto/update-fill-up.dto.js';
import { FillUpsService } from './fill-ups.service.js';

@ApiTags('fill-ups')
@Controller('vehicles/:vehicleId/fillups')
export class FillUpsController {
  constructor(private readonly fillUpsService: FillUpsService) {}

  @Get()
  findAll(@Param('vehicleId') vehicleId: string) {
    return this.fillUpsService.findAllForVehicle(vehicleId);
  }

  @Get(':id')
  findOne(@Param('vehicleId') vehicleId: string, @Param('id') id: string) {
    return this.fillUpsService.findOne(vehicleId, id);
  }

  @Post()
  create(@Param('vehicleId') vehicleId: string, @Body() dto: CreateFillUpDto) {
    return this.fillUpsService.create(vehicleId, dto);
  }

  @Post('bulk')
  bulkImport(@Param('vehicleId') vehicleId: string, @Body() dto: BulkImportFillUpsDto) {
    return this.fillUpsService.bulkImport(vehicleId, dto);
  }

  @Patch(':id')
  update(@Param('vehicleId') vehicleId: string, @Param('id') id: string, @Body() dto: UpdateFillUpDto) {
    return this.fillUpsService.update(vehicleId, id, dto);
  }

  @Delete(':id')
  remove(@Param('vehicleId') vehicleId: string, @Param('id') id: string) {
    return this.fillUpsService.remove(vehicleId, id);
  }
}
