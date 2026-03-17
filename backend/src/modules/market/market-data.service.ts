import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../redis/redis.service';
import { RedisPubSubService } from '../../redis/redis-pubsub.service';
import axios from 'axios';
import type { WebSocket as WsInstance } from 'ws';
// Use require so the constructor is available in CommonJS (ws has no default export in CJS)
const WsConstructor = require('ws') as new (url: string) => WsInstance;

const FINNHUB_WS_URL = 'wss://ws.finnhub.io';
const FINNHUB_QUOTE_URL = 'https://finnhub.io/api/v1/quote';
const REDIS_KEY_PREFIX = 'market:';
/** Poll quote API every 60s when WebSocket sends no trades (e.g. outside US market hours 9:30–16:00 ET) */
const QUOTE_POLL_INTERVAL_MS = 60_000;

/** Finnhub stock symbols: Apple, Tesla, Microsoft, Google, Amazon, Nvidia */
const SUBSCRIBE_SYMBOLS = ['AAPL', 'TSLA', 'MSFT', 'GOOGL', 'AMZN', 'NVDA'];
const DISPLAY_SYMBOLS = ['AAPL', 'TSLA', 'MSFT', 'GOOGL', 'AMZN', 'NVDA'];

function normalizeSymbol(finnhubSymbol: string): string {
  return finnhubSymbol;
}

@Injectable()
export class MarketDataService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MarketDataService.name);
  private ws: WsInstance | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private quotePollTimer: ReturnType<typeof setInterval> | null = null;
  private readonly apiKey: string;

  constructor(
    private readonly config: ConfigService,
    private readonly redis: RedisService,
    private readonly redisPubSub: RedisPubSubService,
  ) {
    this.apiKey = this.config.get<string>('FINNHUB_API_KEY', '');
  }

  onModuleInit() {
    if (!this.apiKey) {
      this.logger.warn('FINNHUB_API_KEY is not set; Finnhub WebSocket will not connect');
      return;
    }
    this.connect();
    this.startQuotePoll();
  }

  onModuleDestroy() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.quotePollTimer) {
      clearInterval(this.quotePollTimer);
      this.quotePollTimer = null;
    }
    this.disconnect();
  }

  private getWsUrl(): string {
    return `${FINNHUB_WS_URL}?token=${this.apiKey}`;
  }

  private connect() {
    if (this.ws?.readyState === 1) return; // 1 = OPEN
    try {
      this.ws = new WsConstructor(this.getWsUrl());
    } catch (err) {
      this.logger.error('Failed to create Finnhub WebSocket', err);
      this.scheduleReconnect();
      return;
    }

    this.ws.on('open', () => {
      this.logger.log('Finnhub WebSocket connected');
      for (const symbol of SUBSCRIBE_SYMBOLS) {
        this.ws?.send(JSON.stringify({ type: 'subscribe', symbol }));
      }
    });

    this.ws.on('message', (data: Buffer | ArrayBuffer | Buffer[]) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'trade' && Array.isArray(msg.data)) {
          for (const trade of msg.data) {
            this.handleTrade(trade);
          }
        }
      } catch (err) {
        this.logger.debug('Invalid WebSocket message', data?.toString?.());
      }
    });

    this.ws.on('error', (err) => {
      this.logger.error('Finnhub WebSocket error', err);
    });

    this.ws.on('close', () => {
      this.logger.warn('Finnhub WebSocket closed');
      this.ws = null;
      this.scheduleReconnect();
    });
  }

  private publishPrice(symbol: string, price: number, timestamp: number, source: 'ws' | 'quote') {
    if (!DISPLAY_SYMBOLS.includes(symbol) || !Number.isFinite(price) || price <= 0) return;
    const payload = { symbol, price, timestamp };
    const key = `${REDIS_KEY_PREFIX}${symbol}`;
    const value = JSON.stringify(payload);
    this.redis.set(key, value).catch((err) => this.logger.error(`Redis set failed for ${key}`, err));
    this.redisPubSub.publishMarketUpdate(payload).catch((err) => this.logger.error('Redis Pub/Sub publish failed', err));
    this.logger.log(`Market update (${source}): ${symbol} = ${price}`);
  }

  private handleTrade(trade: { s?: string; p?: number; t?: number }) {
    const symbol = trade.s ? normalizeSymbol(trade.s) : '';
    const price = typeof trade.p === 'number' ? trade.p : 0;
    const timestamp = typeof trade.t === 'number' ? Math.floor(trade.t / 1000) : Math.floor(Date.now() / 1000);
    if (!symbol || !DISPLAY_SYMBOLS.includes(symbol)) return;
    this.publishPrice(symbol, price, timestamp, 'ws');
  }

  /** Fetch current quote from Finnhub REST and publish. Used when WebSocket has no trades (e.g. outside US market hours). */
  private async fetchAndPublishQuotes() {
    if (!this.apiKey) return;
    const ts = Math.floor(Date.now() / 1000);
    for (const symbol of DISPLAY_SYMBOLS) {
      try {
        const { data } = await axios.get<{ c?: number; pc?: number; t?: number }>(FINNHUB_QUOTE_URL, {
          params: { symbol, token: this.apiKey },
          timeout: 10_000,
        });
        const price = data?.c;
        if (typeof price === 'number' && price > 0) {
          this.publishPrice(symbol, price, data?.t ?? ts, 'quote');
        }
      } catch (err) {
        this.logger.warn(`Finnhub quote failed for ${symbol}`, err instanceof Error ? err.message : err);
      }
    }
  }

  private startQuotePoll() {
    this.fetchAndPublishQuotes();
    this.quotePollTimer = setInterval(() => this.fetchAndPublishQuotes(), QUOTE_POLL_INTERVAL_MS);
    this.logger.log('Quote poll started (fallback when WebSocket has no trades, e.g. outside US market hours)');
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.logger.log('Reconnecting to Finnhub WebSocket...');
      this.connect();
    }, 5000);
  }

  private disconnect() {
    if (this.ws) {
      this.ws.removeAllListeners();
      this.ws.close();
      this.ws = null;
    }
  }
}
