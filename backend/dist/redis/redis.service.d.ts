import { OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
export declare class RedisService implements OnModuleDestroy {
    private readonly publisher;
    private readonly subscriber;
    private readonly client;
    constructor();
    getClient(): Redis;
    getPublisher(): Redis;
    getSubscriber(): Redis;
    set(key: string, value: string, ttlSeconds?: number): Promise<void>;
    get(key: string): Promise<string | null>;
    publish(channel: string, message: string): Promise<number>;
    subscribe(channel: string, callback: (message: string) => void): void;
    onModuleDestroy(): Promise<void>;
}
