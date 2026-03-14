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
exports.PortfolioController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const portfolio_service_1 = require("./portfolio.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const user_entity_1 = require("../users/entities/user.entity");
const buy_dto_1 = require("./dto/buy.dto");
const sell_dto_1 = require("./dto/sell.dto");
let PortfolioController = class PortfolioController {
    constructor(portfolioService) {
        this.portfolioService = portfolioService;
    }
    async getPortfolio(user) {
        return this.portfolioService.getOrCreateForUser(user.id);
    }
    async buy(user, dto) {
        return this.portfolioService.buy(user.id, dto.symbol, dto.quantity);
    }
    async sell(user, dto) {
        return this.portfolioService.sell(user.id, dto.symbol, dto.quantity);
    }
};
exports.PortfolioController = PortfolioController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get current portfolio' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User]),
    __metadata("design:returntype", Promise)
], PortfolioController.prototype, "getPortfolio", null);
__decorate([
    (0, common_1.Post)('buy'),
    (0, swagger_1.ApiOperation)({ summary: 'Buy asset' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User, buy_dto_1.BuyDto]),
    __metadata("design:returntype", Promise)
], PortfolioController.prototype, "buy", null);
__decorate([
    (0, common_1.Post)('sell'),
    (0, swagger_1.ApiOperation)({ summary: 'Sell asset' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User, sell_dto_1.SellDto]),
    __metadata("design:returntype", Promise)
], PortfolioController.prototype, "sell", null);
exports.PortfolioController = PortfolioController = __decorate([
    (0, swagger_1.ApiTags)('portfolio'),
    (0, common_1.Controller)('portfolio'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [portfolio_service_1.PortfolioService])
], PortfolioController);
//# sourceMappingURL=portfolio.controller.js.map