import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateFuelTypeDto } from './dto/create-fuel-type.dto.js';
import { UpdateFuelTypeDto } from './dto/update-fuel-type.dto.js';
import { FuelTypesService } from './fuel-types.service.js';

@ApiTags('fuel-types')
@Controller('fuel-types')
export class FuelTypesController {
  constructor(private readonly fuelTypesService: FuelTypesService) {}

  @Get()
  findAll() {
    return this.fuelTypesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.fuelTypesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateFuelTypeDto) {
    return this.fuelTypesService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateFuelTypeDto) {
    return this.fuelTypesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.fuelTypesService.remove(id);
  }
}
