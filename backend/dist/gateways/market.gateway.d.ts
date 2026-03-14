import { OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { RedisService } from '../redis/redis.service';
export declare class MarketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private readonly redis;
    server: Server;
    private readonly logger;
    constructor(redis: RedisService);
    afterInit(): void;
    handleConnection(): void;
    handleDisconnect(): void;
}
