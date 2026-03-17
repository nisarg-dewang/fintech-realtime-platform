import { PortfolioService } from './portfolio.service';
import { User } from '../users/entities/user.entity';
import { BuyDto } from './dto/buy.dto';
import { SellDto } from './dto/sell.dto';
export declare class PortfolioController {
    private readonly portfolioService;
    constructor(portfolioService: PortfolioService);
    getPortfolio(user: User): Promise<{
        id: string;
        balance: string;
        positions: {
            id: string;
            symbol: string;
            quantity: string;
            averagePrice: string;
        }[];
    }>;
    buy(user: User, dto: BuyDto): Promise<import("./entities/portfolio.entity").Portfolio>;
    sell(user: User, dto: SellDto): Promise<import("./entities/portfolio.entity").Portfolio>;
}
