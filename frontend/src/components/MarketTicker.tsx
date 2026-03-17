import PriceCard from './PriceCard';

const SYMBOLS = ['AAPL', 'TSLA', 'MSFT', 'GOOGL', 'AMZN', 'NVDA'] as const;

interface MarketTickerProps {
  prices: Record<string, number>;
  previousPrices?: Record<string, number>;
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
}

export default function MarketTicker({
  prices,
  previousPrices = {},
  selectedSymbol,
  onSelectSymbol,
}: MarketTickerProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {SYMBOLS.map((symbol) => (
        <PriceCard
          key={symbol}
          symbol={symbol}
          price={prices[symbol] ?? null}
          previousPrice={previousPrices[symbol]}
          selected={selectedSymbol === symbol}
          onClick={() => onSelectSymbol(symbol)}
        />
      ))}
    </div>
  );
}
