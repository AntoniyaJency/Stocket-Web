'use client';

import { useState, useEffect } from 'react';
import { Play, Pause, Settings, TrendingUp, Activity, DollarSign, BarChart3 } from 'lucide-react';
import { TradingBot, Trade, Portfolio, TradeSignal, BotConfig } from '@/services/tradingBot';
import { fetchHistoricalData } from '@/services/stockApi';

interface TradingBotProps {
  symbol: string;
}

export default function TradingBotComponent({ symbol }: TradingBotProps) {
  const [bot, setBot] = useState<TradingBot>(() => new TradingBot());
  const [isRunning, setIsRunning] = useState(false);
  const [portfolio, setPortfolio] = useState<Portfolio>(() => bot.getPortfolio());
  const [trades, setTrades] = useState<Trade[]>([]);
  const [lastSignal, setLastSignal] = useState<TradeSignal | null>(null);
  const [config, setConfig] = useState<BotConfig>(() => bot.getConfig());
  const [showConfig, setShowConfig] = useState(false);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    const newBot = new TradingBot(config);
    
    // Set up callbacks
    newBot.onTrade((trade: Trade) => {
      setTrades(prev => [trade, ...prev].slice(0, 50)); // Keep last 50 trades
    });

    newBot.onSignal((signal: TradeSignal) => {
      setLastSignal(signal);
    });

    // Update state in next tick to avoid cascading renders
    setTimeout(() => {
      setBot(newBot);
      setPortfolio(newBot.getPortfolio());
    }, 0);
  }, [config]);

  useEffect(() => {
    if (!symbol) return;

    // Fetch historical data for analysis
    const fetchData = async () => {
      try {
        const data = await fetchHistoricalData(symbol, 'D');
        
        // Generate signal if bot is running
        if (isRunning && data.length > 0) {
          const signal = bot.generateSignal(symbol, data);
          const currentPrice = data[data.length - 1].close;
          bot.executeSignal(symbol, signal, currentPrice);
          
          // Update portfolio
          const priceMap = new Map<string, number>();
          priceMap.set(symbol, currentPrice);
          bot.updatePortfolio(priceMap);
          setPortfolio(bot.getPortfolio());
        }
      } catch (error) {
        console.error('Error fetching data for bot:', error);
      }
    };

    fetchData();
    
    // Update every 30 seconds
    const interval = setInterval(fetchData, 30000);
    
    return () => clearInterval(interval);
  }, [symbol, isRunning, bot]);

  const handleStartStop = () => {
    if (isRunning) {
      bot.stop();
      setIsRunning(false);
    } else {
      bot.start();
      setIsRunning(true);
    }
  };

  const handleConfigChange = (newConfig: Partial<BotConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  const stats = bot.getStatistics();

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Activity className={`w-6 h-6 ${isRunning ? 'text-green-500' : 'text-slate-400'}`} />
          <h3 className="text-lg font-semibold text-white">Trading Bot - {symbol}</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowStats(!showStats)}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
          >
            <BarChart3 className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
          >
            <Settings className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={handleStartStop}
            className={`flex items-center space-x-2 px-4 py-2 rounded transition-colors ${
              isRunning 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Stop</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Start</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded p-3">
          <div className="flex items-center space-x-2 text-slate-400 text-sm mb-1">
            <DollarSign className="w-4 h-4" />
            <span>Total Value</span>
          </div>
          <div className="text-xl font-bold text-white">
            ₹{portfolio.totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
        </div>
        
        <div className="bg-slate-800 rounded p-3">
          <div className="flex items-center space-x-2 text-slate-400 text-sm mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>Total Profit</span>
          </div>
          <div className={`text-xl font-bold ${
            portfolio.totalProfit >= 0 ? 'text-green-500' : 'text-red-500'
          }`}>
            {portfolio.totalProfit >= 0 ? '+' : ''}₹{portfolio.totalProfit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
        </div>

        <div className="bg-slate-800 rounded p-3">
          <div className="flex items-center space-x-2 text-slate-400 text-sm mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>Return %</span>
          </div>
          <div className={`text-xl font-bold ${
            portfolio.totalProfitPercent >= 0 ? 'text-green-500' : 'text-red-500'
          }`}>
            {portfolio.totalProfitPercent >= 0 ? '+' : ''}{portfolio.totalProfitPercent.toFixed(2)}%
          </div>
        </div>

        <div className="bg-slate-800 rounded p-3">
          <div className="flex items-center space-x-2 text-slate-400 text-sm mb-1">
            <Activity className="w-4 h-4" />
            <span>Positions</span>
          </div>
          <div className="text-xl font-bold text-white">
            {portfolio.positions.length}
          </div>
        </div>
      </div>

      {/* Last Signal */}
      {lastSignal && (
        <div className="bg-slate-800 rounded p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-slate-300">Last Signal</h4>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              lastSignal.type === 'BUY' 
                ? 'bg-green-900 text-green-300' 
                : lastSignal.type === 'SELL'
                ? 'bg-red-900 text-red-300'
                : 'bg-slate-700 text-slate-300'
            }`}>
              {lastSignal.type}
            </span>
          </div>
          <div className="text-sm text-slate-400 mb-1">{lastSignal.reason}</div>
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Confidence: {lastSignal.confidence.toFixed(0)}%
            </div>
            <div className="text-xs text-slate-500">
              {new Date(lastSignal.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}

      {/* Configuration */}
      {showConfig && (
        <div className="bg-slate-800 rounded p-4 space-y-4">
          <h4 className="text-sm font-medium text-slate-300">Bot Configuration</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Initial Capital</label>
              <input
                type="number"
                value={config.initialCapital}
                onChange={(e) => handleConfigChange({ initialCapital: Number(e.target.value) })}
                className="w-full bg-slate-700 text-white px-3 py-2 rounded text-sm"
                disabled={isRunning}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Max Position Size (%)</label>
              <input
                type="number"
                value={config.maxPositionSize}
                onChange={(e) => handleConfigChange({ maxPositionSize: Number(e.target.value) })}
                className="w-full bg-slate-700 text-white px-3 py-2 rounded text-sm"
                disabled={isRunning}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Stop Loss (%)</label>
              <input
                type="number"
                value={config.stopLoss}
                onChange={(e) => handleConfigChange({ stopLoss: Number(e.target.value) })}
                className="w-full bg-slate-700 text-white px-3 py-2 rounded text-sm"
                disabled={isRunning}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Take Profit (%)</label>
              <input
                type="number"
                value={config.takeProfit}
                onChange={(e) => handleConfigChange({ takeProfit: Number(e.target.value) })}
                className="w-full bg-slate-700 text-white px-3 py-2 rounded text-sm"
                disabled={isRunning}
              />
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}
      {showStats && (
        <div className="bg-slate-800 rounded p-4 space-y-4">
          <h4 className="text-sm font-medium text-slate-300">Performance Statistics</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-slate-400">Total Trades</div>
              <div className="text-lg font-bold text-white">{stats.totalTrades}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Win Rate</div>
              <div className="text-lg font-bold text-green-500">{stats.winRate.toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Profit Factor</div>
              <div className="text-lg font-bold text-white">{stats.profitFactor.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Avg Win</div>
              <div className="text-lg font-bold text-green-500">+₹{stats.avgProfit.toFixed(0)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Avg Loss</div>
              <div className="text-lg font-bold text-red-500">₹{stats.avgLoss.toFixed(0)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Winning Trades</div>
              <div className="text-lg font-bold text-green-500">{stats.winningTrades}</div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Trades */}
      {trades.length > 0 && (
        <div className="bg-slate-800 rounded p-4">
          <h4 className="text-sm font-medium text-slate-300 mb-3">Recent Trades</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {trades.slice(0, 10).map(trade => (
              <div key={trade.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    trade.type === 'BUY' 
                      ? 'bg-green-900 text-green-300' 
                      : 'bg-red-900 text-red-300'
                  }`}>
                    {trade.type}
                  </span>
                  <span className="text-white">{trade.quantity} @ ₹{trade.price.toFixed(2)}</span>
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
                    {new Date(trade.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Risk Warning */}
      <div className="bg-yellow-900/20 border border-yellow-700 rounded p-3">
        <div className="flex items-start space-x-2">
          <div className="text-yellow-500 text-sm">
            ⚠️ <strong>EDUCATIONAL PURPOSE ONLY</strong>
          </div>
        </div>
        <div className="text-xs text-yellow-600 mt-1">
          This is a simulation bot for learning. Do not use real money. Trading involves substantial risk of loss.
        </div>
      </div>
    </div>
  );
}
