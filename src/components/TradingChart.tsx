'use client';

import { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, Time, CandlestickSeries } from 'lightweight-charts';

interface PriceData {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface TradingChartProps {
  symbol: string;
  data?: PriceData[];
}

export default function TradingChart({ symbol, data = [] }: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  // Generate mock data if no data provided
  const generateMockData = (): PriceData[] => {
    const mockData: PriceData[] = [];
    const basePrice = 2500;
    let currentPrice = basePrice;
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const timestamp = (date.getTime() / 1000) as Time;
      
      const volatility = 0.02;
      const change = (Math.random() - 0.5) * volatility * currentPrice;
      const open = currentPrice;
      const close = currentPrice + change;
      const high = Math.max(open, close) + Math.random() * 10;
      const low = Math.min(open, close) - Math.random() * 10;
      
      mockData.push({
        time: timestamp,
        open,
        high,
        low,
        close
      });
      
      currentPrice = close;
    }
    
    return mockData;
  };

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: '#94a3b8',
      },
      grid: {
        vertLines: { color: '#1e293b' },
        horzLines: { color: '#1e293b' },
      },
      crosshair: {
        mode: 1,
      },
      timeScale: {
        borderColor: '#334155',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: '#334155',
        textColor: '#94a3b8',
      },
    });

    // Add candlestick series
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

    // Set data
    const chartData = data.length > 0 ? data : generateMockData();
    candlestickSeries.setData(chartData);

    // Fit content
    chart.timeScale().fitContent();

    // Cleanup
    return () => {
      chart.remove();
    };
  }, [symbol, data]);

  // Update data when symbol changes
  useEffect(() => {
    if (seriesRef.current && data.length === 0) {
      const newData = generateMockData();
      seriesRef.current.setData(newData);
    }
  }, [symbol, data]);

  return (
    <div className="relative bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">{symbol}</h3>
          <div className="flex items-center space-x-4 text-sm">
            <span className="text-slate-400">1D</span>
            <span className="text-green-500">1W</span>
            <span className="text-slate-400">1M</span>
            <span className="text-slate-400">3M</span>
            <span className="text-slate-400">1Y</span>
            <span className="text-slate-400">ALL</span>
          </div>
        </div>
      </div>
      <div ref={chartContainerRef} className="h-[400px]" />
    </div>
  );
}
