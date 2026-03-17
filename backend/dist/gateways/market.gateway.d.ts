import { OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { RedisPubSubService } from '../redis/redis-pubsub.service';
export declare class MarketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private readonly redisPubSub;
    server: Server;
    private readonly logger;
    private connectionCount;
    constructor(redisPubSub: RedisPubSubService);
    afterInit(): void;
    handleConnection(client: {
        id: string;
    }): void;
    handleDisconnect(client: {
        id: string;
    }): void;
}
