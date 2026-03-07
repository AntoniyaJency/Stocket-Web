'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickSeries, CandlestickData } from 'lightweight-charts';
import { fetchHistoricalData, PriceData } from '@/services/stockApi';
import { useWebSocket, WebSocketMessage } from '@/services/websocket';

interface TradingChartProps {
  symbol: string;
  data?: PriceData[];
}

type Timeframe = '1' | '5' | '15' | '30' | '60' | 'D' | 'W' | 'M';

const TIMEFRAMES: { value: Timeframe; label: string }[] = [
  { value: '1', label: '1m' },
  { value: '5', label: '5m' },
  { value: '15', label: '15m' },
  { value: '30', label: '30m' },
  { value: '60', label: '1h' },
  { value: 'D', label: '1D' },
  { value: 'W', label: '1W' },
  { value: 'M', label: '1M' },
];

export default function TradingChart({ symbol, data = [] }: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const [chartData, setChartData] = useState<PriceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('D');

  // Fetch historical data
  const fetchChartData = useCallback(async (timeframe?: Timeframe) => {
    try {
      setIsLoading(true);
      setError(null);
      const tf = timeframe || selectedTimeframe;
      const historicalData = await fetchHistoricalData(symbol, tf);
      setChartData(historicalData);
    } catch (err) {
      setError('Failed to fetch chart data');
      console.error('Error fetching chart data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [symbol, selectedTimeframe]);

  // Fetch data when symbol or timeframe changes
  useEffect(() => {
    if (symbol) {
      fetchChartData();
    }
  }, [symbol, selectedTimeframe, fetchChartData]);

  const handleTimeframeChange = (timeframe: Timeframe) => {
    setSelectedTimeframe(timeframe);
  };
  useWebSocket(symbol, (message: WebSocketMessage) => {
    if (message.type === 'trade' && seriesRef.current) {
      const trade = message.data as { s: string; p: number; t: number; v: number };
      // Update the last candlestick with real-time data
      // This would need more sophisticated logic for proper real-time updates
      console.log('Real-time trade data:', trade);
    }
  });

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
    const dataToUse = data.length > 0 ? data : chartData;
    if (dataToUse.length > 0) {
      candlestickSeries.setData(dataToUse.map(item => ({
        time: item.time,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close
      })) as CandlestickData[]);
    }

    // Fit content
    chart.timeScale().fitContent();

    // Cleanup
    return () => {
      chart.remove();
    };
  }, [symbol, data, chartData]);

  // Update data when symbol changes
  useEffect(() => {
    if (seriesRef.current && chartData.length > 0) {
      seriesRef.current.setData(chartData.map(item => ({
        time: item.time,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close
      })) as CandlestickData[]);
    }
  }, [chartData]);

  return (
    <div className="relative bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">{symbol}</h3>
          <div className="flex items-center space-x-2">
            {TIMEFRAMES.map((timeframe) => (
              <button
                key={timeframe.value}
                onClick={() => handleTimeframeChange(timeframe.value)}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  selectedTimeframe === timeframe.value
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {timeframe.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="relative h-[400px]">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50">
            <div className="text-white">Loading chart data...</div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50">
            <div className="text-red-500">{error}</div>
          </div>
        )}
        <div ref={chartContainerRef} className="h-full" />
      </div>
    </div>
  );
}
