import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MarketService } from './market.service';
import { RedisService } from '../../redis/redis.service';

const PRICE_CACHE_PREFIX = 'market:price:';

@ApiTags('market')
@Controller('market')
export class MarketController {
  constructor(
    private readonly marketService: MarketService,
    private readonly redis: RedisService,
  ) {}

  @Get(':symbol')
  @ApiOperation({ summary: 'Get latest price from Redis cache' })
  async getPrice(@Param('symbol') symbol: string) {
    const cached = await this.redis.get(PRICE_CACHE_PREFIX + symbol.toUpperCase());
    if (cached) {
      return { symbol: symbol.toUpperCase(), price: parseFloat(cached), source: 'redis' };
    }
    const price = await this.marketService.getPrice(symbol.toUpperCase());
    if (price == null) return { symbol: symbol.toUpperCase(), error: 'Unknown symbol' };
    return { symbol: symbol.toUpperCase(), price, source: 'memory' };
  }
}
