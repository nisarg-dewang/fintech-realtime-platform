import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { RedisService } from './redis.service';

export const CHANNEL_MARKET_UPDATE = 'MARKET_UPDATE';
export const CHANNEL_TRADE_EXECUTED = 'TRADE_EXECUTED';

export interface MarketUpdatePayload {
  symbol: string;
  price: number;
  timestamp: number;
}

export type TradeExecutedPayload = Record<string, unknown>;

/**
 * Redis Pub/Sub service for distributed event broadcasting.
 * Uses dedicated publisher and subscriber connections so that multiple
 * backend instances can publish and receive events, keeping WebSocket
 * broadcasting scalable across instances.
 */
@Injectable()
export class RedisPubSubService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisPubSubService.name);
  private marketUpdateHandler: ((payload: MarketUpdatePayload) => void) | null = null;
  private tradeExecutedHandler: ((payload: TradeExecutedPayload) => void) | null = null;
  private messageListenerAttached = false;

  constructor(private readonly redis: RedisService) {}

  onModuleInit() {
    const subscriber = this.redis.getSubscriber();
    if (this.messageListenerAttached) return;
    subscriber.on('message', (channel: string, message: string) => {
      try {
        if (channel === CHANNEL_MARKET_UPDATE) {
          const payload = JSON.parse(message) as MarketUpdatePayload;
          this.marketUpdateHandler?.(payload);
        } else if (channel === CHANNEL_TRADE_EXECUTED) {
          const payload = JSON.parse(message) as TradeExecutedPayload;
          this.tradeExecutedHandler?.(payload);
        }
      } catch (err) {
        this.logger.warn(`Failed to parse message on channel ${channel}`, err);
      }
    });
    this.messageListenerAttached = true;
    subscriber.subscribe(CHANNEL_MARKET_UPDATE);
    subscriber.subscribe(CHANNEL_TRADE_EXECUTED);
    this.logger.log('Subscribed to Redis channels: MARKET_UPDATE, TRADE_EXECUTED');
  }

  onModuleDestroy() {
    const subscriber = this.redis.getSubscriber();
    subscriber.unsubscribe(CHANNEL_MARKET_UPDATE, CHANNEL_TRADE_EXECUTED);
    this.marketUpdateHandler = null;
    this.tradeExecutedHandler = null;
  }

  /** Register handler for MARKET_UPDATE (called by WebSocket gateway). */
  registerMarketUpdateHandler(handler: (payload: MarketUpdatePayload) => void): void {
    this.marketUpdateHandler = handler;
  }

  /** Register handler for TRADE_EXECUTED (called by WebSocket gateway). */
  registerTradeExecutedHandler(handler: (payload: TradeExecutedPayload) => void): void {
    this.tradeExecutedHandler = handler;
  }

  /** Publish market price update to all subscribers (e.g. other backend instances). */
  async publishMarketUpdate(payload: MarketUpdatePayload): Promise<number> {
    return this.redis.publish(CHANNEL_MARKET_UPDATE, JSON.stringify(payload));
  }

  /** Publish trade executed event to all subscribers. */
  async publishTradeExecuted(payload: TradeExecutedPayload): Promise<number> {
    return this.redis.publish(CHANNEL_TRADE_EXECUTED, JSON.stringify(payload));
  }
}
