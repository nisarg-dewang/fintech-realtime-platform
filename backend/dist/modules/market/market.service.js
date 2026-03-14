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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketService = void 0;
const common_1 = require("@nestjs/common");
const redis_service_1 = require("../../redis/redis.service");
const SYMBOLS = ['AAPL', 'TSLA', 'BTC', 'ETH'];
const MARKET_UPDATE_CHANNEL = 'MARKET_UPDATE';
const PRICE_CACHE_PREFIX = 'market:price:';
const PRICE_CACHE_TTL = 60;
const BASE_PRICES = {
    AAPL: 180,
    TSLA: 250,
    BTC: 45000,
    ETH: 2500,
};
let MarketService = class MarketService {
    constructor(redis) {
        this.redis = redis;
        this.prices = new Map();
        SYMBOLS.forEach((s) => this.prices.set(s, BASE_PRICES[s] ?? 100));
    }
    onModuleInit() {
        this.tick();
        this.intervalId = setInterval(() => this.tick(), 1000);
    }
    tick() {
        const updates = [];
        for (const symbol of SYMBOLS) {
            const current = this.prices.get(symbol) ?? 100;
            const change = (Math.random() - 0.5) * current * 0.002;
            const next = Math.max(1, current + change);
            this.prices.set(symbol, next);
            updates.push({ symbol, price: next });
            this.redis.set(PRICE_CACHE_PREFIX + symbol, next.toFixed(2), PRICE_CACHE_TTL);
        }
        const payload = JSON.stringify({ prices: updates, timestamp: new Date().toISOString() });
        this.redis.publish(MARKET_UPDATE_CHANNEL, payload);
    }
    async getPrice(symbol) {
        const cached = await this.redis.get(PRICE_CACHE_PREFIX + symbol);
        if (cached)
            return parseFloat(cached);
        const inMemory = this.prices.get(symbol);
        if (inMemory != null) {
            await this.redis.set(PRICE_CACHE_PREFIX + symbol, inMemory.toFixed(2), PRICE_CACHE_TTL);
            return inMemory;
        }
        return null;
    }
    getPrices() {
        return Object.fromEntries(this.prices);
    }
};
exports.MarketService = MarketService;
exports.MarketService = MarketService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService])
], MarketService);
//# sourceMappingURL=market.service.js.map