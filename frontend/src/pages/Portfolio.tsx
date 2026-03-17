import { useState, useEffect } from 'react';
import { portfolioApi, PortfolioPosition } from '../services/api';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../hooks/useAuth';
import MarketTicker from '../components/MarketTicker';

const SYMBOLS = ['AAPL', 'TSLA', 'MSFT', 'GOOGL', 'AMZN', 'NVDA'];

export default function Portfolio() {
  const { token } = useAuth();
  const [balance, setBalance] = useState<string>('');
  const [positions, setPositions] = useState<PortfolioPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [buyingSymbol, setBuyingSymbol] = useState<string | null>(null);
  const [buyQty, setBuyQty] = useState('1');
  const [sellModal, setSellModal] = useState<{ symbol: string; maxQty: number } | null>(null);
  const [sellQty, setSellQty] = useState('');

  const load = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      setError('');
      const data = await portfolioApi.get(token);
      setBalance(typeof data?.balance === 'string' ? data.balance : String(data?.balance ?? '0'));
      setPositions(Array.isArray(data?.positions) ? data.positions : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load portfolio');
    } finally {
      setLoading(false);
    }
  };

  const { prices, previousPrices } = useSocket({ onTradeExecuted: load });

  useEffect(() => {
    load();
  }, [token]);

  const handleBuy = async (e: React.FormEvent, symbol: string) => {
    e.preventDefault();
    const qty = parseFloat(buyQty);
    if (!qty || qty <= 0) return;
    setError('');
    setBuyingSymbol(symbol);
    try {
      await portfolioApi.buy(symbol, qty, token);
      await load();
      setBuyQty('1');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Buy failed');
    } finally {
      setBuyingSymbol(null);
    }
  };

  const openSellModal = (symbol: string, maxQty: number) => {
    setSellModal({ symbol, maxQty });
    setSellQty('');
  };

  const closeSellModal = () => {
    setSellModal(null);
    setSellQty('');
  };

  const handleSell = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellModal) return;
    const qty = parseFloat(sellQty);
    if (!qty || qty <= 0 || qty > sellModal.maxQty) return;
    setError('');
    setBuyingSymbol(sellModal.symbol);
    try {
      await portfolioApi.sell(sellModal.symbol, qty, token);
      await load();
      closeSellModal();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sell failed');
    } finally {
      setBuyingSymbol(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[200px]">
        <span className="text-gray-400">Loading portfolio...</span>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <h1 className="text-xl font-semibold text-white mb-6">Portfolio</h1>
      {error && (
        <p className="mb-4 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 text-sm">{error}</p>
      )}

      <section className="mb-8">
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
          <div className="text-sm text-gray-400 font-medium">Account balance</div>
          <div className="text-2xl font-semibold text-white mt-1">
            ${parseFloat(balance || '0').toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
          Owned assets
        </h2>
        {positions.length === 0 ? (
          <p className="text-gray-500 text-sm">No positions yet. Buy an asset below.</p>
        ) : (
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
            <ul className="divide-y divide-gray-700">
              {positions.map((p) => {
                const qty = parseFloat(p.quantity);
                const last = prices[p.symbol];
                return (
                  <li
                    key={p.symbol}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-800/80 transition-colors"
                  >
                    <div>
                      <span className="font-medium text-white">{p.symbol}</span>
                      <span className="text-gray-400 ml-2">
                        {qty} {qty === 1 ? 'share' : 'shares'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-gray-400 text-sm">
                        Avg ${parseFloat(p.averagePrice).toFixed(2)}
                      </span>
                      <span className="text-white font-medium">
                        {last != null ? `$${last.toFixed(2)}` : '—'}
                      </span>
                      <button
                        type="button"
                        onClick={() => openSellModal(p.symbol, qty)}
                        className="px-3 py-1.5 text-sm font-medium rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                      >
                        Sell
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
          Quick buy
        </h2>
        <div className="mb-4">
          <MarketTicker prices={prices} previousPrices={previousPrices} selectedSymbol="" onSelectSymbol={() => {}} />
        </div>
        <div className="flex flex-wrap gap-3">
          {SYMBOLS.map((symbol) => (
            <form
              key={symbol}
              onSubmit={(e) => handleBuy(e, symbol)}
              className="flex items-center gap-2 bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3"
            >
              <span className="font-medium text-white w-12">{symbol}</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={buyQty}
                onChange={(e) => setBuyQty(e.target.value)}
                className="w-20 px-2 py-1.5 rounded-lg bg-gray-900 border border-gray-600 text-white text-sm"
                placeholder="Qty"
              />
              <button
                type="submit"
                disabled={buyingSymbol !== null}
                className="px-3 py-1.5 text-sm font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
              >
                {buyingSymbol === symbol ? '...' : 'BUY'}
              </button>
            </form>
          ))}
        </div>
      </section>

      {sellModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={closeSellModal}
        >
          <div
            className="bg-gray-800 border border-gray-700 rounded-xl p-6 w-full max-w-sm shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white">Sell {sellModal.symbol}</h3>
            <p className="text-gray-400 text-sm mt-1">Max: {sellModal.maxQty}</p>
            <form onSubmit={handleSell} className="mt-4">
              <input
                type="number"
                min="0.01"
                max={sellModal.maxQty}
                step="0.01"
                value={sellQty}
                onChange={(e) => setSellQty(e.target.value)}
                placeholder="Quantity"
                required
                className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-600 text-white mb-4"
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setSellQty(String(sellModal.maxQty))}
                  className="px-3 py-2 text-sm font-medium rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600"
                >
                  Sell all
                </button>
                <button
                  type="button"
                  onClick={closeSellModal}
                  className="px-3 py-2 text-sm font-medium rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={buyingSymbol !== null}
                  className="px-3 py-2 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-500 text-white disabled:opacity-50"
                >
                  {buyingSymbol !== null ? '...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
