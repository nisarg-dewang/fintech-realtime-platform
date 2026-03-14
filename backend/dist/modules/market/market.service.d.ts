import { OnModuleInit } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
export declare class MarketService implements OnModuleInit {
    private readonly redis;
    private prices;
    private intervalId?;
    constructor(redis: RedisService);
    onModuleInit(): void;
    private tick;
    getPrice(symbol: string): Promise<number | null>;
    getPrices(): Record<string, number>;
}
