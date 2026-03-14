import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class BuyDto {
  @ApiProperty({ example: 'AAPL' })
  @IsString()
  symbol: string;

  @ApiProperty({ example: 10, minimum: 0.01 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  quantity: number;
}
