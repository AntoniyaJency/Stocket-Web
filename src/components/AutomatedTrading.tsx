'use client';

import { useState, useEffect } from 'react';
import { Play, Pause, AlertTriangle, Shield, Power, Activity, DollarSign, TrendingUp, Settings } from 'lucide-react';
import { AutomatedTradingEngine, BrokerCredentials, createAutomatedTrader } from '@/services/brokerIntegration';

interface AutomatedTradingProps {
  symbol: string;
  currentPrice: number;
}

export default function AutomatedTradingComponent({ symbol, currentPrice }: AutomatedTradingProps) {
  const [tradingEngine, setTradingEngine] = useState<AutomatedTradingEngine | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState({
    isRunning: false,
    emergencyStop: false,
    dailyLoss: 0,
    activeOrders: 0,
    connected: false
  });
  const [showConfig, setShowConfig] = useState(false);
  const [showRiskWarning, setShowRiskWarning] = useState(false);
  const [credentials, setCredentials] = useState<BrokerCredentials>({
    apiKey: '',
    apiSecret: '',
    userId: '',
    broker: 'ZERODHA'
  });

  useEffect(() => {
    // This would normally come from secure storage
    const mockCredentials: BrokerCredentials = {
      apiKey: 'demo_api_key',
      apiSecret: 'demo_api_secret',
      userId: 'demo_user',
      broker: 'ZERODHA'
    };
    setCredentials(mockCredentials);
  }, []);

  const handleStartStop = async () => {
    if (!tradingEngine) return;

    try {
      if (isRunning) {
        await tradingEngine.stop();
        setIsRunning(false);
      } else {
        // Show risk warning before starting
        if (!showRiskWarning) {
          setShowRiskWarning(true);
          return;
        }

        const success = await tradingEngine.start();
        if (success) {
          setIsRunning(true);
          setShowRiskWarning(false);
        }
      }
    } catch (error) {
      console.error('Error controlling trading engine:', error);
    }
  };

  const handleEmergencyStop = async () => {
    if (!tradingEngine) return;

    try {
      await tradingEngine.emergencyStopAll();
      setIsRunning(false);
    } catch (error) {
      console.error('Emergency stop failed:', error);
    }
  };

  const updateStatus = () => {
    if (tradingEngine) {
      setStatus(tradingEngine.getTradingStatus());
    }
  };

  useEffect(() => {
    const interval = setInterval(updateStatus, 1000);
    return () => clearInterval(interval);
  }, [tradingEngine]);

  // Initialize trading engine
  useEffect(() => {
    if (credentials.apiKey && credentials.apiSecret) {
      try {
        const engine = createAutomatedTrader(credentials);
        setTradingEngine(engine);
      } catch (error) {
        console.error('Failed to create trading engine:', error);
      }
    }
  }, [credentials]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Power className={`w-6 h-6 ${isRunning ? 'text-green-500' : 'text-slate-400'}`} />
          <h3 className="text-lg font-semibold text-white">Automated Trading - {symbol}</h3>
          <span className="px-2 py-1 bg-red-900 text-red-300 text-xs rounded">HIGH RISK</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
          >
            <Settings className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={handleEmergencyStop}
            className={`px-4 py-2 rounded transition-colors ${
              isRunning 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
            }`}
            disabled={!isRunning}
          >
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Emergency Stop</span>
            </div>
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
                <span>Stop Trading</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Start Trading</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Risk Warning Modal */}
      {showRiskWarning && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="text-red-500 text-lg mt-1" />
            <div>
              <h4 className="text-red-400 font-semibold mb-2">⚠️ EXTREME RISK WARNING</h4>
              <div className="text-red-300 text-sm space-y-2">
                <p><strong>You are about to start automated trading with REAL money.</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>You could lose ALL your money in minutes</li>
                  <li>Technical errors can cause massive losses</li>
                  <li>Market conditions can change instantly</li>
                  <li>No human oversight during automated execution</li>
                  <li>Internet issues could prevent emergency stops</li>
                </ul>
                <p className="mt-3"><strong>Only proceed if you can afford to lose 100% of your trading capital.</strong></p>
              </div>
              <div className="flex space-x-3 mt-4">
                <button
                  onClick={() => setShowRiskWarning(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStartStop}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                >
                  I Understand the Risk - Start Trading
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded p-3">
          <div className="flex items-center space-x-2 text-slate-400 text-sm mb-1">
            <Activity className="w-4 h-4" />
            <span>Status</span>
          </div>
          <div className={`text-xl font-bold ${
            status.isRunning ? 'text-green-500' : 'text-slate-400'
          }`}>
            {status.isRunning ? 'RUNNING' : 'STOPPED'}
          </div>
        </div>
        
        <div className="bg-slate-800 rounded p-3">
          <div className="flex items-center space-x-2 text-slate-400 text-sm mb-1">
            <DollarSign className="w-4 h-4" />
            <span>Daily Loss</span>
          </div>
          <div className={`text-xl font-bold ${
            status.dailyLoss > 0 ? 'text-red-500' : 'text-white'
          }`}>
            ₹{status.dailyLoss.toLocaleString()}
          </div>
        </div>

        <div className="bg-slate-800 rounded p-3">
          <div className="flex items-center space-x-2 text-slate-400 text-sm mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>Active Orders</span>
          </div>
          <div className="text-xl font-bold text-white">
            {status.activeOrders}
          </div>
        </div>

        <div className="bg-slate-800 rounded p-3">
          <div className="flex items-center space-x-2 text-slate-400 text-sm mb-1">
            <Shield className="w-4 h-4" />
            <span>Connection</span>
          </div>
          <div className={`text-xl font-bold ${
            status.connected ? 'text-green-500' : 'text-red-500'
          }`}>
            {status.connected ? 'CONNECTED' : 'DISCONNECTED'}
          </div>
        </div>
      </div>

      {/* Broker Configuration */}
      {showConfig && (
        <div className="bg-slate-800 rounded p-4 space-y-4">
          <h4 className="text-sm font-medium text-slate-300">Broker Configuration</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Broker</label>
              <select
                value={credentials.broker}
                onChange={(e) => setCredentials(prev => ({ ...prev, broker: e.target.value as any }))}
                className="w-full bg-slate-700 text-white px-3 py-2 rounded text-sm"
                disabled={isRunning}
              >
                <option value="ZERODHA">Zerodha Kite</option>
                <option value="UPSTOX">Upstox</option>
                <option value="ANGEL">Angel One</option>
                <option value="ICICI">ICICI Direct</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">User ID</label>
              <input
                type="text"
                value={credentials.userId}
                onChange={(e) => setCredentials(prev => ({ ...prev, userId: e.target.value }))}
                className="w-full bg-slate-700 text-white px-3 py-2 rounded text-sm"
                disabled={isRunning}
                placeholder="Your broker user ID"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">API Key</label>
              <input
                type="password"
                value={credentials.apiKey}
                onChange={(e) => setCredentials(prev => ({ ...prev, apiKey: e.target.value }))}
                className="w-full bg-slate-700 text-white px-3 py-2 rounded text-sm"
                disabled={isRunning}
                placeholder="Your broker API key"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">API Secret</label>
              <input
                type="password"
                value={credentials.apiSecret}
                onChange={(e) => setCredentials(prev => ({ ...prev, apiSecret: e.target.value }))}
                className="w-full bg-slate-700 text-white px-3 py-2 rounded text-sm"
                disabled={isRunning}
                placeholder="Your broker API secret"
              />
            </div>
          </div>
        </div>
      )}

      {/* Risk Management Settings */}
      <div className="bg-slate-800 rounded p-4">
        <h4 className="text-sm font-medium text-slate-300 mb-3">Risk Management</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Daily Loss Limit</label>
            <div className="bg-slate-700 px-3 py-2 rounded text-sm text-white">
              ₹5,000
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Max Position Size</label>
            <div className="bg-slate-700 px-3 py-2 rounded text-sm text-white">
              ₹25,000
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Max Positions</label>
            <div className="bg-slate-700 px-3 py-2 rounded text-sm text-white">
              5
            </div>
          </div>
        </div>
      </div>

      {/* Legal Requirements */}
      <div className="bg-yellow-900/20 border border-yellow-700 rounded p-4">
        <div className="flex items-start space-x-2">
          <Shield className="text-yellow-500 text-sm mt-1" />
          <div>
            <div className="text-yellow-500 text-sm font-medium">Legal Requirements for Automated Trading</div>
            <div className="text-yellow-600 text-xs mt-1 space-y-1">
              <p>• SEBI Research Analyst License (₹50,000+ fees)</p>
              <p>• Broker API Approval (each broker requires approval)</p>
              <p>• Compliance Officer (mandatory for automated trading)</p>
              <p>• Quarterly Audits (SEBI requirement)</p>
              <p>• Risk Management Framework (regulatory requirement)</p>
              <p>• Data Privacy Compliance (IT rules applicable)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Technical Requirements */}
      <div className="bg-blue-900/20 border border-blue-700 rounded p-4">
        <div className="flex items-start space-x-2">
          <Activity className="text-blue-500 text-sm mt-1" />
          <div>
            <div className="text-blue-500 text-sm font-medium">Technical Infrastructure Required</div>
            <div className="text-blue-600 text-xs mt-1 space-y-1">
              <p>• Real-time Data Feed: ₹5,000-20,000/month</p>
              <p>• Low-latency Server: ₹10,000+/month</p>
              <p>• Backup Systems: ₹5,000+/month</p>
              <p>• Monitoring Tools: ₹3,000+/month</p>
              <p>• 99.9% Uptime Required (any downtime = losses)</p>
              <p>• Millisecond Execution Speed Required</p>
            </div>
          </div>
        </div>
      </div>

      {/* Final Warning */}
      <div className="bg-red-900/40 border border-red-600 rounded p-4">
        <div className="text-center">
          <AlertTriangle className="text-red-500 w-8 h-8 mx-auto mb-2" />
          <h4 className="text-red-400 font-semibold mb-2">THIS IS FOR EDUCATIONAL PURPOSES ONLY</h4>
          <p className="text-red-300 text-sm">
            Automated trading with real money requires legal compliance, technical infrastructure, 
            and involves substantial financial risk. Start with paper trading only.
          </p>
        </div>
      </div>
    </div>
  );
}
