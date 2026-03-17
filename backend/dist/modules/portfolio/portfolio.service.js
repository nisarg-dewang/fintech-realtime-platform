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
exports.PortfolioService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const portfolio_entity_1 = require("./entities/portfolio.entity");
const position_entity_1 = require("./entities/position.entity");
const market_service_1 = require("../market/market.service");
const redis_pubsub_service_1 = require("../../redis/redis-pubsub.service");
const INITIAL_BALANCE = 100000;
let PortfolioService = class PortfolioService {
    constructor(portfolioRepo, positionRepo, marketService, redisPubSub) {
        this.portfolioRepo = portfolioRepo;
        this.positionRepo = positionRepo;
        this.marketService = marketService;
        this.redisPubSub = redisPubSub;
    }
    async getOrCreateForUser(userId) {
        let portfolio = await this.portfolioRepo.findOne({
            where: { userId },
            relations: ['positions'],
        });
        if (!portfolio) {
            portfolio = this.portfolioRepo.create({
                userId,
                balance: String(INITIAL_BALANCE),
            });
            portfolio = await this.portfolioRepo.save(portfolio);
            portfolio.positions = [];
        }
        return portfolio;
    }
    async buy(userId, symbol, quantity) {
        if (quantity <= 0)
            throw new common_1.BadRequestException('Quantity must be positive');
        const price = await this.marketService.getPrice(symbol);
        if (!price)
            throw new common_1.BadRequestException(`Unknown symbol: ${symbol}`);
        const cost = price * quantity;
        const portfolio = await this.getOrCreateForUser(userId);
        const balance = parseFloat(portfolio.balance);
        if (balance < cost)
            throw new common_1.BadRequestException('Insufficient balance');
        const existingPosition = portfolio.positions?.find((p) => p.symbol === symbol);
        if (existingPosition) {
            const oldQty = parseFloat(existingPosition.quantity);
            const oldAvg = parseFloat(existingPosition.averagePrice);
            const newQty = oldQty + quantity;
            const newAvg = (oldQty * oldAvg + quantity * price) / newQty;
            await this.positionRepo.update(existingPosition.id, {
                quantity: String(newQty),
                averagePrice: String(newAvg.toFixed(2)),
            });
        }
        else {
            await this.positionRepo.insert({
                portfolioId: portfolio.id,
                symbol,
                quantity: String(quantity),
                averagePrice: String(price.toFixed(2)),
            });
        }
        const newBalance = (balance - cost).toFixed(2);
        await this.portfolioRepo.update(portfolio.id, { balance: newBalance });
        await this.redisPubSub.publishTradeExecuted({
            userId,
            type: 'buy',
            symbol,
            quantity,
            price,
            timestamp: new Date().toISOString(),
        });
        return this.getOrCreateForUser(userId);
    }
    async sell(userId, symbol, quantity) {
        if (quantity <= 0)
            throw new common_1.BadRequestException('Quantity must be positive');
        const price = await this.marketService.getPrice(symbol);
        if (!price)
            throw new common_1.BadRequestException(`Unknown symbol: ${symbol}`);
        const portfolio = await this.getOrCreateForUser(userId);
        const position = portfolio.positions?.find((p) => p.symbol === symbol);
        if (!position)
            throw new common_1.NotFoundException(`No position in ${symbol}`);
        const owned = parseFloat(position.quantity);
        if (owned < quantity)
            throw new common_1.BadRequestException('Insufficient quantity to sell');
        const proceeds = price * quantity;
        const newQty = owned - quantity;
        if (newQty === 0) {
            await this.positionRepo.delete(position.id);
        }
        else {
            await this.positionRepo.update(position.id, {
                quantity: String(newQty),
            });
        }
        const newBalance = (parseFloat(portfolio.balance) + proceeds).toFixed(2);
        await this.portfolioRepo.update(portfolio.id, { balance: newBalance });
        await this.redisPubSub.publishTradeExecuted({
            userId,
            type: 'sell',
            symbol,
            quantity,
            price,
            timestamp: new Date().toISOString(),
        });
        return this.getOrCreateForUser(userId);
    }
};
exports.PortfolioService = PortfolioService;
exports.PortfolioService = PortfolioService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(portfolio_entity_1.Portfolio)),
    __param(1, (0, typeorm_1.InjectRepository)(position_entity_1.Position)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        market_service_1.MarketService,
        redis_pubsub_service_1.RedisPubSubService])
], PortfolioService);
//# sourceMappingURL=portfolio.service.js.map