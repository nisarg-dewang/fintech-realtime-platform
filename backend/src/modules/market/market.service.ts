import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../redis/redis.service';
import axios from 'axios';

const REDIS_KEY_PREFIX = 'market:';
const FINNHUB_STOCK_CANDLE_URL = 'https://finnhub.io/api/v1/stock/candle';
const FINNHUB_CRYPTO_CANDLE_URL = 'https://finnhub.io/api/v1/crypto/candle';
const FINNHUB_QUOTE_URL = 'https://finnhub.io/api/v1/quote';

const CRYPTO_SYMBOL_MAP: Record<string, string> = {
  BTC: 'BINANCE:BTCUSDT',
  ETH: 'BINANCE:ETHUSDT',
};

/** First 10 famous US stocks for dashboard list (Finnhub-supported symbols) */
const FEATURED_SYMBOLS: { symbol: string; description: string }[] = [
  { symbol: 'AAPL', description: 'Apple Inc.' },
  { symbol: 'MSFT', description: 'Microsoft Corp.' },
  { symbol: 'GOOGL', description: 'Alphabet (Google)' },
  { symbol: 'AMZN', description: 'Amazon.com Inc.' },
  { symbol: 'NVDA', description: 'NVIDIA Corp.' },
  { symbol: 'TSLA', description: 'Tesla Inc.' },
  { symbol: 'META', description: 'Meta Platforms' },
  { symbol: 'JPM', description: 'JPMorgan Chase' },
  { symbol: 'V', description: 'Visa Inc.' },
  { symbol: 'JNJ', description: 'Johnson & Johnson' },
];

export interface CandlePoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

@Injectable()
export class MarketService {
  private readonly logger = new Logger(MarketService.name);

  constructor(
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {}

  async getLatestPrice(symbol: string): Promise<{ symbol: string; price: number; timestamp: number } | null> {
    const key = `${REDIS_KEY_PREFIX}${symbol.toUpperCase()}`;
    const cached = await this.redis.get(key);
    if (!cached) return null;
    try {
      return JSON.parse(cached) as { symbol: string; price: number; timestamp: number };
    } catch {
      return null;
    }
  }

  /** Returns current price for a symbol (used by portfolio buy/sell). */
  async getPrice(symbol: string): Promise<number | null> {
    const data = await this.getLatestPrice(symbol);
    return data?.price ?? null;
  }

  /** List of 10 featured stocks with current price (from Redis or Finnhub quote). */
  async getFeaturedList(): Promise<{ symbol: string; description: string; price: number | null }[]> {
    const apiKey = this.config.get<string>('FINNHUB_API_KEY', '');
    const result: { symbol: string; description: string; price: number | null }[] = [];
    for (const { symbol, description } of FEATURED_SYMBOLS) {
      const cached = await this.getLatestPrice(symbol);
      let price: number | null = cached?.price ?? null;
      if (price == null && apiKey) {
        try {
          const { data } = await axios.get<{ c?: number }>(FINNHUB_QUOTE_URL, {
            params: { symbol, token: apiKey },
            timeout: 5_000,
          });
          if (typeof data?.c === 'number' && data.c > 0) price = data.c;
        } catch {
          // keep null
        }
      }
      result.push({ symbol, description, price });
    }
    return result;
  }

  async getHistory(
    symbol: string,
    from: number,
    to: number,
    resolution: number | 'D' = 5,
  ): Promise<CandlePoint[]> {
    const apiKey = this.config.get<string>('FINNHUB_API_KEY', '');
    if (!apiKey) {
      this.logger.warn('getHistory: FINNHUB_API_KEY not set');
      return [];
    }
    const upper = symbol.toUpperCase();
    const isCrypto = upper in CRYPTO_SYMBOL_MAP;
    const finnhubSymbol = isCrypto ? CRYPTO_SYMBOL_MAP[upper]! : upper;
    const url = isCrypto ? FINNHUB_CRYPTO_CANDLE_URL : FINNHUB_STOCK_CANDLE_URL;
    const parse = (data: { s?: string; t?: number[]; o?: number[]; h?: number[]; l?: number[]; c?: number[] }) => {
      if (data.s !== 'ok' || !data.t?.length) return [];
      const result: CandlePoint[] = [];
      for (let i = 0; i < data.t.length; i++) {
        result.push({
          time: data.t[i]!,
          open: data.o?.[i] ?? 0,
          high: data.h?.[i] ?? 0,
          low: data.l?.[i] ?? 0,
          close: data.c?.[i] ?? 0,
        });
      }
      return result;
    };
    const fetchCandles = async (f: number, t: number, res: number | string) => {
      const { data } = await axios.get<{ s: string; t?: number[]; o?: number[]; h?: number[]; l?: number[]; c?: number[] }>(url, {
        params: { symbol: finnhubSymbol, resolution: res, from: f, to: t, token: apiKey },
        timeout: 15_000,
      });
      this.logger.debug(`Finnhub candle ${upper} resolution=${res}: s=${data.s} count=${data.t?.length ?? 0}`);
      return parse(data);
    };
    try {
      let result = await fetchCandles(from, to, resolution);
      if (result.length === 0 && !isCrypto && resolution !== 'D') {
        result = await fetchCandles(from, to, 'D');
      }
      if (result.length === 0 && !isCrypto) {
        const now = Math.floor(Date.now() / 1000);
        const fallbackTo = now - 86400;
        const fallbackFrom = fallbackTo - 30 * 86400;
        this.logger.log(`History empty for ${upper} (from=${from} to=${to}), trying 30-day fallback ending yesterday`);
        result = await fetchCandles(fallbackFrom, fallbackTo, 5);
        if (result.length === 0) result = await fetchCandles(fallbackFrom, fallbackTo, 'D');
      }
      return result;
    } catch (err) {
      this.logger.warn(`Finnhub history failed for ${upper}`, err instanceof Error ? err.message : err);
      return [];
    }
  }
}
