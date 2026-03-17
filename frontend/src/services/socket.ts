import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.DEV ? 'http://localhost:3000' : window.location.origin;

let socketInstance: Socket | null = null;

export interface MarketUpdatePayload {
  symbol: string;
  price: number;
  timestamp: number;
}

export interface TradeExecutedPayload {
  userId: string;
  type: 'buy' | 'sell';
  symbol: string;
  quantity: number;
  price: number;
  timestamp: string;
}

export type MarketUpdateListener = (data: MarketUpdatePayload) => void;
export type TradeExecutedListener = (data: TradeExecutedPayload) => void;

/**
 * Get or create the WebSocket client. Connects to backend with path /ws.
 * Use in React via useSocket hook so connection is managed with component lifecycle.
 */
export function getSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io(WS_URL, { path: '/ws', transports: ['websocket', 'polling'] });
  }
  return socketInstance;
}

/**
 * Connect and subscribe to market_update and trade_executed.
 * Returns cleanup function to remove listeners (call on unmount if you manage connection externally).
 */
export function subscribeSocket(options: {
  onMarketUpdate?: MarketUpdateListener;
  onTradeExecuted?: TradeExecutedListener;
  onConnect?: () => void;
  onDisconnect?: () => void;
}): () => void {
  const socket = getSocket();

  if (options.onConnect) socket.on('connect', options.onConnect);
  if (options.onDisconnect) socket.on('disconnect', options.onDisconnect);
  if (options.onMarketUpdate) {
    socket.on('market_update', (data: MarketUpdatePayload) => options.onMarketUpdate?.(data));
  }
  if (options.onTradeExecuted) {
    socket.on('trade_executed', (data: TradeExecutedPayload) => options.onTradeExecuted?.(data));
  }

  return () => {
    if (options.onConnect) socket.off('connect', options.onConnect);
    if (options.onDisconnect) socket.off('disconnect', options.onDisconnect);
    if (options.onMarketUpdate) socket.off('market_update');
    if (options.onTradeExecuted) socket.off('trade_executed');
  };
}
