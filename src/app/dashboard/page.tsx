'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import StockSelector from '@/components/StockSelector';
import TradingChart from '@/components/TradingChart';

interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

const defaultStock: Stock = {
  symbol: 'RELIANCE',
  name: 'Reliance Industries',
  price: 2456.78,
  change: 12.45,
  changePercent: 0.51
};

export default function Dashboard() {
  const [selectedStock, setSelectedStock] = useState(defaultStock);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
                selectedStock={selectedStock} 
                onStockSelect={setSelectedStock} 
              />
              
              <div className="flex items-center space-x-6">
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
              </div>
            </div>
            
            {/* Trading chart */}
            <TradingChart symbol={selectedStock.symbol} />
            
            {/* Quick stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">Day High</div>
                <div className="text-xl font-semibold text-white">
                  ₹{(selectedStock.price + 20).toFixed(2)}
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">Day Low</div>
                <div className="text-xl font-semibold text-white">
                  ₹{(selectedStock.price - 20).toFixed(2)}
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">Volume</div>
                <div className="text-xl font-semibold text-white">12.5M</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">Market Cap</div>
                <div className="text-xl font-semibold text-white">₹1.2T</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
