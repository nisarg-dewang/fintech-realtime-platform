import { useEffect, useRef, useCallback, useState } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  CandlestickSeries,
  ColorType,
} from 'lightweight-charts';
import { marketApi, CandlePoint } from '../services/api';

interface TradingChartProps {
  symbol: string;
  height?: number;
}

function toCandle(data: CandlePoint): CandlestickData {
  return {
    time: data.time as unknown as import('lightweight-charts').Time,
    open: data.open,
    high: data.high,
    low: data.low,
    close: data.close,
  };
}

export default function TradingChart({ symbol, height = 360 }: TradingChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const [empty, setEmpty] = useState(false);

  const loadHistory = useCallback(async (sym: string) => {
    const to = Math.floor(Date.now() / 1000);
    // Request last 5 days so we include full US trading days (9:30–16:00 ET); 24h often has no candles on weekends
    const from = to - 5 * 24 * 60 * 60;
    const candles = await marketApi.getHistory(sym, from, to);
    return candles.map(toCandle);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#111827' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: '#1f2937' },
        horzLines: { color: '#1f2937' },
      },
      width: containerRef.current.clientWidth,
      height,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: '#374151',
      },
      rightPriceScale: {
        borderColor: '#374151',
        scaleMargins: { top: 0.1, bottom: 0.2 },
      },
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#ef4444',
      borderDownColor: '#ef4444',
      borderUpColor: '#10b981',
      wickDownColor: '#ef4444',
      wickUpColor: '#10b981',
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    loadHistory(symbol).then((data) => {
      setEmpty(data.length === 0);
      if (data.length) candlestickSeries.setData(data);
    });

    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current) return;
    setEmpty(false);
    loadHistory(symbol).then((data) => {
      setEmpty(data.length === 0);
      if (data.length) seriesRef.current!.setData(data);
    });
  }, [symbol, loadHistory]);

  return (
    <div className="relative w-full" style={{ height }}>
      <div ref={containerRef} className="w-full h-full rounded-xl overflow-hidden" />
      {empty && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800/80 rounded-xl text-gray-400 text-sm">
          No chart data for this period. Ensure FINNHUB_API_KEY is set and try again during market hours.
        </div>
      )}
    </div>
  );
}
