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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const market_service_1 = require("./market.service");
const redis_service_1 = require("../../redis/redis.service");
const PRICE_CACHE_PREFIX = 'market:price:';
let MarketController = class MarketController {
    constructor(marketService, redis) {
        this.marketService = marketService;
        this.redis = redis;
    }
    async getPrice(symbol) {
        const cached = await this.redis.get(PRICE_CACHE_PREFIX + symbol.toUpperCase());
        if (cached) {
            return { symbol: symbol.toUpperCase(), price: parseFloat(cached), source: 'redis' };
        }
        const price = await this.marketService.getPrice(symbol.toUpperCase());
        if (price == null)
            return { symbol: symbol.toUpperCase(), error: 'Unknown symbol' };
        return { symbol: symbol.toUpperCase(), price, source: 'memory' };
    }
};
exports.MarketController = MarketController;
__decorate([
    (0, common_1.Get)(':symbol'),
    (0, swagger_1.ApiOperation)({ summary: 'Get latest price from Redis cache' }),
    __param(0, (0, common_1.Param)('symbol')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MarketController.prototype, "getPrice", null);
exports.MarketController = MarketController = __decorate([
    (0, swagger_1.ApiTags)('market'),
    (0, common_1.Controller)('market'),
    __metadata("design:paramtypes", [market_service_1.MarketService,
        redis_service_1.RedisService])
], MarketController);
//# sourceMappingURL=market.controller.js.map