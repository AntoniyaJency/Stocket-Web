'use client';

import { TrendingUp, Menu } from 'lucide-react';

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-slate-400 hover:text-white transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-6 h-6 text-green-500" />
          <h1 className="text-xl font-bold text-white">Stocket</h1>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="hidden sm:flex items-center space-x-2 text-sm">
          <span className="text-slate-400">Market Status:</span>
          <span className="text-green-500 font-medium">OPEN</span>
        </div>
        <div className="text-sm text-slate-400">
          {new Date().toLocaleString('en-US', { 
            weekday: 'short', 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
    </header>
  );
}
