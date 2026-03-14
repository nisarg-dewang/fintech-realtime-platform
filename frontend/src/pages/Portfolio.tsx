import { useState, useEffect } from 'react';
import { portfolio as portfolioApi } from '../api/client';
import { useSocket } from '../hooks/useSocket';

interface Position {
  id?: string;
  symbol: string;
  quantity: string;
  averagePrice: string;
}

const SYMBOLS = ['AAPL', 'TSLA', 'BTC', 'ETH'];

export default function Portfolio() {
  const [balance, setBalance] = useState<string>('');
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [buySymbol, setBuySymbol] = useState('AAPL');
  const [buyQty, setBuyQty] = useState('1');
  const [submitting, setSubmitting] = useState(false);
  const [sellModal, setSellModal] = useState<{ symbol: string; maxQty: number } | null>(null);
  const [sellQty, setSellQty] = useState('');

  const load = async () => {
    try {
      const data = await portfolioApi.get();
      setBalance(data.balance);
      setPositions(data.positions || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const { prices } = useSocket({ onTradeExecuted: load });

  useEffect(() => {
    load();
  }, []);

  const handleBuy = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(buyQty);
    if (!qty || qty <= 0) return;
    setError('');
    setSubmitting(true);
    try {
      await portfolioApi.buy(buySymbol, qty);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Buy failed');
    } finally {
      setSubmitting(false);
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
    setSubmitting(true);
    try {
      await portfolioApi.sell(sellModal.symbol, qty);
      await load();
      closeSellModal();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sell failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="page">Loading portfolio...</div>;

  return (
    <div className="page portfolio-page">
      <h2>Portfolio</h2>
      {error && <p className="error">{error}</p>}
      <div className="balance-section">
        <strong>Balance:</strong> ${parseFloat(balance || '0').toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </div>
      <div className="positions-section">
        <h3>Positions</h3>
        {positions.length === 0 ? (
          <p className="muted">No positions yet. Buy an asset below.</p>
        ) : (
          <table className="positions-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Qty</th>
                <th>Avg Price</th>
                <th>Last</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p) => {
                const qty = parseFloat(p.quantity);
                const last = prices[p.symbol];
                return (
                  <tr key={p.symbol}>
                    <td>{p.symbol}</td>
                    <td>{qty}</td>
                    <td>${parseFloat(p.averagePrice).toFixed(2)}</td>
                    <td>{last != null ? `$${last.toFixed(2)}` : '—'}</td>
                    <td>
                      <button
                        type="button"
                        className="btn-sm"
                        onClick={() => openSellModal(p.symbol, qty)}
                        disabled={submitting}
                      >
                        Sell
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <div className="buy-section">
        <h3>Buy</h3>
        <form onSubmit={handleBuy} className="buy-form">
          <select value={buySymbol} onChange={(e) => setBuySymbol(e.target.value)}>
            {SYMBOLS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={buyQty}
            onChange={(e) => setBuyQty(e.target.value)}
            placeholder="Qty"
          />
          <button type="submit" disabled={submitting}>
            {submitting ? '...' : 'Buy'}
          </button>
        </form>
      </div>

      {sellModal && (
        <div className="modal-overlay" onClick={closeSellModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Sell {sellModal.symbol}</h3>
            <p className="modal-hint">Max: {sellModal.maxQty}</p>
            <form onSubmit={handleSell}>
              <input
                type="number"
                min="0.01"
                max={sellModal.maxQty}
                step="0.01"
                value={sellQty}
                onChange={(e) => setSellQty(e.target.value)}
                placeholder="Quantity"
                required
              />
              <div className="modal-actions">
                <button type="button" onClick={() => setSellQty(String(sellModal.maxQty))}>
                  Sell all
                </button>
                <button type="button" onClick={closeSellModal}>Cancel</button>
                <button type="submit" disabled={submitting}>
                  {submitting ? '...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
