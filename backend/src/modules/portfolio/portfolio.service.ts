import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Portfolio } from './entities/portfolio.entity';
import { Position } from './entities/position.entity';
import { MarketService } from '../market/market.service';
import { RedisService } from '../../redis/redis.service';

const INITIAL_BALANCE = 100000;
const TRADE_EXECUTED_CHANNEL = 'TRADE_EXECUTED';

@Injectable()
export class PortfolioService {
  constructor(
    @InjectRepository(Portfolio)
    private readonly portfolioRepo: Repository<Portfolio>,
    @InjectRepository(Position)
    private readonly positionRepo: Repository<Position>,
    private readonly marketService: MarketService,
    private readonly redis: RedisService,
  ) {}

  async getOrCreateForUser(userId: string): Promise<Portfolio> {
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

  async buy(userId: string, symbol: string, quantity: number) {
    if (quantity <= 0) throw new BadRequestException('Quantity must be positive');
    const price = await this.marketService.getPrice(symbol);
    if (!price) throw new BadRequestException(`Unknown symbol: ${symbol}`);
    const cost = price * quantity;
    const portfolio = await this.getOrCreateForUser(userId);
    const balance = parseFloat(portfolio.balance);
    if (balance < cost) throw new BadRequestException('Insufficient balance');
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
    } else {
      await this.positionRepo.insert({
        portfolioId: portfolio.id,
        symbol,
        quantity: String(quantity),
        averagePrice: String(price.toFixed(2)),
      });
    }
    const newBalance = (balance - cost).toFixed(2);
    await this.portfolioRepo.update(portfolio.id, { balance: newBalance });
    const tradePayload = JSON.stringify({
      userId,
      type: 'buy',
      symbol,
      quantity,
      price,
      timestamp: new Date().toISOString(),
    });
    await this.redis.publish(TRADE_EXECUTED_CHANNEL, tradePayload);
    return this.getOrCreateForUser(userId);
  }

  async sell(userId: string, symbol: string, quantity: number) {
    if (quantity <= 0) throw new BadRequestException('Quantity must be positive');
    const price = await this.marketService.getPrice(symbol);
    if (!price) throw new BadRequestException(`Unknown symbol: ${symbol}`);
    const portfolio = await this.getOrCreateForUser(userId);
    const position = portfolio.positions?.find((p) => p.symbol === symbol);
    if (!position) throw new NotFoundException(`No position in ${symbol}`);
    const owned = parseFloat(position.quantity);
    if (owned < quantity) throw new BadRequestException('Insufficient quantity to sell');
    const proceeds = price * quantity;
    const newQty = owned - quantity;
    if (newQty === 0) {
      await this.positionRepo.delete(position.id);
    } else {
      await this.positionRepo.update(position.id, {
        quantity: String(newQty),
      });
    }
    const newBalance = (parseFloat(portfolio.balance) + proceeds).toFixed(2);
    await this.portfolioRepo.update(portfolio.id, { balance: newBalance });
    const tradePayload = JSON.stringify({
      userId,
      type: 'sell',
      symbol,
      quantity,
      price,
      timestamp: new Date().toISOString(),
    });
    await this.redis.publish(TRADE_EXECUTED_CHANNEL, tradePayload);
    return this.getOrCreateForUser(userId);
  }
}
