interface PriceCardProps {
  symbol: string;
  price: number | null;
  previousPrice?: number | null;
  selected?: boolean;
  onClick?: () => void;
}

export default function PriceCard({ symbol, price, previousPrice, selected, onClick }: PriceCardProps) {
  const hasPrice = price != null && Number.isFinite(price);
  const change =
    hasPrice && previousPrice != null && previousPrice > 0
      ? ((price - previousPrice) / previousPrice) * 100
      : null;
  const isPositive = change != null && change > 0;
  const isNegative = change != null && change < 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full text-left rounded-xl border transition-all duration-200
        bg-gray-800/80 border-gray-700 hover:border-gray-600 hover:bg-gray-800
        px-4 py-3 min-w-[120px]
        ${selected ? 'ring-2 ring-emerald-500 border-emerald-500/50' : ''}
      `}
    >
      <div className="text-gray-400 text-sm font-medium tracking-wide">{symbol}</div>
      <div className="text-white text-lg font-semibold mt-0.5">
        {hasPrice ? `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
      </div>
      {change != null && (
        <div
          className={`text-sm font-medium mt-0.5 ${
            isPositive ? 'text-emerald-400' : isNegative ? 'text-red-400' : 'text-gray-400'
          }`}
        >
          {isPositive ? '+' : ''}
          {change.toFixed(2)}%
        </div>
      )}
    </button>
  );
}
