'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import StockSelector from '@/components/StockSelector';
import TradingChart from '@/components/TradingChart';
import Watchlist from '@/components/Watchlist';
import TradingBotComponent from '@/components/TradingBot';
import GridTradingBotComponent from '@/components/GridTradingBot';
import TradingSignalsComponent from '@/components/TradingSignals';
import { fetchStockPrice, StockPrice } from '@/services/stockApi';
import { useWebSocket, WebSocketMessage } from '@/services/websocket';

export default function Dashboard() {
  const [selectedStock, setSelectedStock] = useState<StockPrice | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isWatchlistOpen, setIsWatchlistOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch stock data
  const fetchStockData = useCallback(async (symbol: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const stockData = await fetchStockPrice(symbol);
      setSelectedStock(stockData);
    } catch (err) {
      setError('Failed to fetch stock data');
      console.error('Error fetching stock data:', err);
      // Set default data on error
      setSelectedStock({
        symbol: 'RELIANCE',
        name: 'Reliance Industries',
        price: 2456.78,
        change: 12.45,
        changePercent: 0.51,
        dayHigh: 2476.78,
        dayLow: 2436.78,
        volume: '12.5M',
        marketCap: '₹1.2T'
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load default stock on mount
  useEffect(() => {
    fetchStockData('RELIANCE');
  }, [fetchStockData]);

  // Set up WebSocket for real-time updates
  useWebSocket(selectedStock?.symbol || '', (message: WebSocketMessage) => {
    if (message.type === 'trade' && selectedStock) {
      const trade = message.data as { s: string; p: number; t: number; v: number };
      // Update stock price in real-time
      setSelectedStock(prev => {
        if (!prev || prev.symbol !== trade.s) return prev;
        const newPrice = trade.p;
        const change = newPrice - (prev.price - prev.change);
        const changePercent = (change / (prev.price - prev.change)) * 100;
        return {
          ...prev,
          price: newPrice,
          change,
          changePercent,
          dayHigh: Math.max(prev.dayHigh, newPrice),
          dayLow: Math.min(prev.dayLow, newPrice)
        };
      });
    }
  });

  const handleStockSelect = (stock: StockPrice) => {
    setSelectedStock(stock);
    fetchStockData(stock.symbol);
  };

  const handleWatchlistStockSelect = (stock: StockPrice) => {
    handleStockSelect(stock);
    setIsWatchlistOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      
      <div className="flex">
        {/* Sidebar - hidden on mobile, shown on desktop */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        
        {/* Mobile sidebar overlay */}
        {isSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div 
              className="fixed inset-0 bg-black/50" 
              onClick={() => setIsSidebarOpen(false)}
            />
            <div className="fixed left-0 top-0 h-full w-64">
              <Sidebar />
            </div>
          </div>
        )}
        
        {/* Main content */}
        <div className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Stock selector and price info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <StockSelector 
                selectedStock={selectedStock || undefined} 
                onStockSelect={handleStockSelect} 
              />
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setIsWatchlistOpen(true)}
                  className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <span>Watchlist</span>
                </button>
                
                {isLoading ? (
                  <div className="text-white">Loading...</div>
                ) : error ? (
                  <div className="text-red-500">{error}</div>
                ) : selectedStock ? (
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">
                      ₹{selectedStock.price.toFixed(2)}
                    </div>
                    <div className={`text-sm font-medium ${
                      selectedStock.change >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {selectedStock.change >= 0 ? '+' : ''}{selectedStock.change.toFixed(2)} 
                      ({selectedStock.change >= 0 ? '+' : ''}{selectedStock.changePercent.toFixed(2)}%)
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
            
            {/* Trading chart */}
            {selectedStock && (
              <TradingChart symbol={selectedStock.symbol} />
            )}

            {/* Trading Bot */}
            {selectedStock && (
              <TradingBotComponent symbol={selectedStock.symbol} />
            )}

            {/* Grid Trading Bot */}
            {selectedStock && (
              <GridTradingBotComponent 
                symbol={selectedStock.symbol} 
                currentPrice={selectedStock.price}
              />
            )}

            {/* Trading Signals */}
            {selectedStock && (
              <TradingSignalsComponent 
                symbol={selectedStock.symbol} 
                currentPrice={selectedStock.price}
              />
            )}
            
            {/* Quick stats */}
            {selectedStock && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                  <div className="text-sm text-slate-400 mb-1">Day High</div>
                  <div className="text-xl font-semibold text-white">
                    ₹{selectedStock.dayHigh.toFixed(2)}
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                  <div className="text-sm text-slate-400 mb-1">Day Low</div>
                  <div className="text-xl font-semibold text-white">
                    ₹{selectedStock.dayLow.toFixed(2)}
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                  <div className="text-sm text-slate-400 mb-1">Volume</div>
                  <div className="text-xl font-semibold text-white">{selectedStock.volume}</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                  <div className="text-sm text-slate-400 mb-1">Market Cap</div>
                  <div className="text-xl font-semibold text-white">{selectedStock.marketCap}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Watchlist */}
      <Watchlist 
        isOpen={isWatchlistOpen}
        onClose={() => setIsWatchlistOpen(false)}
        onStockSelect={handleWatchlistStockSelect}
      />
    </div>
  );
}
