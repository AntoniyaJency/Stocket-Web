'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

const mockStocks: Stock[] = [
  { symbol: 'RELIANCE', name: 'Reliance Industries', price: 2456.78, change: 12.45, changePercent: 0.51 },
  { symbol: 'TCS', name: 'Tata Consultancy Services', price: 3567.89, change: -23.12, changePercent: -0.64 },
  { symbol: 'HDFCBANK', name: 'HDFC Bank', price: 1678.90, change: 8.76, changePercent: 0.52 },
  { symbol: 'INFY', name: 'Infosys', price: 1456.78, change: -15.34, changePercent: -1.04 },
  { symbol: 'ICICIBANK', name: 'ICICI Bank', price: 987.65, change: 5.43, changePercent: 0.55 },
];

interface StockSelectorProps {
  selectedStock: Stock;
  onStockSelect: (stock: Stock) => void;
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
          <div className="font-semibold text-white">{selectedStock.symbol}</div>
          <div className="text-xs text-slate-400">{selectedStock.name}</div>
        </div>
        <div className="text-right">
          <div className="font-semibold text-white">₹{selectedStock.price.toFixed(2)}</div>
          <div className={`text-xs font-medium ${
            selectedStock.change >= 0 ? 'text-green-500' : 'text-red-500'
          }`}>
            {selectedStock.change >= 0 ? '+' : ''}{selectedStock.changePercent.toFixed(2)}%
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${
          isOpen ? 'rotate-180' : ''
        }`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 max-h-[400px] overflow-y-auto">
          {mockStocks.map((stock) => (
            <button
              key={stock.symbol}
              onClick={() => {
                onStockSelect(stock);
                setIsOpen(false);
              }}
              className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-slate-700 transition-colors"
            >
              <div className="flex-1 text-left">
                <div className="font-semibold text-white">{stock.symbol}</div>
                <div className="text-xs text-slate-400">{stock.name}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-white">₹{stock.price.toFixed(2)}</div>
                <div className={`text-xs font-medium ${
                  stock.change >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
