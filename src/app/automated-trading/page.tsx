'use client';

import { useState, useEffect } from 'react';
import { Play, Pause, Plus, Trash2, Settings, TrendingUp, Activity, DollarSign, ChartBar as BarChart3, TriangleAlert as AlertTriangle, Shield } from 'lucide-react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';

interface TradingBot {
  id: string;
  name: string;
  symbol: string;
  status: 'active' | 'paused' | 'stopped';
  strategy: string;
  config: {
    initialCapital: number;
    maxPositionSize: number;
    stopLoss: number;
    takeProfit: number;
  };
  performance?: {
    totalTrades: number;
    winningTrades: number;
    totalProfit: number;
    winRate: number;
  };
}

interface Trade {
  id: string;
  botId: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  profit?: number;
  executedAt: string;
}

export default function AutomatedTradingPage() {
  const [bots, setBots] = useState<TradingBot[]>([]);
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [showCreateBot, setShowCreateBot] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [newBot, setNewBot] = useState({
    name: '',
    symbol: 'RELIANCE',
    strategy: 'RSI',
    initialCapital: 100000,
    maxPositionSize: 10,
    stopLoss: 2,
    takeProfit: 5
  });

  useEffect(() => {
    loadBots();
    loadRecentTrades();
  }, []);

  const loadBots = async () => {
    const mockBots: TradingBot[] = [
      {
        id: '1',
        name: 'RSI Strategy Bot',
        symbol: 'RELIANCE',
        status: 'stopped',
        strategy: 'RSI',
        config: {
          initialCapital: 100000,
          maxPositionSize: 10,
          stopLoss: 2,
          takeProfit: 5
        },
        performance: {
          totalTrades: 45,
          winningTrades: 32,
          totalProfit: 8500,
          winRate: 71.1
        }
      }
    ];
    setBots(mockBots);
  };

  const loadRecentTrades = async () => {
    const mockTrades: Trade[] = [
      {
        id: '1',
        botId: '1',
        symbol: 'RELIANCE',
        type: 'BUY',
        quantity: 10,
        price: 2456.78,
        executedAt: new Date().toISOString()
      }
    ];
    setRecentTrades(mockTrades);
  };

  const handleCreateBot = async () => {
    const bot: TradingBot = {
      id: Date.now().toString(),
      name: newBot.name,
      symbol: newBot.symbol,
      status: 'stopped',
      strategy: newBot.strategy,
      config: {
        initialCapital: newBot.initialCapital,
        maxPositionSize: newBot.maxPositionSize,
        stopLoss: newBot.stopLoss,
        takeProfit: newBot.takeProfit
      },
      performance: {
        totalTrades: 0,
        winningTrades: 0,
        totalProfit: 0,
        winRate: 0
      }
    };

    setBots([...bots, bot]);
    setShowCreateBot(false);
    setNewBot({
      name: '',
      symbol: 'RELIANCE',
      strategy: 'RSI',
      initialCapital: 100000,
      maxPositionSize: 10,
      stopLoss: 2,
      takeProfit: 5
    });
  };

  const handleToggleBot = (botId: string) => {
    setBots(bots.map(bot => {
      if (bot.id === botId) {
        return {
          ...bot,
          status: bot.status === 'active' ? 'stopped' : 'active'
        };
      }
      return bot;
    }));
  };

  const handleDeleteBot = (botId: string) => {
    if (confirm('Are you sure you want to delete this bot?')) {
      setBots(bots.filter(bot => bot.id !== botId));
    }
  };

  const totalProfit = bots.reduce((sum, bot) => sum + (bot.performance?.totalProfit || 0), 0);
  const totalTrades = bots.reduce((sum, bot) => sum + (bot.performance?.totalTrades || 0), 0);
  const activeBots = bots.filter(bot => bot.status === 'active').length;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />

      <div className="flex">
        <div className="hidden lg:block">
          <Sidebar />
        </div>

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

        <div className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">Automated Trading</h1>
                <p className="text-slate-400 mt-1">Manage your trading bots and strategies</p>
              </div>
              <button
                onClick={() => setShowCreateBot(true)}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create Bot</span>
              </button>
            </div>

            <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="text-red-500 text-lg mt-1" />
                <div>
                  <h4 className="text-red-400 font-semibold mb-2">EXTREME RISK WARNING</h4>
                  <div className="text-red-300 text-sm space-y-2">
                    <p><strong>Automated trading involves substantial risk of loss.</strong></p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>You could lose all your trading capital</li>
                      <li>Technical failures can cause unexpected losses</li>
                      <li>Market conditions can change instantly</li>
                      <li>This is for educational purposes only</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-slate-400 text-sm mb-1">
                  <Activity className="w-4 h-4" />
                  <span>Active Bots</span>
                </div>
                <div className="text-2xl font-bold text-white">{activeBots}</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-slate-400 text-sm mb-1">
                  <DollarSign className="w-4 h-4" />
                  <span>Total Profit</span>
                </div>
                <div className={`text-2xl font-bold ${
                  totalProfit >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {totalProfit >= 0 ? '+' : ''}₹{totalProfit.toLocaleString()}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-slate-400 text-sm mb-1">
                  <BarChart3 className="w-4 h-4" />
                  <span>Total Trades</span>
                </div>
                <div className="text-2xl font-bold text-white">{totalTrades}</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-slate-400 text-sm mb-1">
                  <TrendingUp className="w-4 h-4" />
                  <span>Total Bots</span>
                </div>
                <div className="text-2xl font-bold text-white">{bots.length}</div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Trading Bots</h3>

              {bots.length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No trading bots yet</p>
                  <p className="text-slate-500 text-sm mt-1">Create your first bot to start automated trading</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bots.map(bot => (
                    <div key={bot.id} className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Activity className={`w-5 h-5 ${
                            bot.status === 'active' ? 'text-green-500' : 'text-slate-400'
                          }`} />
                          <div>
                            <h4 className="font-semibold text-white">{bot.name}</h4>
                            <p className="text-sm text-slate-400">{bot.symbol} - {bot.strategy}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            bot.status === 'active'
                              ? 'bg-green-900 text-green-300'
                              : 'bg-slate-700 text-slate-300'
                          }`}>
                            {bot.status.toUpperCase()}
                          </span>
                          <button
                            onClick={() => handleToggleBot(bot.id)}
                            className={`p-2 rounded transition-colors ${
                              bot.status === 'active'
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-green-600 hover:bg-green-700'
                            }`}
                          >
                            {bot.status === 'active' ? (
                              <Pause className="w-4 h-4 text-white" />
                            ) : (
                              <Play className="w-4 h-4 text-white" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteBot(bot.id)}
                            className="p-2 bg-slate-700 hover:bg-slate-600 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      </div>

                      {bot.performance && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <div className="text-xs text-slate-400">Total Trades</div>
                            <div className="text-sm font-semibold text-white">{bot.performance.totalTrades}</div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-400">Win Rate</div>
                            <div className="text-sm font-semibold text-green-500">
                              {bot.performance.winRate.toFixed(1)}%
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-400">Total Profit</div>
                            <div className={`text-sm font-semibold ${
                              bot.performance.totalProfit >= 0 ? 'text-green-500' : 'text-red-500'
                            }`}>
                              {bot.performance.totalProfit >= 0 ? '+' : ''}₹{bot.performance.totalProfit.toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-400">Capital</div>
                            <div className="text-sm font-semibold text-white">
                              ₹{bot.config.initialCapital.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Trades</h3>

              {recentTrades.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart3 className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-400">No trades yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentTrades.map(trade => (
                    <div key={trade.id} className="flex items-center justify-between bg-slate-800 rounded p-3">
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          trade.type === 'BUY'
                            ? 'bg-green-900 text-green-300'
                            : 'bg-red-900 text-red-300'
                        }`}>
                          {trade.type}
                        </span>
                        <span className="text-white">{trade.symbol}</span>
                        <span className="text-slate-400 text-sm">
                          {trade.quantity} @ ₹{trade.price.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        {trade.profit !== undefined && (
                          <span className={`font-medium ${
                            trade.profit >= 0 ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {trade.profit >= 0 ? '+' : ''}₹{trade.profit.toFixed(0)}
                          </span>
                        )}
                        <span className="text-slate-500 text-xs">
                          {new Date(trade.executedAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showCreateBot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowCreateBot(false)} />
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 w-full max-w-md relative z-10">
            <h3 className="text-lg font-semibold text-white mb-4">Create Trading Bot</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Bot Name</label>
                <input
                  type="text"
                  value={newBot.name}
                  onChange={(e) => setNewBot({ ...newBot, name: e.target.value })}
                  className="w-full bg-slate-800 text-white px-3 py-2 rounded border border-slate-700"
                  placeholder="My Trading Bot"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Symbol</label>
                <select
                  value={newBot.symbol}
                  onChange={(e) => setNewBot({ ...newBot, symbol: e.target.value })}
                  className="w-full bg-slate-800 text-white px-3 py-2 rounded border border-slate-700"
                >
                  <option value="RELIANCE">RELIANCE</option>
                  <option value="TCS">TCS</option>
                  <option value="HDFCBANK">HDFCBANK</option>
                  <option value="INFY">INFY</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Strategy</label>
                <select
                  value={newBot.strategy}
                  onChange={(e) => setNewBot({ ...newBot, strategy: e.target.value })}
                  className="w-full bg-slate-800 text-white px-3 py-2 rounded border border-slate-700"
                >
                  <option value="RSI">RSI Strategy</option>
                  <option value="MA_CROSS">Moving Average Crossover</option>
                  <option value="BB">Bollinger Bands</option>
                  <option value="VOLUME">Volume Breakout</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Initial Capital (₹)</label>
                <input
                  type="number"
                  value={newBot.initialCapital}
                  onChange={(e) => setNewBot({ ...newBot, initialCapital: Number(e.target.value) })}
                  className="w-full bg-slate-800 text-white px-3 py-2 rounded border border-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Stop Loss (%)</label>
                  <input
                    type="number"
                    value={newBot.stopLoss}
                    onChange={(e) => setNewBot({ ...newBot, stopLoss: Number(e.target.value) })}
                    className="w-full bg-slate-800 text-white px-3 py-2 rounded border border-slate-700"
                    step="0.5"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Take Profit (%)</label>
                  <input
                    type="number"
                    value={newBot.takeProfit}
                    onChange={(e) => setNewBot({ ...newBot, takeProfit: Number(e.target.value) })}
                    className="w-full bg-slate-800 text-white px-3 py-2 rounded border border-slate-700"
                    step="0.5"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateBot(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateBot}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
                  disabled={!newBot.name}
                >
                  Create Bot
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
