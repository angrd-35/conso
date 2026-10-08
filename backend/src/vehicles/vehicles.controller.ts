import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CreateVehicleDto } from './dto/create-vehicle.dto.js';
import { UpdateVehicleDto } from './dto/update-vehicle.dto.js';
import { VehiclesService } from './vehicles.service.js';

const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;

@ApiTags('vehicles')
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  @ApiQuery({ name: 'archived', required: false, description: 'true pour lister les véhicules archivés' })
  findAll(@Query('archived') archived?: string) {
    return this.vehiclesService.findAll(archived === 'true');
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vehiclesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateVehicleDto) {
    return this.vehiclesService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateVehicleDto) {
    return this.vehiclesService.update(id, dto);
  }

  @Post(':id/archive')
  archive(@Param('id') id: string) {
    return this.vehiclesService.archive(id);
  }

  @Delete(':id/archive')
  unarchive(@Param('id') id: string) {
    return this.vehiclesService.unarchive(id);
  }

  @Post(':id/photo')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('photo', { limits: { fileSize: MAX_PHOTO_SIZE_BYTES } }))
  setPhoto(@Param('id') id: string, @UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Aucune photo fournie');
    }
    return this.vehiclesService.setPhoto(id, file);
  }

  @Delete(':id/photo')
  removePhoto(@Param('id') id: string) {
    return this.vehiclesService.removePhoto(id);
  }
}
