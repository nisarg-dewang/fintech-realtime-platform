import { MarketService } from './market.service';
import { RedisService } from '../../redis/redis.service';
export declare class MarketController {
    private readonly marketService;
    private readonly redis;
    constructor(marketService: MarketService, redis: RedisService);
    getPrice(symbol: string): Promise<{
        symbol: string;
        price: number;
        source: string;
        error?: undefined;
    } | {
        symbol: string;
        error: string;
        price?: undefined;
        source?: undefined;
    }>;
}
