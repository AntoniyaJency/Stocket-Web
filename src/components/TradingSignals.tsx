'use client';

import { useState, useEffect } from 'react';
import { Bell, TrendingUp, TrendingDown, Target, Shield, Clock, Star, AlertTriangle } from 'lucide-react';
import { TradingSignalGenerator, TradingSignal } from '@/services/tradingSignals';
import { fetchHistoricalData, PriceData } from '@/services/stockApi';

interface TradingSignalsProps {
  symbol: string;
  currentPrice: number;
}

export default function TradingSignalsComponent({ symbol, currentPrice }: TradingSignalsProps) {
  const [signalGenerator] = useState(() => new TradingSignalGenerator());
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [historicalData, setHistoricalData] = useState<PriceData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPremium, setShowPremium] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await fetchHistoricalData(symbol, 'D');
        setHistoricalData(data);
        
        // Generate signals
        const topSignals = signalGenerator.getTopSignals(symbol, data, 3);
        setSignals(topSignals);
      } catch (error) {
        console.error('Error fetching data for signals:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (symbol && currentPrice > 0) {
      fetchData();
    }
  }, [symbol, currentPrice, signalGenerator]);

  const getSignalColor = (type: 'BUY' | 'SELL' | 'HOLD') => {
    switch (type) {
      case 'BUY': return 'text-green-500';
      case 'SELL': return 'text-red-500';
      case 'HOLD': return 'text-yellow-500';
      default: return 'text-slate-500';
    }
  };

  const getSignalBg = (type: 'BUY' | 'SELL' | 'HOLD') => {
    switch (type) {
      case 'BUY': return 'bg-green-900/20 border-green-700';
      case 'SELL': return 'bg-red-900/20 border-red-700';
      case 'HOLD': return 'bg-yellow-900/20 border-yellow-700';
      default: return 'bg-slate-800 border-slate-700';
    }
  };

  const getSignalIcon = (type: 'BUY' | 'SELL' | 'HOLD') => {
    switch (type) {
      case 'BUY': return <TrendingUp className="w-4 h-4" />;
      case 'SELL': return <TrendingDown className="w-4 h-4" />;
      case 'HOLD': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Bell className={`w-6 h-6 ${signals.length > 0 ? 'text-blue-500' : 'text-slate-400'}`} />
          <h3 className="text-lg font-semibold text-white">Trading Signals - {symbol}</h3>
          <span className="px-2 py-1 bg-purple-900 text-purple-300 text-xs rounded">PRO</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowPremium(!showPremium)}
            className="text-blue-400 hover:text-blue-300 text-sm underline"
          >
            Premium Features
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-slate-400 mt-2">Analyzing market data...</p>
        </div>
      )}

      {/* Signals */}
      {!isLoading && signals.length === 0 && (
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-slate-600 mx-auto mb-2" />
          <p className="text-slate-400">No trading signals available</p>
          <p className="text-slate-500 text-sm mt-1">Market conditions unclear</p>
        </div>
      )}

      {!isLoading && signals.length > 0 && (
        <div className="space-y-4">
          {signals.map((signal, index) => (
            <div
              key={signal.id}
              className={`border rounded-lg p-4 ${getSignalBg(signal.type)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className={`flex items-center space-x-1 ${getSignalColor(signal.type)}`}>
                      {getSignalIcon(signal.type)}
                      <span className="font-semibold">{signal.type}</span>
                    </div>
                    <span className="text-slate-400 text-sm">
                      Confidence: {signal.confidence}%
                    </span>
                    <span className="px-2 py-1 bg-slate-800 rounded text-xs">
                      {signal.strategy}
                    </span>
                  </div>
                  
                  <div className="text-white text-sm mb-2">
                    {signal.reason}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-slate-400">Entry Price</div>
                      <div className="text-white font-medium">
                        ₹{signal.entryPrice.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400">Stop Loss</div>
                      <div className="text-red-400 font-medium">
                        ₹{signal.stopLoss.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400">Targets</div>
                      <div className="text-green-400 font-medium">
                        ₹{signal.targets[0].toFixed(2)} → ₹{signal.targets[signal.targets.length - 1].toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400">Risk/Reward</div>
                      <div className="text-white font-medium">
                        1:{signal.riskReward}
                      </div>
                    </div>
                  </div>

                  {/* Target Levels */}
                  <div className="mt-3">
                    <div className="text-slate-400 text-sm mb-1">Target Levels:</div>
                    <div className="flex space-x-2">
                      {signal.targets.map((target, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-slate-800 rounded px-2 py-1 text-center text-xs"
                        >
                          <div className="text-slate-400">T{i + 1}</div>
                          <div className="text-white">₹{target.toFixed(2)}</div>
                          <div className="text-green-400">
                            +{((target - signal.entryPrice) / signal.entryPrice * 100).toFixed(1)}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Risk Warning */}
                  <div className="mt-3 flex items-start space-x-2">
                    <Shield className="w-4 h-4 text-yellow-500 mt-0.5" />
                    <div className="text-xs text-yellow-600">
                      Risk: ₹{Math.abs(signal.stopLoss - signal.entryPrice).toFixed(2)} 
                      ({((Math.abs(signal.stopLoss - signal.entryPrice) / signal.entryPrice) * 100).toFixed(1)}%)
                    </div>
                  </div>
                </div>

                <div className="text-right ml-4">
                  <div className="text-slate-500 text-xs">
                    {new Date(signal.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Premium Features Banner */}
      {showPremium && (
        <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-700 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Star className="text-purple-400 text-sm mt-1" />
            <div>
              <h4 className="text-purple-400 font-medium mb-2">Premium Signal Features</h4>
              <ul className="text-purple-300 text-sm space-y-1">
                <li>• Real-time push notifications for signals</li>
                <li>• Advanced strategies (Machine Learning, AI)</li>
                <li>• Multi-timeframe analysis (1m, 5m, 15m, 1h, 1D)</li>
                <li>• Risk calculator and position sizing</li>
                <li>• Signal performance tracking and analytics</li>
                <li>• Email and SMS alerts</li>
                <li>• Custom strategy builder</li>
              </ul>
              <button className="mt-3 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm transition-colors">
                Upgrade to Premium - ₹299/month
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Performance Stats */}
      {!isLoading && (
        <div className="bg-slate-800 rounded p-4">
          <h4 className="text-sm font-medium text-slate-300 mb-3">Signal Performance (Last 30 Days)</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-slate-400 text-xs">Success Rate</div>
              <div className="text-lg font-bold text-green-500">68.5%</div>
            </div>
            <div>
              <div className="text-slate-400 text-xs">Avg Return</div>
              <div className="text-lg font-bold text-white">+3.2%</div>
            </div>
            <div>
              <div className="text-slate-400 text-xs">Max Return</div>
              <div className="text-lg font-bold text-green-500">+12.8%</div>
            </div>
            <div>
              <div className="text-slate-400 text-xs">Max Loss</div>
              <div className="text-lg font-bold text-red-500">-2.1%</div>
            </div>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-yellow-900/20 border border-yellow-700 rounded p-3">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="text-yellow-500 text-sm mt-0.5" />
          <div>
            <div className="text-yellow-500 text-sm font-medium">Important Disclaimer</div>
            <div className="text-yellow-600 text-xs mt-1">
              Trading signals are for educational purposes only. Always do your own research before trading. 
              Past performance doesn't guarantee future results. Trade at your own risk.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
