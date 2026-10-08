import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class FillUpComponentDto {
  @ApiProperty({ description: 'Id du type de carburant' })
  @IsString()
  @IsNotEmpty()
  fuelTypeId!: string;

  @ApiProperty({ example: 20 })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  quantityLiters!: number;

  @ApiProperty({ description: 'Prix au litre (€)', example: 1.879 })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  pricePerLiter!: number;
}
