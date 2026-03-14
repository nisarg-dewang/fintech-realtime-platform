import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SellDto {
  @ApiProperty({ example: 'AAPL' })
  @IsString()
  symbol: string;

  @ApiProperty({ example: 5, minimum: 0.01 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  quantity: number;
}
