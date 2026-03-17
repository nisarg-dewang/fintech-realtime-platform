import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { PortfolioService } from './portfolio.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { BuyDto } from './dto/buy.dto';
import { SellDto } from './dto/sell.dto';

@ApiTags('portfolio')
@Controller('portfolio')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get()
  @ApiOperation({ summary: 'Get current portfolio' })
  async getPortfolio(@CurrentUser() user: User) {
    const portfolio = await this.portfolioService.getOrCreateForUser(user.id);
    return {
      id: portfolio.id,
      balance: portfolio.balance,
      positions: (portfolio.positions ?? []).map((p) => ({
        id: p.id,
        symbol: p.symbol,
        quantity: p.quantity,
        averagePrice: p.averagePrice,
      })),
    };
  }

  @Post('buy')
  @ApiOperation({ summary: 'Buy asset' })
  async buy(@CurrentUser() user: User, @Body() dto: BuyDto) {
    return this.portfolioService.buy(user.id, dto.symbol, dto.quantity);
  }

  @Post('sell')
  @ApiOperation({ summary: 'Sell asset' })
  async sell(@CurrentUser() user: User, @Body() dto: SellDto) {
    return this.portfolioService.sell(user.id, dto.symbol, dto.quantity);
  }
}
