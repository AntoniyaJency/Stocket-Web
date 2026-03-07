'use client';

import { useState, useEffect } from 'react';
import { Play, Pause, Settings, TrendingUp, Activity, DollarSign, BarChart3, Zap, Target } from 'lucide-react';
import { GridTradingBot, GridConfig, GridTrade, GridLevel } from '@/services/gridTradingBot';
import { fetchHistoricalData, PriceData } from '@/services/stockApi';

interface GridTradingBotProps {
  symbol: string;
  currentPrice: number;
}

export default function GridTradingBotComponent({ symbol, currentPrice }: GridTradingBotProps) {
  const [bot, setBot] = useState<GridTradingBot | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [gridLevels, setGridLevels] = useState<GridLevel[]>([]);
  const [trades, setTrades] = useState<GridTrade[]>([]);
  const [config, setConfig] = useState<GridConfig>({
    upperPrice: currentPrice * 1.1,
    lowerPrice: currentPrice * 0.9,
    gridCount: 10,
    totalAmount: 50000, // ₹50,000
    profitPerGrid: 1.0, // 1% profit per grid
    symbol
  });
  const [showConfig, setShowConfig] = useState(false);
  const [showBacktest, setShowBacktest] = useState(false);
  const [backtestResults, setBacktestResults] = useState<{
    totalProfit: number;
    profitPercent: number;
    totalTrades: number;
    winRate: number;
    maxDrawdown: number;
    sharpeRatio: number;
  } | null>(null);
  const [historicalData, setHistoricalData] = useState<PriceData[]>([]);

  useEffect(() => {
    const newBot = new GridTradingBot(config);
    
    newBot.onTrade((trade: GridTrade) => {
      setTrades(prev => [trade, ...prev].slice(0, 50));
    });

    newBot.onGridUpdate((levels: GridLevel[]) => {
      setGridLevels(levels);
    });

    // Update state in next tick to avoid cascading renders
    setTimeout(() => {
      setBot(newBot);
      setGridLevels(newBot.getGridLevels());
    }, 0);
  }, [config]);

  useEffect(() => {
    if (bot && currentPrice > 0) {
      bot.updatePrice(currentPrice);
    }
  }, [currentPrice, bot]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchHistoricalData(symbol, 'D');
        setHistoricalData(data);
      } catch (error) {
        console.error('Error fetching historical data:', error);
      }
    };
    fetchData();
  }, [symbol]);

  const handleStartStop = () => {
    if (!bot) return;

    if (isRunning) {
      bot.stop();
      setIsRunning(false);
    } else {
      bot.start();
      setIsRunning(true);
    }
  };

  const handleConfigChange = (newConfig: Partial<GridConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  const handleOptimizeGrid = () => {
    if (!bot || historicalData.length === 0) return;
    
    const optimizedConfig = bot.optimizeGrid(historicalData);
    setConfig(optimizedConfig);
  };

  const handleBacktest = () => {
    if (!bot || historicalData.length === 0) return;
    
    const results = bot.backtest(historicalData);
    setBacktestResults(results);
    setShowBacktest(true);
  };

  const stats = bot ? bot.getStatistics() : null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Zap className={`w-6 h-6 ${isRunning ? 'text-yellow-500' : 'text-slate-400'}`} />
          <h3 className="text-lg font-semibold text-white">Grid Trading Bot - {symbol}</h3>
          <span className="px-2 py-1 bg-blue-900 text-blue-300 text-xs rounded">PRO</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleBacktest}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
            title="Backtest Strategy"
          >
            <BarChart3 className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={handleOptimizeGrid}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
            title="Optimize Grid"
          >
            <Target className="w-4 h-4 text-white" />
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

      {/* Grid Visualization */}
      <div className="bg-slate-800 rounded p-4">
        <h4 className="text-sm font-medium text-slate-300 mb-3">Grid Levels</h4>
        <div className="relative h-32">
          {gridLevels.map((level, index) => (
            <div
              key={index}
              className={`absolute w-full h-1 flex items-center ${
                level.type === 'BUY' ? 'justify-start' : 'justify-end'
              }`}
              style={{
                top: `${((config.upperPrice - level.price) / (config.upperPrice - config.lowerPrice)) * 100}%`
              }}
            >
              <div
                className={`w-3 h-3 rounded-full ${
                  level.filled
                    ? level.type === 'BUY' ? 'bg-green-500' : 'bg-red-500'
                    : level.type === 'BUY' ? 'bg-green-900' : 'bg-red-900'
                }`}
              />
              <span className={`text-xs ml-2 ${
                level.type === 'BUY' ? 'text-green-400' : 'text-red-400'
              }`}>
                ₹{level.price.toFixed(2)}
              </span>
            </div>
          ))}
          {/* Current Price Line */}
          <div
            className="absolute w-full h-0.5 bg-blue-500"
            style={{
              top: `${((config.upperPrice - currentPrice) / (config.upperPrice - config.lowerPrice)) * 100}%`
            }}
          >
            <div className="absolute -right-2 -top-2 bg-blue-500 text-white text-xs px-1 rounded">
              ₹{currentPrice.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-800 rounded p-3">
            <div className="flex items-center space-x-2 text-slate-400 text-sm mb-1">
              <DollarSign className="w-4 h-4" />
              <span>Total Invested</span>
            </div>
            <div className="text-xl font-bold text-white">
              ₹{stats.totalInvested.toLocaleString('en-IN')}
            </div>
          </div>
          
          <div className="bg-slate-800 rounded p-3">
            <div className="flex items-center space-x-2 text-slate-400 text-sm mb-1">
              <TrendingUp className="w-4 h-4" />
              <span>Total Profit</span>
            </div>
            <div className={`text-xl font-bold ${
              stats.totalProfit >= 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {stats.totalProfit >= 0 ? '+' : ''}₹{stats.totalProfit.toLocaleString('en-IN')}
            </div>
          </div>

          <div className="bg-slate-800 rounded p-3">
            <div className="flex items-center space-x-2 text-slate-400 text-sm mb-1">
              <Activity className="w-4 h-4" />
              <span>Grids Filled</span>
            </div>
            <div className="text-xl font-bold text-white">
              {stats.filledGrids}/{stats.activeGrids}
            </div>
          </div>

          <div className="bg-slate-800 rounded p-3">
            <div className="flex items-center space-x-2 text-slate-400 text-sm mb-1">
              <BarChart3 className="w-4 h-4" />
              <span>Total Trades</span>
            </div>
            <div className="text-xl font-bold text-white">
              {stats.totalTrades}
            </div>
          </div>
        </div>
      )}

      {/* Configuration */}
      {showConfig && (
        <div className="bg-slate-800 rounded p-4 space-y-4">
          <h4 className="text-sm font-medium text-slate-300">Grid Configuration</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Upper Price (₹)</label>
              <input
                type="number"
                value={config.upperPrice}
                onChange={(e) => handleConfigChange({ upperPrice: Number(e.target.value) })}
                className="w-full bg-slate-700 text-white px-3 py-2 rounded text-sm"
                disabled={isRunning}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Lower Price (₹)</label>
              <input
                type="number"
                value={config.lowerPrice}
                onChange={(e) => handleConfigChange({ lowerPrice: Number(e.target.value) })}
                className="w-full bg-slate-700 text-white px-3 py-2 rounded text-sm"
                disabled={isRunning}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Grid Count</label>
              <input
                type="number"
                value={config.gridCount}
                onChange={(e) => handleConfigChange({ gridCount: Number(e.target.value) })}
                className="w-full bg-slate-700 text-white px-3 py-2 rounded text-sm"
                disabled={isRunning}
                min="2"
                max="50"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Total Amount (₹)</label>
              <input
                type="number"
                value={config.totalAmount}
                onChange={(e) => handleConfigChange({ totalAmount: Number(e.target.value) })}
                className="w-full bg-slate-700 text-white px-3 py-2 rounded text-sm"
                disabled={isRunning}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Profit Per Grid (%)</label>
              <input
                type="number"
                value={config.profitPerGrid}
                onChange={(e) => handleConfigChange({ profitPerGrid: Number(e.target.value) })}
                className="w-full bg-slate-700 text-white px-3 py-2 rounded text-sm"
                disabled={isRunning}
                step="0.1"
                min="0.1"
              />
            </div>
          </div>
        </div>
      )}

      {/* Backtest Results */}
      {showBacktest && backtestResults && (
        <div className="bg-slate-800 rounded p-4 space-y-4">
          <h4 className="text-sm font-medium text-slate-300">Backtest Results (30 Days)</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-slate-400">Total Return</div>
              <div className={`text-lg font-bold ${
                backtestResults.profitPercent >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {backtestResults.profitPercent.toFixed(2)}%
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Win Rate</div>
              <div className="text-lg font-bold text-white">{backtestResults.winRate.toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Max Drawdown</div>
              <div className="text-lg font-bold text-red-500">{backtestResults.maxDrawdown.toFixed(2)}%</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Sharpe Ratio</div>
              <div className="text-lg font-bold text-white">{backtestResults.sharpeRatio.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Total Trades</div>
              <div className="text-lg font-bold text-white">{backtestResults.totalTrades}</div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Trades */}
      {trades.length > 0 && (
        <div className="bg-slate-800 rounded p-4">
          <h4 className="text-sm font-medium text-slate-300 mb-3">Recent Trades</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
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
                  <span className="text-white">{trade.quantity.toFixed(3)} @ ₹{trade.price.toFixed(2)}</span>
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

      {/* Premium Features Banner */}
      <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-700 rounded p-4">
        <div className="flex items-start space-x-2">
          <Zap className="text-blue-400 text-sm" />
          <div>
            <div className="text-blue-400 text-sm font-medium">Premium Grid Trading Features</div>
            <div className="text-blue-600 text-xs mt-1">
              Advanced optimization, multiple strategies, and real-time alerts available in Pro plan.
              <button className="ml-2 text-blue-400 hover:text-blue-300 underline">
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
