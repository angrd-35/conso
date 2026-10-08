import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { FillUpComponentDto } from './fill-up-component.dto.js';

export class CreateFillUpDto {
  @ApiProperty({ example: '2026-08-15' })
  @IsISO8601()
  date!: string;

  @ApiProperty({ example: 45210 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  odometerKm!: number;

  @ApiProperty({ type: [FillUpComponentDto], description: 'Un ou plusieurs carburants composant ce plein' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => FillUpComponentDto)
  components!: FillUpComponentDto[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  fullTank?: boolean = true;

  @ApiPropertyOptional({ description: 'Kilomètres restants affichés sur la jauge', example: 120 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  remainingRangeKm?: number;

  @ApiPropertyOptional({ description: 'Enseigne où le plein a été fait', example: 'Total Energies' })
  @IsOptional()
  @IsString()
  station?: string;
}
