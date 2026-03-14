import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { RedisService } from '../redis/redis.service';
import { Logger } from '@nestjs/common';

const MARKET_UPDATE_CHANNEL = 'MARKET_UPDATE';
const TRADE_EXECUTED_CHANNEL = 'TRADE_EXECUTED';

@WebSocketGateway({
  cors: { origin: true },
  path: '/ws',
})
export class MarketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(MarketGateway.name);

  constructor(private readonly redis: RedisService) {}

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
}
