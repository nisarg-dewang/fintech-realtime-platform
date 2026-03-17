import { useState, useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';
import { marketApi, FeaturedStock } from '../services/api';
import MarketTicker from '../components/MarketTicker';
import HistoryBarChart from '../components/HistoryBarChart';

export default function Dashboard() {
  const { connected, prices, previousPrices } = useSocket();
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [featuredList, setFeaturedList] = useState<FeaturedStock[]>([]);
  const [listLoading, setListLoading] = useState(true);

  useEffect(() => {
    marketApi
      .getList()
      .then(setFeaturedList)
      .catch(() => setFeaturedList([]))
      .finally(() => setListLoading(false));
  }, []);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-white">Market</h1>
        <div className="flex items-center gap-2 text-sm">
          <span
            className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-red-500'}`}
            aria-hidden
          />
          <span className={connected ? 'text-emerald-400' : 'text-red-400'}>
            {connected ? 'Live' : 'Disconnected'}
          </span>
        </div>
      </div>

      <section className="mb-8">
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
          Live tickers
        </h2>
        <MarketTicker
          prices={prices}
          previousPrices={previousPrices}
          selectedSymbol={selectedSymbol}
          onSelectSymbol={setSelectedSymbol}
        />
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
          Featured stocks (select for 7-day history)
        </h2>
        {listLoading ? (
          <p className="text-gray-500 text-sm">Loading list…</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {featuredList.map((item) => (
              <button
                key={item.symbol}
                type="button"
                onClick={() => setSelectedSymbol(item.symbol)}
                className={`text-left rounded-xl border transition-all duration-200 px-4 py-3 min-w-[140px] ${
                  selectedSymbol === item.symbol
                    ? 'ring-2 ring-emerald-500 border-emerald-500/50 bg-gray-800'
                    : 'bg-gray-800/80 border-gray-700 hover:border-gray-600 hover:bg-gray-800'
                }`}
              >
                <div className="text-gray-400 text-xs font-medium truncate max-w-[180px]" title={item.description}>
                  {item.description}
                </div>
                <div className="text-white font-semibold mt-0.5">{item.symbol}</div>
                <div className="text-gray-300 text-sm mt-0.5">
                  {item.price != null
                    ? `$${item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : '—'}
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
          {selectedSymbol} — Last 7 days (daily)
        </h2>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          <HistoryBarChart symbol={selectedSymbol} height={280} />
        </div>
      </section>
    </div>
  );
}
