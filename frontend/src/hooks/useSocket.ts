import { useEffect, useState, useRef } from 'react';
import { getSocket, subscribeSocket } from '../services/socket';

export interface UseSocketOptions {
  onTradeExecuted?: () => void;
}

export function useSocket(options?: UseSocketOptions) {
  const [connected, setConnected] = useState(false);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [previousPrices, setPreviousPrices] = useState<Record<string, number>>({});
  const onTradeExecutedRef = useRef(options?.onTradeExecuted);
  onTradeExecutedRef.current = options?.onTradeExecuted;

  useEffect(() => {
    const cleanup = subscribeSocket({
      onConnect: () => setConnected(true),
      onDisconnect: () => setConnected(false),
      onMarketUpdate: (data) => {
        setPrices((prev) => {
          setPreviousPrices((prevPrev) => ({ ...prevPrev, [data.symbol]: prev[data.symbol] ?? data.price }));
          return { ...prev, [data.symbol]: data.price };
        });
      },
      onTradeExecuted: () => {
        onTradeExecutedRef.current?.();
      },
    });

    const socket = getSocket();
    if (socket.connected) setConnected(true);

    return () => {
      cleanup();
    };
  }, []);

  return { connected, prices, previousPrices, socket: getSocket() };
}
