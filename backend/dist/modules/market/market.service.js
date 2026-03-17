"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MarketService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const redis_service_1 = require("../../redis/redis.service");
const axios_1 = require("axios");
const REDIS_KEY_PREFIX = 'market:';
const FINNHUB_STOCK_CANDLE_URL = 'https://finnhub.io/api/v1/stock/candle';
const FINNHUB_CRYPTO_CANDLE_URL = 'https://finnhub.io/api/v1/crypto/candle';
const FINNHUB_QUOTE_URL = 'https://finnhub.io/api/v1/quote';
const CRYPTO_SYMBOL_MAP = {
    BTC: 'BINANCE:BTCUSDT',
    ETH: 'BINANCE:ETHUSDT',
};
const FEATURED_SYMBOLS = [
    { symbol: 'AAPL', description: 'Apple Inc.' },
    { symbol: 'MSFT', description: 'Microsoft Corp.' },
    { symbol: 'GOOGL', description: 'Alphabet (Google)' },
    { symbol: 'AMZN', description: 'Amazon.com Inc.' },
    { symbol: 'NVDA', description: 'NVIDIA Corp.' },
    { symbol: 'TSLA', description: 'Tesla Inc.' },
    { symbol: 'META', description: 'Meta Platforms' },
    { symbol: 'JPM', description: 'JPMorgan Chase' },
    { symbol: 'V', description: 'Visa Inc.' },
    { symbol: 'JNJ', description: 'Johnson & Johnson' },
];
let MarketService = MarketService_1 = class MarketService {
    constructor(redis, config) {
        this.redis = redis;
        this.config = config;
        this.logger = new common_1.Logger(MarketService_1.name);
    }
    async getLatestPrice(symbol) {
        const key = `${REDIS_KEY_PREFIX}${symbol.toUpperCase()}`;
        const cached = await this.redis.get(key);
        if (!cached)
            return null;
        try {
            return JSON.parse(cached);
        }
        catch {
            return null;
        }
    }
    async getPrice(symbol) {
        const data = await this.getLatestPrice(symbol);
        return data?.price ?? null;
    }
    async getFeaturedList() {
        const apiKey = this.config.get('FINNHUB_API_KEY', '');
        const result = [];
        for (const { symbol, description } of FEATURED_SYMBOLS) {
            const cached = await this.getLatestPrice(symbol);
            let price = cached?.price ?? null;
            if (price == null && apiKey) {
                try {
                    const { data } = await axios_1.default.get(FINNHUB_QUOTE_URL, {
                        params: { symbol, token: apiKey },
                        timeout: 5_000,
                    });
                    if (typeof data?.c === 'number' && data.c > 0)
                        price = data.c;
                }
                catch {
                }
            }
            result.push({ symbol, description, price });
        }
        return result;
    }
    async getHistory(symbol, from, to, resolution = 5) {
        const apiKey = this.config.get('FINNHUB_API_KEY', '');
        if (!apiKey) {
            this.logger.warn('getHistory: FINNHUB_API_KEY not set');
            return [];
        }
        const upper = symbol.toUpperCase();
        const isCrypto = upper in CRYPTO_SYMBOL_MAP;
        const finnhubSymbol = isCrypto ? CRYPTO_SYMBOL_MAP[upper] : upper;
        const url = isCrypto ? FINNHUB_CRYPTO_CANDLE_URL : FINNHUB_STOCK_CANDLE_URL;
        const parse = (data) => {
            if (data.s !== 'ok' || !data.t?.length)
                return [];
            const result = [];
            for (let i = 0; i < data.t.length; i++) {
                result.push({
                    time: data.t[i],
                    open: data.o?.[i] ?? 0,
                    high: data.h?.[i] ?? 0,
                    low: data.l?.[i] ?? 0,
                    close: data.c?.[i] ?? 0,
                });
            }
            return result;
        };
        const fetchCandles = async (f, t, res) => {
            const { data } = await axios_1.default.get(url, {
                params: { symbol: finnhubSymbol, resolution: res, from: f, to: t, token: apiKey },
                timeout: 15_000,
            });
            this.logger.debug(`Finnhub candle ${upper} resolution=${res}: s=${data.s} count=${data.t?.length ?? 0}`);
            return parse(data);
        };
        try {
            let result = await fetchCandles(from, to, resolution);
            if (result.length === 0 && !isCrypto && resolution !== 'D') {
                result = await fetchCandles(from, to, 'D');
            }
            if (result.length === 0 && !isCrypto) {
                const now = Math.floor(Date.now() / 1000);
                const fallbackTo = now - 86400;
                const fallbackFrom = fallbackTo - 30 * 86400;
                this.logger.log(`History empty for ${upper} (from=${from} to=${to}), trying 30-day fallback ending yesterday`);
                result = await fetchCandles(fallbackFrom, fallbackTo, 5);
                if (result.length === 0)
                    result = await fetchCandles(fallbackFrom, fallbackTo, 'D');
            }
            return result;
        }
        catch (err) {
            this.logger.warn(`Finnhub history failed for ${upper}`, err instanceof Error ? err.message : err);
            return [];
        }
    }
};
exports.MarketService = MarketService;
exports.MarketService = MarketService = MarketService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService,
        config_1.ConfigService])
], MarketService);
//# sourceMappingURL=market.service.js.map