import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateFuelTypeDto } from './dto/create-fuel-type.dto.js';
import { UpdateFuelTypeDto } from './dto/update-fuel-type.dto.js';

@Injectable()
export class FuelTypesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.fuelType.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: string) {
    const fuelType = await this.prisma.fuelType.findUnique({ where: { id } });
    if (!fuelType) {
      throw new NotFoundException(`Type de carburant ${id} introuvable`);
    }
    return fuelType;
  }

  async create(dto: CreateFuelTypeDto) {
    try {
      return await this.prisma.fuelType.create({ data: dto });
    } catch (error) {
      throw this.mapKnownError(error);
    }
  }

  async update(id: string, dto: UpdateFuelTypeDto) {
    await this.findOne(id);
    try {
      return await this.prisma.fuelType.update({ where: { id }, data: dto });
    } catch (error) {
      throw this.mapKnownError(error);
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    try {
      await this.prisma.fuelType.delete({ where: { id } });
    } catch (error) {
      throw this.mapKnownError(error);
    }
  }

  private mapKnownError(error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return new ConflictException('Un type de carburant avec ce nom existe déjà');
      }
      if (error.code === 'P2003') {
        return new ConflictException(
          'Ce type de carburant est utilisé par des véhicules ou des pleins et ne peut pas être supprimé',
        );
      }
    }
    return error;
  }
}
