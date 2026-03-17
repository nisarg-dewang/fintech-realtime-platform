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
let MarketController = class MarketController {
    constructor(marketService) {
        this.marketService = marketService;
    }
    getList() {
        return this.marketService.getFeaturedList();
    }
    async getHistory(symbol, from, to, resolution) {
        const fromNum = parseInt(from, 10);
        const toNum = parseInt(to, 10);
        if (Number.isNaN(fromNum) || Number.isNaN(toNum)) {
            return { error: 'from and to must be valid Unix timestamps' };
        }
        const res = resolution === 'D' ? 'D' : 5;
        return this.marketService.getHistory(symbol.toUpperCase(), fromNum, toNum, res);
    }
    async getPrice(symbol) {
        const data = await this.marketService.getLatestPrice(symbol.toUpperCase());
        if (!data) {
            return { symbol: symbol.toUpperCase(), error: 'No data in cache' };
        }
        return data;
    }
};
exports.MarketController = MarketController;
__decorate([
    (0, common_1.Get)('list'),
    (0, swagger_1.ApiOperation)({ summary: 'Get list of 10 featured stocks with current price (from Finnhub)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Array of { symbol, description, price }',
        schema: {
            type: 'array',
            items: { type: 'object', properties: { symbol: {}, description: {}, price: { type: 'number', nullable: true } } },
        },
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MarketController.prototype, "getList", null);
__decorate([
    (0, common_1.Get)(':symbol/history'),
    (0, swagger_1.ApiOperation)({ summary: 'Get historical candle data (Finnhub). Use resolution=D for daily bars (e.g. 7-day chart).' }),
    (0, swagger_1.ApiParam)({ name: 'symbol', description: 'Symbol (e.g. AAPL, TSLA)' }),
    (0, swagger_1.ApiQuery)({ name: 'from', description: 'Start time (Unix timestamp)', required: true }),
    (0, swagger_1.ApiQuery)({ name: 'to', description: 'End time (Unix timestamp)', required: true }),
    (0, swagger_1.ApiQuery)({ name: 'resolution', description: '5 = 5-min, D = daily', required: false }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Array of candles with time, open, high, low, close',
        schema: {
            type: 'array',
            items: { type: 'object', properties: { time: { type: 'number' }, open: {}, high: {}, low: {}, close: {} } },
        },
    }),
    __param(0, (0, common_1.Param)('symbol')),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __param(3, (0, common_1.Query)('resolution')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], MarketController.prototype, "getHistory", null);
__decorate([
    (0, common_1.Get)(':symbol'),
    (0, swagger_1.ApiOperation)({ summary: 'Get latest price from Redis cache' }),
    (0, swagger_1.ApiParam)({ name: 'symbol', description: 'Symbol (e.g. AAPL, TSLA, BTC, ETH)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Latest price with symbol, price, and timestamp; or error if no data in cache',
    }),
    __param(0, (0, common_1.Param)('symbol')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MarketController.prototype, "getPrice", null);
exports.MarketController = MarketController = __decorate([
    (0, swagger_1.ApiTags)('market'),
    (0, common_1.Controller)('market'),
    __metadata("design:paramtypes", [market_service_1.MarketService])
], MarketController);
//# sourceMappingURL=market.controller.js.map