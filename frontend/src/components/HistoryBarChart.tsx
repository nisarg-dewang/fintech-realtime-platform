import { useEffect, useRef, useCallback, useState } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  BarSeries,
  ColorType,
} from 'lightweight-charts';
import { marketApi, CandlePoint } from '../services/api';

interface HistoryBarChartProps {
  symbol: string;
  height?: number;
}

type Time = import('lightweight-charts').Time;

function toBarPoint(data: CandlePoint): { time: Time; open: number; high: number; low: number; close: number } {
  return {
    time: data.time as unknown as Time,
    open: data.open,
    high: data.high,
    low: data.low,
    close: data.close,
  };
}

export default function HistoryBarChart({ symbol, height = 280 }: HistoryBarChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Bar'> | null>(null);
  const [empty, setEmpty] = useState(false);

  const loadHistory = useCallback(async (sym: string) => {
    const to = Math.floor(Date.now() / 1000);
    const from = to - 7 * 24 * 60 * 60;
    const candles = await marketApi.getHistory(sym, from, to, 'D');
    return candles.map(toBarPoint);
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

    const barSeries = chart.addSeries(BarSeries, {
      upColor: '#10b981',
      downColor: '#ef4444',
    });

    chartRef.current = chart;
    seriesRef.current = barSeries;

    loadHistory(symbol).then((data) => {
      setEmpty(data.length === 0);
      if (data.length) barSeries.setData(data);
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
          No data for last 7 days
        </div>
      )}
    </div>
  );
}
