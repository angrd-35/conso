import { PartialType } from '@nestjs/swagger';
import { CreateFillUpDto } from './create-fill-up.dto.js';

export class UpdateFillUpDto extends PartialType(CreateFillUpDto) {}
