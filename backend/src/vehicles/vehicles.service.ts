import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateVehicleDto } from './dto/create-vehicle.dto.js';
import { UpdateVehicleDto } from './dto/update-vehicle.dto.js';
import { getUploadsDir, PHOTO_MIME_EXTENSIONS } from './uploads.util.js';

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(archived = false) {
    const vehicles = await this.prisma.vehicle.findMany({
      where: { archived },
      orderBy: { createdAt: 'asc' },
      include: { defaultFuel: true },
    });
    return vehicles.map(withPhotoUrl);
  }

  async findOne(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: { defaultFuel: true },
    });
    if (!vehicle) {
      throw new NotFoundException(`Véhicule ${id} introuvable`);
    }
    return withPhotoUrl(vehicle);
  }

  async create(dto: CreateVehicleDto) {
    try {
      const vehicle = await this.prisma.vehicle.create({ data: dto });
      return withPhotoUrl(vehicle);
    } catch (error) {
      throw this.mapKnownError(error);
    }
  }

  async update(id: string, dto: UpdateVehicleDto) {
    await this.findOne(id);
    try {
      const vehicle = await this.prisma.vehicle.update({ where: { id }, data: dto });
      return withPhotoUrl(vehicle);
    } catch (error) {
      throw this.mapKnownError(error);
    }
  }

  async archive(id: string) {
    await this.findOne(id);
    const vehicle = await this.prisma.vehicle.update({ where: { id }, data: { archived: true } });
    return withPhotoUrl(vehicle);
  }

  async unarchive(id: string) {
    await this.findOne(id);
    const vehicle = await this.prisma.vehicle.update({ where: { id }, data: { archived: false } });
    return withPhotoUrl(vehicle);
  }

  async setPhoto(id: string, file: Express.Multer.File) {
    const vehicle = await this.findOne(id);
    const extension = PHOTO_MIME_EXTENSIONS[file.mimetype];
    if (!extension) {
      throw new BadRequestException('Format d\'image non supporté (jpeg, png ou webp uniquement)');
    }

    await this.deletePhotoFile(vehicle.photoFilename);

    const filename = `${id}-${Date.now()}.${extension}`;
    await writeFile(join(getUploadsDir(), filename), file.buffer);

    const updated = await this.prisma.vehicle.update({ where: { id }, data: { photoFilename: filename } });
    return withPhotoUrl(updated);
  }

  async removePhoto(id: string) {
    const vehicle = await this.findOne(id);
    await this.deletePhotoFile(vehicle.photoFilename);
    const updated = await this.prisma.vehicle.update({ where: { id }, data: { photoFilename: null } });
    return withPhotoUrl(updated);
  }

  private async deletePhotoFile(photoFilename: string | null) {
    if (!photoFilename) return;
    try {
      await unlink(join(getUploadsDir(), photoFilename));
    } catch {
      // File already missing: nothing to clean up
    }
  }

  private mapKnownError(error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      return new BadRequestException('Le type de carburant par défaut indiqué est introuvable');
    }
    return error;
  }
}

function withPhotoUrl<T extends { photoFilename: string | null }>(vehicle: T) {
  return {
    ...vehicle,
    photoUrl: vehicle.photoFilename ? `/api/uploads/${vehicle.photoFilename}` : null,
  };
}
