import { PortfolioService } from './portfolio.service';
import { User } from '../users/entities/user.entity';
import { BuyDto } from './dto/buy.dto';
import { SellDto } from './dto/sell.dto';
export declare class PortfolioController {
    private readonly portfolioService;
    constructor(portfolioService: PortfolioService);
    getPortfolio(user: User): Promise<import("./entities/portfolio.entity").Portfolio>;
    buy(user: User, dto: BuyDto): Promise<import("./entities/portfolio.entity").Portfolio>;
    sell(user: User, dto: SellDto): Promise<import("./entities/portfolio.entity").Portfolio>;
}
