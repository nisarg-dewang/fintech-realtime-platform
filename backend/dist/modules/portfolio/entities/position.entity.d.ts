import { Portfolio } from './portfolio.entity';
export declare class Position {
    id: string;
    portfolioId: string;
    portfolio: Portfolio;
    symbol: string;
    quantity: string;
    averagePrice: string;
}
