import { Injectable, OnModuleInit } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';

const SYMBOLS = ['AAPL', 'TSLA', 'BTC', 'ETH'];
const MARKET_UPDATE_CHANNEL = 'MARKET_UPDATE';
const PRICE_CACHE_PREFIX = 'market:price:';
const PRICE_CACHE_TTL = 60;

// Base prices for simulation (approximate)
const BASE_PRICES: Record<string, number> = {
  AAPL: 180,
  TSLA: 250,
  BTC: 45000,
  ETH: 2500,
};

@Injectable()
export class MarketService implements OnModuleInit {
  private prices: Map<string, number> = new Map();
  private intervalId?: ReturnType<typeof setInterval>;

  constructor(private readonly redis: RedisService) {
    SYMBOLS.forEach((s) => this.prices.set(s, BASE_PRICES[s] ?? 100));
  }

  onModuleInit() {
    this.tick();
    this.intervalId = setInterval(() => this.tick(), 1000);
  }

  private tick() {
    const updates: { symbol: string; price: number }[] = [];
    for (const symbol of SYMBOLS) {
      const current = this.prices.get(symbol) ?? 100;
      const change = (Math.random() - 0.5) * current * 0.002;
      const next = Math.max(1, current + change);
      this.prices.set(symbol, next);
      updates.push({ symbol, price: next });
      this.redis.set(PRICE_CACHE_PREFIX + symbol, next.toFixed(2), PRICE_CACHE_TTL);
    }
    const payload = JSON.stringify({ prices: updates, timestamp: new Date().toISOString() });
    this.redis.publish(MARKET_UPDATE_CHANNEL, payload);
  }

  async getPrice(symbol: string): Promise<number | null> {
    const cached = await this.redis.get(PRICE_CACHE_PREFIX + symbol);
    if (cached) return parseFloat(cached);
    const inMemory = this.prices.get(symbol);
    if (inMemory != null) {
      await this.redis.set(PRICE_CACHE_PREFIX + symbol, inMemory.toFixed(2), PRICE_CACHE_TTL);
      return inMemory;
    }
    return null;
  }

  getPrices(): Record<string, number> {
    return Object.fromEntries(this.prices);
  }
}
