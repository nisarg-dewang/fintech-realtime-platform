import { Repository } from 'typeorm';
import { Portfolio } from './entities/portfolio.entity';
import { Position } from './entities/position.entity';
import { MarketService } from '../market/market.service';
import { RedisService } from '../../redis/redis.service';
export declare class PortfolioService {
    private readonly portfolioRepo;
    private readonly positionRepo;
    private readonly marketService;
    private readonly redis;
    constructor(portfolioRepo: Repository<Portfolio>, positionRepo: Repository<Position>, marketService: MarketService, redis: RedisService);
    getOrCreateForUser(userId: string): Promise<Portfolio>;
    buy(userId: string, symbol: string, quantity: number): Promise<Portfolio>;
    sell(userId: string, symbol: string, quantity: number): Promise<Portfolio>;
}
