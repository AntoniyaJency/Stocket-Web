'use client';

import { useState, useEffect } from 'react';
import { X, Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { StockPrice, POPULAR_STOCKS } from '@/services/stockApi';

interface WatchlistItem extends StockPrice {
  lastUpdate: number;
}

interface WatchlistProps {
  isOpen: boolean;
  onClose: () => void;
  onStockSelect: (stock: StockPrice) => void;
}

export default function Watchlist({ isOpen, onClose, onStockSelect }: WatchlistProps) {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(() => {
    if (typeof window !== 'undefined') {
      const savedWatchlist = localStorage.getItem('watchlist');
      if (savedWatchlist) {
        try {
          return JSON.parse(savedWatchlist);
        } catch (error) {
          console.error('Error parsing watchlist:', error);
        }
      }
    }
    return [];
  });
  const [showAddStock, setShowAddStock] = useState(false);

  // Save watchlist to localStorage whenever it changes
  useEffect(() => {
    if (watchlist.length > 0) {
      localStorage.setItem('watchlist', JSON.stringify(watchlist));
    }
  }, [watchlist]);

  // Simulate real-time updates (replace with actual WebSocket later)
  useEffect(() => {
    const interval = setInterval(() => {
      setWatchlist(prev => prev.map(item => {
        // Simulate small price changes
        const priceChange = (Math.random() - 0.5) * 2;
        const newPrice = item.price + priceChange;
        const change = newPrice - (item.price - item.change);
        const changePercent = (change / (item.price - item.change)) * 100;
        
        return {
          ...item,
          price: newPrice,
          change,
          changePercent,
          lastUpdate: Date.now()
        };
      }));
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const addStock = (stock: StockPrice) => {
    const exists = watchlist.find(item => item.symbol === stock.symbol);
    if (!exists) {
      setWatchlist(prev => {
        const now = Date.now();
        const watchlistItem: WatchlistItem = {
          ...stock,
          lastUpdate: now
        };
        return [...prev, watchlistItem];
      });
    }
    setShowAddStock(false);
  };

  const removeStock = (symbol: string) => {
    setWatchlist(prev => prev.filter(item => item.symbol !== symbol));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 h-full w-80 bg-slate-900 border-l border-slate-800">
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Watchlist</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4">
          {!showAddStock ? (
            <button
              onClick={() => setShowAddStock(true)}
              className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Stock</span>
            </button>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-300">Select Stock</h3>
                <button
                  onClick={() => setShowAddStock(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-1">
                {POPULAR_STOCKS.map(stock => (
                  <button
                    key={stock.symbol}
                    onClick={() => addStock({
                      ...stock,
                      price: 0,
                      change: 0,
                      changePercent: 0,
                      dayHigh: 0,
                      dayLow: 0,
                      volume: 'N/A',
                      marketCap: 'N/A'
                    })}
                    className="w-full text-left px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
                  >
                    <div className="font-medium text-white">{stock.symbol}</div>
                    <div className="text-xs text-slate-400">{stock.name}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {watchlist.length === 0 ? (
            <div className="p-4 text-center text-slate-400">
              No stocks in watchlist. Add some to track their prices.
            </div>
          ) : (
            <div className="space-y-1">
              {watchlist.map(stock => (
                <div
                  key={stock.symbol}
                  className="flex items-center justify-between p-3 hover:bg-slate-800 transition-colors cursor-pointer"
                  onClick={() => {
                    onStockSelect(stock);
                    onClose();
                  }}
                >
                  <div className="flex-1">
                    <div className="font-medium text-white">{stock.symbol}</div>
                    <div className="text-xs text-slate-400">{stock.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-white">₹{stock.price.toFixed(2)}</div>
                    <div className={`flex items-center justify-end text-xs ${
                      stock.change >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {stock.change >= 0 ? (
                        <TrendingUp className="w-3 h-3 mr-1" />
                      ) : (
                        <TrendingDown className="w-3 h-3 mr-1" />
                      )}
                      {stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeStock(stock.symbol);
                    }}
                    className="ml-2 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
