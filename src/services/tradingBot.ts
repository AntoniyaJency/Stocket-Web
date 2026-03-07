// Educational Trading Bot Simulation - NOT FOR REAL TRADING
// This is a simulation tool for learning purposes only

import { PriceData } from './stockApi';

export interface TradeSignal {
  type: 'BUY' | 'SELL' | 'HOLD';
  confidence: number; // 0-100
  reason: string;
  timestamp: number;
}

export interface Trade {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  timestamp: number;
  profit?: number;
  status: 'OPEN' | 'CLOSED';
}

export interface Portfolio {
  cash: number;
  positions: Position[];
  totalValue: number;
  totalProfit: number;
  totalProfitPercent: number;
}

export interface Position {
  symbol: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  profit: number;
  profitPercent: number;
}

export interface BotConfig {
  initialCapital: number;
  maxPositionSize: number; // % of capital per position
  stopLoss: number; // % loss to trigger stop loss
  takeProfit: number; // % gain to trigger take profit
  riskRewardRatio: number; // risk vs reward ratio
  maxPositions: number; // max concurrent positions
}

export class TradingBot {
  private config: BotConfig;
  private portfolio: Portfolio;
  private trades: Trade[] = [];
  private isRunning = false;
  private onTradeCallback?: (trade: Trade) => void;
  private onSignalCallback?: (signal: TradeSignal) => void;

  constructor(config: Partial<BotConfig> = {}) {
    this.config = {
      initialCapital: 100000, // ₹1,00,000 demo capital
      maxPositionSize: 10, // 10% per position
      stopLoss: 2, // 2% stop loss
      takeProfit: 5, // 5% take profit
      riskRewardRatio: 2.5,
      maxPositions: 5,
      ...config
    };

    this.portfolio = {
      cash: this.config.initialCapital,
      positions: [],
      totalValue: this.config.initialCapital,
      totalProfit: 0,
      totalProfitPercent: 0
    };
  }

  // Technical Indicators
  private calculateSMA(prices: number[], period: number): number[] {
    const sma: number[] = [];
    for (let i = period - 1; i < prices.length; i++) {
      const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }
    return sma;
  }

  private calculateEMA(prices: number[], period: number): number[] {
    const ema: number[] = [];
    const multiplier = 2 / (period + 1);
    
    // Start with SMA
    const sma = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
    ema.push(sma);

    for (let i = period; i < prices.length; i++) {
      const value = (prices[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1];
      ema.push(value);
    }
    
    return ema;
  }

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
      const avgGain = gains.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
      const avgLoss = losses.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
      
      if (avgLoss === 0) {
        rsi.push(100);
      } else {
        const rs = avgGain / avgLoss;
        rsi.push(100 - (100 / (1 + rs)));
      }
    }

    return rsi;
  }

  // Trading Strategy - Made public for component access
  public generateSignal(symbol: string, priceData: PriceData[]): TradeSignal {
    if (priceData.length < 50) {
      return {
        type: 'HOLD',
        confidence: 0,
        reason: 'Insufficient data',
        timestamp: Date.now()
      };
    }

    const prices = priceData.map(d => d.close);
    const ema20 = this.calculateEMA(prices, 20);
    const ema50 = this.calculateEMA(prices, 50);
    const rsi = this.calculateRSI(prices);

    const currentPrice = prices[prices.length - 1];
    const currentEMA20 = ema20[ema20.length - 1];
    const currentEMA50 = ema50[ema50.length - 1];
    const currentRSI = rsi[rsi.length - 1];

    // Trading logic
    let signal: TradeSignal = {
      type: 'HOLD',
      confidence: 0,
      reason: 'No clear signal',
      timestamp: Date.now()
    };

    // Buy signals
    if (
      currentEMA20 > currentEMA50 && // EMA20 above EMA50 (uptrend)
      currentRSI < 70 && // Not overbought
      currentRSI > 30 && // Not oversold
      currentPrice > currentEMA20 // Price above EMA20
    ) {
      signal = {
        type: 'BUY',
        confidence: Math.min(85, (currentEMA20 - currentEMA50) / currentEMA50 * 100 + (50 - currentRSI) / 2),
        reason: 'EMA crossover + RSI confirmation',
        timestamp: Date.now()
      };
    }

    // Sell signals
    if (
      currentEMA20 < currentEMA50 && // EMA20 below EMA50 (downtrend)
      currentRSI > 30 && // Not oversold
      currentPrice < currentEMA20 // Price below EMA20
    ) {
      signal = {
        type: 'SELL',
        confidence: Math.min(85, (currentEMA50 - currentEMA20) / currentEMA50 * 100 + currentRSI / 2),
        reason: 'EMA crossover + RSI confirmation',
        timestamp: Date.now()
      };
    }

    // Strong signals based on RSI
    if (currentRSI < 30) {
      signal = {
        type: 'BUY',
        confidence: 90,
        reason: 'Oversold condition (RSI < 30)',
        timestamp: Date.now()
      };
    } else if (currentRSI > 70) {
      signal = {
        type: 'SELL',
        confidence: 90,
        reason: 'Overbought condition (RSI > 70)',
        timestamp: Date.now()
      };
    }

    return signal;
  }

  // Position Management
  private calculatePositionSize(): number {
    const maxPositionValue = this.portfolio.totalValue * (this.config.maxPositionSize / 100);
    return Math.floor(maxPositionValue / 1000) * 1000; // Round to nearest 1000
  }

  private shouldStopLoss(position: Position, currentPrice: number): boolean {
    const lossPercent = ((position.avgPrice - currentPrice) / position.avgPrice) * 100;
    return lossPercent >= this.config.stopLoss;
  }

  private shouldTakeProfit(position: Position, currentPrice: number): boolean {
    const profitPercent = ((currentPrice - position.avgPrice) / position.avgPrice) * 100;
    return profitPercent >= this.config.takeProfit;
  }

  // Trading Execution
  public executeSignal(symbol: string, signal: TradeSignal, currentPrice: number): void {
    if (!this.isRunning) return;

    // Notify about signal
    if (this.onSignalCallback) {
      this.onSignalCallback(signal);
    }

    if (signal.type === 'BUY' && signal.confidence > 60) {
      this.executeBuy(symbol, currentPrice, signal);
    } else if (signal.type === 'SELL' && signal.confidence > 60) {
      this.executeSell(symbol, currentPrice, signal);
    }

    // Check existing positions for stop loss/take profit
    this.checkRiskManagement(currentPrice);
  }

  private executeBuy(symbol: string, price: number, signal: TradeSignal): void {
    const existingPosition = this.portfolio.positions.find(p => p.symbol === symbol);
    
    if (existingPosition) {
      // Add to existing position
      const quantity = Math.floor(this.calculatePositionSize() / price);
      if (quantity * price <= this.portfolio.cash) {
        this.portfolio.cash -= quantity * price;
        existingPosition.quantity += quantity;
        existingPosition.avgPrice = ((existingPosition.avgPrice * existingPosition.quantity) + (price * quantity)) / (existingPosition.quantity + quantity);
        
        const trade: Trade = {
          id: `trade_${Date.now()}`,
          symbol,
          type: 'BUY',
          quantity,
          price,
          timestamp: Date.now(),
          status: 'CLOSED'
        };
        this.trades.push(trade);
        
        if (this.onTradeCallback) {
          this.onTradeCallback(trade);
        }
      }
    } else {
      // New position
      if (this.portfolio.positions.length >= this.config.maxPositions) {
        return; // Max positions reached
      }

      const quantity = Math.floor(this.calculatePositionSize() / price);
      if (quantity * price <= this.portfolio.cash) {
        this.portfolio.cash -= quantity * price;
        
        const position: Position = {
          symbol,
          quantity,
          avgPrice: price,
          currentPrice: price,
          profit: 0,
          profitPercent: 0
        };
        
        this.portfolio.positions.push(position);
        
        const trade: Trade = {
          id: `trade_${Date.now()}`,
          symbol,
          type: 'BUY',
          quantity,
          price,
          timestamp: Date.now(),
          status: 'CLOSED'
        };
        this.trades.push(trade);
        
        if (this.onTradeCallback) {
          this.onTradeCallback(trade);
        }
      }
    }
  }

  private executeSell(symbol: string, price: number, signal: TradeSignal): void {
    const positionIndex = this.portfolio.positions.findIndex(p => p.symbol === symbol);
    
    if (positionIndex !== -1) {
      const position = this.portfolio.positions[positionIndex];
      const profit = (price - position.avgPrice) * position.quantity;
      
      this.portfolio.cash += position.quantity * price;
      this.portfolio.positions.splice(positionIndex, 1);
      
      const trade: Trade = {
        id: `trade_${Date.now()}`,
        symbol,
        type: 'SELL',
        quantity: position.quantity,
        price,
        profit,
        timestamp: Date.now(),
        status: 'CLOSED'
      };
      this.trades.push(trade);
      
      if (this.onTradeCallback) {
        this.onTradeCallback(trade);
      }
    }
  }

  private checkRiskManagement(currentPrice: number): void {
    // This would be called with current price for each position
    // For now, it's a placeholder
  }

  // Portfolio Management
  public updatePortfolio(currentPrices: Map<string, number>): void {
    let totalValue = this.portfolio.cash;
    let totalProfit = 0;

    this.portfolio.positions.forEach(position => {
      const currentPrice = currentPrices.get(position.symbol) || position.currentPrice;
      position.currentPrice = currentPrice;
      position.profit = (currentPrice - position.avgPrice) * position.quantity;
      position.profitPercent = ((currentPrice - position.avgPrice) / position.avgPrice) * 100;
      
      totalValue += position.quantity * currentPrice;
      totalProfit += position.profit;
    });

    this.portfolio.totalValue = totalValue;
    this.portfolio.totalProfit = totalProfit;
    this.portfolio.totalProfitPercent = ((totalValue - this.config.initialCapital) / this.config.initialCapital) * 100;
  }

  // Bot Control
  public start(): void {
    this.isRunning = true;
  }

  public stop(): void {
    this.isRunning = false;
  }

  public getStatus(): boolean {
    return this.isRunning;
  }

  // Getters
  public getPortfolio(): Portfolio {
    return { ...this.portfolio };
  }

  public getTrades(): Trade[] {
    return [...this.trades];
  }

  public getConfig(): BotConfig {
    return { ...this.config };
  }

  // Callbacks
  public onTrade(callback: (trade: Trade) => void): void {
    this.onTradeCallback = callback;
  }

  public onSignal(callback: (signal: TradeSignal) => void): void {
    this.onSignalCallback = callback;
  }

  // Statistics
  public getStatistics(): {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    avgProfit: number;
    avgLoss: number;
    profitFactor: number;
  } {
    const closedTrades = this.trades.filter(t => t.status === 'CLOSED' && t.profit !== undefined);
    const winningTrades = closedTrades.filter(t => t.profit! > 0);
    const losingTrades = closedTrades.filter(t => t.profit! < 0);
    
    const avgProfit = winningTrades.length > 0 
      ? winningTrades.reduce((sum, t) => sum + t.profit!, 0) / winningTrades.length 
      : 0;
    
    const avgLoss = losingTrades.length > 0 
      ? losingTrades.reduce((sum, t) => sum + t.profit!, 0) / losingTrades.length 
      : 0;

    const totalWins = winningTrades.reduce((sum, t) => sum + t.profit!, 0);
    const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + t.profit!, 0));
    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : 0;

    return {
      totalTrades: closedTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0,
      avgProfit,
      avgLoss,
      profitFactor
    };
  }

  // Reset
  public reset(): void {
    this.portfolio = {
      cash: this.config.initialCapital,
      positions: [],
      totalValue: this.config.initialCapital,
      totalProfit: 0,
      totalProfitPercent: 0
    };
    this.trades = [];
    this.isRunning = false;
  }
}
