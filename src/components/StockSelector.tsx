'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { StockPrice, POPULAR_STOCKS } from '@/services/stockApi';

interface StockSelectorProps {
  selectedStock?: StockPrice;
  onStockSelect: (stock: StockPrice) => void;
}

export default function StockSelector({ selectedStock, onStockSelect }: StockSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg transition-colors min-w-[300px]"
      >
        <div className="flex-1 text-left">
          <div className="font-semibold text-white">
            {selectedStock ? selectedStock.symbol : 'Select a stock'}
          </div>
          <div className="text-xs text-slate-400">
            {selectedStock ? selectedStock.name : 'Choose from popular stocks'}
          </div>
        </div>
        {selectedStock && (
          <div className="text-right">
            <div className="font-semibold text-white">₹{selectedStock.price.toFixed(2)}</div>
            <div className={`text-xs font-medium ${
              selectedStock.change >= 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {selectedStock.change >= 0 ? '+' : ''}{selectedStock.changePercent.toFixed(2)}%
            </div>
          </div>
        )}
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${
          isOpen ? 'rotate-180' : ''
        }`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 max-h-[400px] overflow-y-auto">
          {POPULAR_STOCKS.map((stock) => (
            <button
              key={stock.symbol}
              onClick={() => {
                // Create a StockPrice object with default values
                const stockPrice: StockPrice = {
                  ...stock,
                  price: 0, // Will be updated when data is fetched
                  change: 0,
                  changePercent: 0,
                  dayHigh: 0,
                  dayLow: 0,
                  volume: 'N/A',
                  marketCap: 'N/A'
                };
                onStockSelect(stockPrice);
                setIsOpen(false);
              }}
              className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-slate-700 transition-colors"
            >
              <div className="flex-1 text-left">
                <div className="font-semibold text-white">{stock.symbol}</div>
                <div className="text-xs text-slate-400">{stock.name}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
