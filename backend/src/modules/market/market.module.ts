import { Module } from '@nestjs/common';
import { MarketService } from './market.service';
import { MarketController } from './market.controller';
import { MarketDataService } from './market-data.service';

@Module({
  providers: [MarketService, MarketDataService],
  controllers: [MarketController],
  exports: [MarketService],
})
export class MarketModule {}
