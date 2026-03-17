import { MarketService } from './market.service';
export declare class MarketController {
    private readonly marketService;
    constructor(marketService: MarketService);
    getList(): Promise<{
        symbol: string;
        description: string;
        price: number | null;
    }[]>;
    getHistory(symbol: string, from: string, to: string, resolution?: string): Promise<import("./market.service").CandlePoint[] | {
        error: string;
    }>;
    getPrice(symbol: string): Promise<{
        symbol: string;
        price: number;
        timestamp: number;
    } | {
        symbol: string;
        error: string;
    }>;
}
