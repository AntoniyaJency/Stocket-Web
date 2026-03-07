// Trading Signals Service - Generate signals for manual trading
// Safer alternative to automated trading

import { PriceData } from './stockApi';

export interface TradingSignal {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL' | 'HOLD';
  confidence: number; // 0-100
  entryPrice: number;
  targets: number[]; // Price targets
  stopLoss: number;
  reason: string;
  timestamp: number;
  strategy: string;
  riskReward: number;
  timeframe: string;
}

export interface SignalPerformance {
  totalSignals: number;
  successfulSignals: number;
  successRate: number;
  avgReturn: number;
  maxReturn: number;
  maxLoss: number;
  sharpeRatio: number;
}

export class TradingSignalGenerator {
  private signals: TradingSignal[] = [];
  private performance: SignalPerformance;
  private strategies: Map<string, (data: PriceData[]) => {
    type: 'BUY' | 'SELL' | 'HOLD';
    confidence: number;
    reason: string;
    entryPrice: number;
    stopLoss: number;
    targets: number[];
    riskReward: number;
  } | null> = new Map();

  constructor() {
    this.performance = {
      totalSignals: 0,
      successfulSignals: 0,
      successRate: 0,
      avgReturn: 0,
      maxReturn: 0,
      maxLoss: 0,
      sharpeRatio: 0
    };
    this.initializeStrategies();
  }

  private initializeStrategies(): void {
    // RSI Oversold/Overbought Strategy
    this.strategies.set('RSI', (data: PriceData[]) => {
      const rsi = this.calculateRSI(data.map(d => d.close));
      const currentRSI = rsi[rsi.length - 1];
      const currentPrice = data[data.length - 1].close;

      if (currentRSI < 30) {
        return {
          type: 'BUY' as const,
          confidence: Math.min(90, 70 + (30 - currentRSI)),
          reason: `RSI oversold at ${currentRSI.toFixed(1)}`,
          entryPrice: currentPrice,
          stopLoss: currentPrice * 0.98, // 2% stop loss
          targets: [currentPrice * 1.03, currentPrice * 1.06, currentPrice * 1.10],
          riskReward: 2.5
        };
      } else if (currentRSI > 70) {
        return {
          type: 'SELL' as const,
          confidence: Math.min(90, 70 + (currentRSI - 70)),
          reason: `RSI overbought at ${currentRSI.toFixed(1)}`,
          entryPrice: currentPrice,
          stopLoss: currentPrice * 1.02, // 2% stop loss
          targets: [currentPrice * 0.97, currentPrice * 0.94, currentPrice * 0.90],
          riskReward: 2.5
        };
      }
      return null;
    });

    // Moving Average Crossover Strategy
    this.strategies.set('MA_CROSS', (data: PriceData[]) => {
      const prices = data.map(d => d.close);
      const ema20 = this.calculateEMA(prices, 20);
      const ema50 = this.calculateEMA(prices, 50);
      
      if (ema20.length < 2 || ema50.length < 2) return null;

      const currentEMA20 = ema20[ema20.length - 1];
      const currentEMA50 = ema50[ema50.length - 1];
      const prevEMA20 = ema20[ema20.length - 2];
      const prevEMA50 = ema50[ema50.length - 2];
      const currentPrice = prices[prices.length - 1];

      // Bullish crossover
      if (prevEMA20 <= prevEMA50 && currentEMA20 > currentEMA50) {
        return {
          type: 'BUY' as const,
          confidence: 75,
          reason: 'Bullish EMA crossover (20 > 50)',
          entryPrice: currentPrice,
          stopLoss: currentPrice * 0.97,
          targets: [currentPrice * 1.04, currentPrice * 1.08, currentPrice * 1.12],
          riskReward: 3
        };
      }
      // Bearish crossover
      else if (prevEMA20 >= prevEMA50 && currentEMA20 < currentEMA50) {
        return {
          type: 'SELL' as const,
          confidence: 75,
          reason: 'Bearish EMA crossover (20 < 50)',
          entryPrice: currentPrice,
          stopLoss: currentPrice * 1.03,
          targets: [currentPrice * 0.96, currentPrice * 0.92, currentPrice * 0.88],
          riskReward: 3
        };
      }
      return null;
    });

    // Bollinger Bands Strategy
    this.strategies.set('BB', (data: PriceData[]) => {
      const prices = data.map(d => d.close);
      const bb = this.calculateBollingerBands(prices, 20, 2);
      
      if (!bb || bb.length === 0) return null;

      const currentBB = bb[bb.length - 1];
      const currentPrice = prices[prices.length - 1];

      // Price below lower band - buy signal
      if (currentPrice < currentBB.lower) {
        return {
          type: 'BUY' as const,
          confidence: 80,
          reason: 'Price below Bollinger lower band - oversold',
          entryPrice: currentPrice,
          stopLoss: currentPrice * 0.98,
          targets: [currentBB.middle, currentBB.upper],
          riskReward: 2
        };
      }
      // Price above upper band - sell signal
      else if (currentPrice > currentBB.upper) {
        return {
          type: 'SELL' as const,
          confidence: 80,
          reason: 'Price above Bollinger upper band - overbought',
          entryPrice: currentPrice,
          stopLoss: currentPrice * 1.02,
          targets: [currentBB.middle, currentBB.lower],
          riskReward: 2
        };
      }
      return null;
    });

    // Volume Confirmation Strategy
    this.strategies.set('VOLUME', (data: PriceData[]) => {
      const prices = data.map(d => d.close);
      const volumes = data.map(d => d.volume || 0);
      const avgVolume = volumes.slice(-20).reduce((sum, v) => sum + v, 0) / 20;
      const currentVolume = volumes[volumes.length - 1];
      const currentPrice = prices[prices.length - 1];
      const priceChange = (prices[prices.length - 1] - prices[prices.length - 2]) / prices[prices.length - 2];

      // High volume breakout
      if (currentVolume > avgVolume * 2 && Math.abs(priceChange) > 0.02) {
        return {
          type: priceChange > 0 ? 'BUY' as const : 'SELL' as const,
          confidence: 85,
          reason: `High volume ${priceChange > 0 ? 'breakout' : 'breakdown'} with ${(currentVolume / avgVolume).toFixed(1)}x volume`,
          entryPrice: currentPrice,
          stopLoss: priceChange > 0 ? currentPrice * 0.97 : currentPrice * 1.03,
          targets: priceChange > 0 
            ? [currentPrice * 1.04, currentPrice * 1.08] 
            : [currentPrice * 0.96, currentPrice * 0.92],
          riskReward: 2.5
        };
      }
      return null;
    });
  }

  public generateSignals(symbol: string, data: PriceData[]): TradingSignal[] {
    const signals: TradingSignal[] = [];

    // Generate signals from all strategies
    this.strategies.forEach((strategy, strategyName) => {
      try {
        const result = strategy(data);
        if (result) {
          const signal: TradingSignal = {
            id: `${symbol}_${strategyName}_${Date.now()}`,
            symbol,
            type: result.type,
            confidence: result.confidence,
            entryPrice: result.entryPrice,
            targets: result.targets,
            stopLoss: result.stopLoss,
            reason: result.reason,
            timestamp: Date.now(),
            strategy: strategyName,
            riskReward: result.riskReward,
            timeframe: '1D'
          };
          signals.push(signal);
        }
      } catch (error) {
        console.error(`Error in ${strategyName} strategy:`, error);
      }
    });

    // Sort by confidence and return top signals
    return signals.sort((a, b) => b.confidence - a.confidence);
  }

  public getTopSignals(symbol: string, data: PriceData[], maxSignals: number = 3): TradingSignal[] {
    const allSignals = this.generateSignals(symbol, data);
    return allSignals.slice(0, maxSignals);
  }

  // Technical Indicators
  private calculateRSI(prices: number[], period: number = 14): number[] {
    const rsi: number[] = [];
    const gains: number[] = [];
    const losses: number[] = [];

    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }

    for (let i = period - 1; i < gains.length; i++) {
      const avgGain = gains.slice(i - period + 1, i + 1).reduce((sum, g) => sum + g, 0) / period;
      const avgLoss = losses.slice(i - period + 1, i + 1).reduce((sum, l) => sum + l, 0) / period;
      
      if (avgLoss === 0) {
        rsi.push(100);
      } else {
        const rs = avgGain / avgLoss;
        rsi.push(100 - (100 / (1 + rs)));
      }
    }

    return rsi;
  }

  private calculateEMA(prices: number[], period: number): number[] {
    const ema: number[] = [];
    const multiplier = 2 / (period + 1);
    
    const sma = prices.slice(0, period).reduce((sum, p) => sum + p, 0) / period;
    ema.push(sma);

    for (let i = period; i < prices.length; i++) {
      const value = (prices[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1];
      ema.push(value);
    }
    
    return ema;
  }

  private calculateBollingerBands(prices: number[], period: number, stdDev: number): { upper: number; middle: number; lower: number }[] {
    const bands: { upper: number; middle: number; lower: number }[] = [];
    const sma = this.calculateSMA(prices, period);

    for (let i = period - 1; i < prices.length; i++) {
      const slice = prices.slice(i - period + 1, i + 1);
      const mean = sma[i - period + 1];
      const variance = slice.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / period;
      const standardDeviation = Math.sqrt(variance);

      bands.push({
        upper: mean + (standardDeviation * stdDev),
        middle: mean,
        lower: mean - (standardDeviation * stdDev)
      });
    }

    return bands;
  }

  private calculateSMA(prices: number[], period: number): number[] {
    const sma: number[] = [];
    for (let i = period - 1; i < prices.length; i++) {
      const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }
    return sma;
  }

  // Signal Management
  public addSignal(signal: TradingSignal): void {
    this.signals.push(signal);
    this.updatePerformance();
  }

  public getSignals(symbol?: string, limit?: number): TradingSignal[] {
    let filtered = this.signals;
    
    if (symbol) {
      filtered = filtered.filter(s => s.symbol === symbol);
    }
    
    if (limit) {
      filtered = filtered.slice(-limit);
    }
    
    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }

  public updateSignalStatus(signalId: string, success: boolean, actualReturn?: number): void {
    const signal = this.signals.find(s => s.id === signalId);
    if (signal) {
      // Update performance metrics
      this.performance.totalSignals++;
      if (success) {
        this.performance.successfulSignals++;
        if (actualReturn) {
          this.performance.avgReturn = (this.performance.avgReturn * (this.performance.successfulSignals - 1) + actualReturn) / this.performance.successfulSignals;
          this.performance.maxReturn = Math.max(this.performance.maxReturn, actualReturn);
        }
      } else {
        if (actualReturn) {
          this.performance.maxLoss = Math.min(this.performance.maxLoss, actualReturn);
        }
      }
      this.performance.successRate = (this.performance.successfulSignals / this.performance.totalSignals) * 100;
    }
  }

  private updatePerformance(): void {
    // Recalculate performance metrics
    this.performance.totalSignals = this.signals.length;
    // Add more performance calculations as needed
  }

  public getPerformance(): SignalPerformance {
    return { ...this.performance };
  }

  // Premium Features
  public getAdvancedSignals(symbol: string, data: PriceData[]): {
    scalping: TradingSignal[];
    swing: TradingSignal[];
    position: TradingSignal[];
  } {
    return {
      scalping: this.generateSignals(symbol, data.slice(-50)), // Last 50 periods
      swing: this.generateSignals(symbol, data.slice(-200)), // Last 200 periods
      position: this.generateSignals(symbol, data) // All data
    };
  }

  public getMarketSentiment(data: PriceData[]): {
    bullish: number;
    bearish: number;
    neutral: number;
    overall: string;
  } {
    const signals = this.generateSignals('MARKET', data);
    const bullish = signals.filter(s => s.type === 'BUY').length;
    const bearish = signals.filter(s => s.type === 'SELL').length;
    const neutral = signals.filter(s => s.type === 'HOLD').length;
    const total = signals.length;

    let overall = 'NEUTRAL';
    if (bullish > bearish * 1.5) overall = 'STRONGLY_BULLISH';
    else if (bullish > bearish) overall = 'BULLISH';
    else if (bearish > bullish * 1.5) overall = 'STRONGLY_BEARISH';
    else if (bearish > bullish) overall = 'BEARISH';

    return {
      bullish: (bullish / total) * 100,
      bearish: (bearish / total) * 100,
      neutral: (neutral / total) * 100,
      overall
    };
  }
}
