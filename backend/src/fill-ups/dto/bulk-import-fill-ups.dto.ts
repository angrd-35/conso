import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class BulkFillUpItemDto {
  @ApiProperty({ description: 'Nom du type de carburant (créé automatiquement si inconnu)', example: 'Diesel' })
  @IsString()
  @IsNotEmpty()
  fuelTypeName!: string;

  @ApiProperty({ example: '2026-08-15' })
  @IsISO8601()
  date!: string;

  @ApiProperty({ example: 45210 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  odometerKm!: number;

  @ApiProperty({ example: 42.5 })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  quantityLiters!: number;

  @ApiProperty({ description: 'Prix au litre (€)', example: 1.879 })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  pricePerLiter!: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  fullTank?: boolean = true;

  @ApiPropertyOptional({ example: 120 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  remainingRangeKm?: number;

  @ApiPropertyOptional({ example: 'Total Energies' })
  @IsOptional()
  @IsString()
  station?: string;
}

export class BulkImportFillUpsDto {
  @ApiProperty({ type: [BulkFillUpItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BulkFillUpItemDto)
  items!: BulkFillUpItemDto[];
}
