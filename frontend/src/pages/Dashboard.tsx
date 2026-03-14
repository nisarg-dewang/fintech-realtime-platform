import { useSocket } from '../hooks/useSocket';

const SYMBOLS = ['AAPL', 'TSLA', 'BTC', 'ETH'];

export default function Dashboard() {
  const { connected, prices } = useSocket();

  return (
    <div className="page dashboard-page">
      <h2>Live Market</h2>
      <p className="ws-status">
        WebSocket: <span className={connected ? 'connected' : 'disconnected'}>
          {connected ? 'Connected' : 'Disconnected'}
        </span>
      </p>
      <div className="market-grid">
        {SYMBOLS.map((symbol) => (
          <div key={symbol} className="market-card">
            <span className="symbol">{symbol}</span>
            <span className="price">
              {prices[symbol] != null
                ? `$${prices[symbol].toFixed(2)}`
                : '—'}
            </span>
          </div>
        ))}
      </div>
      <p className="hint">Prices update every second via WebSocket (market_update).</p>
    </div>
  );
}
