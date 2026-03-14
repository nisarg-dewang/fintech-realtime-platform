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
var MarketGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const redis_service_1 = require("../redis/redis.service");
const common_1 = require("@nestjs/common");
const MARKET_UPDATE_CHANNEL = 'MARKET_UPDATE';
const TRADE_EXECUTED_CHANNEL = 'TRADE_EXECUTED';
let MarketGateway = MarketGateway_1 = class MarketGateway {
    constructor(redis) {
        this.redis = redis;
        this.logger = new common_1.Logger(MarketGateway_1.name);
    }
    afterInit() {
        this.redis.subscribe(MARKET_UPDATE_CHANNEL, (message) => {
            this.server.emit('market_update', JSON.parse(message));
        });
        this.redis.subscribe(TRADE_EXECUTED_CHANNEL, (message) => {
            this.server.emit('trade_executed', JSON.parse(message));
        });
    }
    handleConnection() {
        this.logger.log('Client connected');
    }
    handleDisconnect() {
        this.logger.log('Client disconnected');
    }
};
exports.MarketGateway = MarketGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], MarketGateway.prototype, "server", void 0);
exports.MarketGateway = MarketGateway = MarketGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: { origin: true },
        path: '/ws',
    }),
    __metadata("design:paramtypes", [redis_service_1.RedisService])
], MarketGateway);
//# sourceMappingURL=market.gateway.js.map