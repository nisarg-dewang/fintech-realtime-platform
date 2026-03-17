import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { RedisPubSubService } from '../redis/redis-pubsub.service';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: { origin: true },
  path: '/ws',
})
export class MarketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(MarketGateway.name);
  private connectionCount = 0;

  constructor(private readonly redisPubSub: RedisPubSubService) {}

  afterInit() {
    this.redisPubSub.registerMarketUpdateHandler((payload) => {
      this.server.emit('market_update', payload);
    });
    this.redisPubSub.registerTradeExecutedHandler((payload) => {
      this.server.emit('trade_executed', payload);
    });
    this.logger.log('WebSocket gateway initialized; subscribed to Redis MARKET_UPDATE and TRADE_EXECUTED');
  }

  handleConnection(client: { id: string }) {
    this.connectionCount += 1;
    this.logger.log(`Client connected: id=${client.id}, total connections=${this.connectionCount}`);
  }

  handleDisconnect(client: { id: string }) {
    this.connectionCount = Math.max(0, this.connectionCount - 1);
    this.logger.log(`Client disconnected: id=${client.id}, total connections=${this.connectionCount}`);
  }
}
