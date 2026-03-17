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
const redis_pubsub_service_1 = require("../redis/redis-pubsub.service");
const common_1 = require("@nestjs/common");
let MarketGateway = MarketGateway_1 = class MarketGateway {
    constructor(redisPubSub) {
        this.redisPubSub = redisPubSub;
        this.logger = new common_1.Logger(MarketGateway_1.name);
        this.connectionCount = 0;
    }
    afterInit() {
        this.redisPubSub.registerMarketUpdateHandler((payload) => {
            this.server.emit('market_update', payload);
        });
        this.redisPubSub.registerTradeExecutedHandler((payload) => {
            this.server.emit('trade_executed', payload);
        });
        this.logger.log('WebSocket gateway initialized; subscribed to Redis MARKET_UPDATE and TRADE_EXECUTED');
    }
    handleConnection(client) {
        this.connectionCount += 1;
        this.logger.log(`Client connected: id=${client.id}, total connections=${this.connectionCount}`);
    }
    handleDisconnect(client) {
        this.connectionCount = Math.max(0, this.connectionCount - 1);
        this.logger.log(`Client disconnected: id=${client.id}, total connections=${this.connectionCount}`);
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
    __metadata("design:paramtypes", [redis_pubsub_service_1.RedisPubSubService])
], MarketGateway);
//# sourceMappingURL=market.gateway.js.map