import { PartialType } from '@nestjs/swagger';
import { CreateFuelTypeDto } from './create-fuel-type.dto.js';

export class UpdateFuelTypeDto extends PartialType(CreateFuelTypeDto) {}
