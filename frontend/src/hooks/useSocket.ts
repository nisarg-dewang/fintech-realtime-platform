import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

// In dev, connect directly to backend to avoid Vite WS proxy EPIPE errors on disconnect
const WS_URL = import.meta.env.DEV ? 'http://localhost:3000' : window.location.origin;

export interface MarketUpdate {
  prices: Array<{ symbol: string; price: number }>;
  timestamp: string;
}

export interface TradeExecuted {
  userId: string;
  type: 'buy' | 'sell';
  symbol: string;
  quantity: number;
  price: number;
  timestamp: string;
}

export interface UseSocketOptions {
  /** Called when a trade is executed (any user). Use to refetch portfolio. */
  onTradeExecuted?: () => void;
}

export function useSocket(options?: UseSocketOptions) {
  const [connected, setConnected] = useState(false);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const socketRef = useRef<Socket | null>(null);
  const onTradeExecutedRef = useRef(options?.onTradeExecuted);
  onTradeExecutedRef.current = options?.onTradeExecuted;

  useEffect(() => {
    const socket = io(WS_URL, { path: '/ws', transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('market_update', (data: MarketUpdate) => {
      const next: Record<string, number> = {};
      data.prices?.forEach((p) => (next[p.symbol] = p.price));
      setPrices((prev) => ({ ...prev, ...next }));
    });
    socket.on('trade_executed', () => {
      onTradeExecutedRef.current?.();
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  return { connected, prices, socket: socketRef.current };
}
