import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { MarketService } from './market.service';

@ApiTags('market')
@Controller('market')
export class MarketController {
  constructor(private readonly marketService: MarketService) {}

  @Get('list')
  @ApiOperation({ summary: 'Get list of 10 featured stocks with current price (from Finnhub)' })
  @ApiResponse({
    status: 200,
    description: 'Array of { symbol, description, price }',
    schema: {
      type: 'array',
      items: { type: 'object', properties: { symbol: {}, description: {}, price: { type: 'number', nullable: true } } },
    },
  })
  getList() {
    return this.marketService.getFeaturedList();
  }

  @Get(':symbol/history')
  @ApiOperation({ summary: 'Get historical candle data (Finnhub). Use resolution=D for daily bars (e.g. 7-day chart).' })
  @ApiParam({ name: 'symbol', description: 'Symbol (e.g. AAPL, TSLA)' })
  @ApiQuery({ name: 'from', description: 'Start time (Unix timestamp)', required: true })
  @ApiQuery({ name: 'to', description: 'End time (Unix timestamp)', required: true })
  @ApiQuery({ name: 'resolution', description: '5 = 5-min, D = daily', required: false })
  @ApiResponse({
    status: 200,
    description: 'Array of candles with time, open, high, low, close',
    schema: {
      type: 'array',
      items: { type: 'object', properties: { time: { type: 'number' }, open: {}, high: {}, low: {}, close: {} } },
    },
  })
  async getHistory(
    @Param('symbol') symbol: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('resolution') resolution?: string,
  ) {
    const fromNum = parseInt(from, 10);
    const toNum = parseInt(to, 10);
    if (Number.isNaN(fromNum) || Number.isNaN(toNum)) {
      return { error: 'from and to must be valid Unix timestamps' };
    }
    const res = resolution === 'D' ? 'D' : 5;
    return this.marketService.getHistory(symbol.toUpperCase(), fromNum, toNum, res);
  }

  @Get(':symbol')
  @ApiOperation({ summary: 'Get latest price from Redis cache' })
  @ApiParam({ name: 'symbol', description: 'Symbol (e.g. AAPL, TSLA, BTC, ETH)' })
  @ApiResponse({
    status: 200,
    description: 'Latest price with symbol, price, and timestamp; or error if no data in cache',
  })
  async getPrice(@Param('symbol') symbol: string) {
    const data = await this.marketService.getLatestPrice(symbol.toUpperCase());
    if (!data) {
      return { symbol: symbol.toUpperCase(), error: 'No data in cache' };
    }
    return data;
  }
}
