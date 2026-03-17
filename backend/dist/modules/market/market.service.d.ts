import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../redis/redis.service';
export interface CandlePoint {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
}
export declare class MarketService {
    private readonly redis;
    private readonly config;
    private readonly logger;
    constructor(redis: RedisService, config: ConfigService);
    getLatestPrice(symbol: string): Promise<{
        symbol: string;
        price: number;
        timestamp: number;
    } | null>;
    getPrice(symbol: string): Promise<number | null>;
    getFeaturedList(): Promise<{
        symbol: string;
        description: string;
        price: number | null;
    }[]>;
    getHistory(symbol: string, from: number, to: number, resolution?: number | 'D'): Promise<CandlePoint[]>;
}
