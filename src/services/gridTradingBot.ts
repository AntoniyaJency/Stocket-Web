// Grid Trading Bot - Like Binance Spot Grid Bot
// Educational simulation with monetization potential

import { PriceData } from './stockApi';

export interface GridLevel {
  price: number;
  type: 'BUY' | 'SELL';
  quantity: number;
  filled: boolean;
  orderId?: string;
}

export interface GridConfig {
  upperPrice: number;
  lowerPrice: number;
  gridCount: number;
  totalAmount: number; // Total investment amount
  profitPerGrid: number; // Target profit per grid in %
  symbol: string;
}

export interface GridTrade {
  id: string;
  type: 'BUY' | 'SELL';
  price: number;
  quantity: number;
  timestamp: number;
  gridLevel: number;
  profit?: number;
}

export class GridTradingBot {
  private config: GridConfig;
  private gridLevels: GridLevel[] = [];
  private trades: GridTrade[] = [];
  private currentPrice: number = 0;
  private isRunning: boolean = false;
  private totalInvested: number = 0;
  private totalValue: number = 0;
  private totalProfit: number = 0;
  private onTradeCallback?: (trade: GridTrade) => void;
  private onGridUpdateCallback?: (gridLevels: GridLevel[]) => void;

  constructor(config: GridConfig) {
    this.config = config;
    this.generateGridLevels();
  }

  private generateGridLevels(): void {
    this.gridLevels = [];
    const priceRange = this.config.upperPrice - this.config.lowerPrice;
    const gridSpacing = priceRange / this.config.gridCount;
    const amountPerGrid = this.config.totalAmount / this.config.gridCount;

    // Generate buy levels (from bottom to middle)
    for (let i = 0; i < this.config.gridCount / 2; i++) {
      const price = this.config.lowerPrice + (gridSpacing * i);
      this.gridLevels.push({
        price,
        type: 'BUY',
        quantity: amountPerGrid / price,
        filled: false
      });
    }

    // Generate sell levels (from middle to top)
    for (let i = this.config.gridCount / 2; i < this.config.gridCount; i++) {
      const price = this.config.lowerPrice + (gridSpacing * i);
      this.gridLevels.push({
        price,
        type: 'SELL',
        quantity: amountPerGrid / price,
        filled: false
      });
    }

    // Sort by price
    this.gridLevels.sort((a, b) => a.price - b.price);
  }

  public start(): void {
    this.isRunning = true;
  }

  public stop(): void {
    this.isRunning = false;
  }

  public updatePrice(newPrice: number): void {
    if (!this.isRunning) return;

    this.currentPrice = newPrice;
    this.checkGridExecution(newPrice);
    this.updatePortfolioValue();
    
    if (this.onGridUpdateCallback) {
      this.onGridUpdateCallback(this.gridLevels);
    }
  }

  private checkGridExecution(price: number): void {
    this.gridLevels.forEach((level, index) => {
      if (level.filled) return;

      // Check if price hits grid level
      if (level.type === 'BUY' && price <= level.price) {
        this.executeBuy(level, index);
      } else if (level.type === 'SELL' && price >= level.price) {
        this.executeSell(level, index);
      }
    });
  }

  private executeBuy(level: GridLevel, index: number): void {
    const cost = level.price * level.quantity;
    
    if (this.totalInvested + cost <= this.config.totalAmount) {
      this.totalInvested += cost;
      level.filled = true;
      level.orderId = `buy_${Date.now()}_${index}`;

      const trade: GridTrade = {
        id: level.orderId,
        type: 'BUY',
        price: level.price,
        quantity: level.quantity,
        timestamp: Date.now(),
        gridLevel: index
      };

      this.trades.push(trade);

      // Create corresponding sell order
      const profitPrice = level.price * (1 + this.config.profitPerGrid / 100);
      const sellLevel: GridLevel = {
        price: profitPrice,
        type: 'SELL',
        quantity: level.quantity,
        filled: false,
        orderId: `sell_${Date.now()}_${index}`
      };

      // Find appropriate position for sell level
      const insertIndex = this.gridLevels.findIndex(l => l.price > profitPrice);
      if (insertIndex !== -1) {
        this.gridLevels.splice(insertIndex, 0, sellLevel);
      } else {
        this.gridLevels.push(sellLevel);
      }

      if (this.onTradeCallback) {
        this.onTradeCallback(trade);
      }
    }
  }

  private executeSell(level: GridLevel, index: number): void {
    const revenue = level.price * level.quantity;
    const profit = revenue - (level.price / (1 + this.config.profitPerGrid / 100)) * level.quantity;
    
    this.totalProfit += profit;
    level.filled = true;
    level.orderId = `sell_${Date.now()}_${index}`;

    const trade: GridTrade = {
      id: level.orderId,
      type: 'SELL',
      price: level.price,
      quantity: level.quantity,
      timestamp: Date.now(),
      gridLevel: index,
      profit
    };

    this.trades.push(trade);

    // Create corresponding buy order
    const buyPrice = level.price / (1 + this.config.profitPerGrid / 100);
    const buyLevel: GridLevel = {
      price: buyPrice,
      type: 'BUY',
      quantity: level.quantity,
      filled: false,
      orderId: `buy_${Date.now()}_${index}`
    };

    // Find appropriate position for buy level
    const insertIndex = this.gridLevels.findIndex(l => l.price < buyPrice);
    if (insertIndex !== -1) {
      this.gridLevels.splice(insertIndex + 1, 0, buyLevel);
    } else {
      this.gridLevels.unshift(buyLevel);
    }

    if (this.onTradeCallback) {
      this.onTradeCallback(trade);
    }
  }

  private updatePortfolioValue(): void {
    const activeBuys = this.gridLevels.filter(l => l.type === 'BUY' && l.filled);
    const totalQuantity = activeBuys.reduce((sum, l) => sum + l.quantity, 0);
    this.totalValue = (totalQuantity * this.currentPrice) + this.totalProfit;
  }

  // Getters
  public getGridLevels(): GridLevel[] {
    return [...this.gridLevels];
  }

  public getTrades(): GridTrade[] {
    return [...this.trades];
  }

  public getStatistics(): {
    totalTrades: number;
    totalInvested: number;
    totalValue: number;
    totalProfit: number;
    profitPercent: number;
    activeGrids: number;
    filledGrids: number;
  } {
    const filledGrids = this.gridLevels.filter(l => l.filled).length;
    const profitPercent = this.totalInvested > 0 ? (this.totalProfit / this.totalInvested) * 100 : 0;

    return {
      totalTrades: this.trades.length,
      totalInvested: this.totalInvested,
      totalValue: this.totalValue,
      totalProfit: this.totalProfit,
      profitPercent,
      activeGrids: this.gridLevels.length,
      filledGrids
    };
  }

  public getConfig(): GridConfig {
    return { ...this.config };
  }

  public isBotRunning(): boolean {
    return this.isRunning;
  }

  public getCurrentPrice(): number {
    return this.currentPrice;
  }

  // Callbacks
  public onTrade(callback: (trade: GridTrade) => void): void {
    this.onTradeCallback = callback;
  }

  public onGridUpdate(callback: (gridLevels: GridLevel[]) => void): void {
    this.onGridUpdateCallback = callback;
  }

  // Advanced features for monetization
  public optimizeGrid(marketData: PriceData[]): GridConfig {
    // Analyze market data to suggest optimal grid parameters
    const prices = marketData.map(d => d.close);
    const volatility = this.calculateVolatility(prices);
    const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const range = volatility * avgPrice * 2; // 2x volatility for range

    const optimizedConfig: GridConfig = {
      ...this.config,
      lowerPrice: Math.max(avgPrice - range / 2, avgPrice * 0.8),
      upperPrice: Math.min(avgPrice + range / 2, avgPrice * 1.2),
      gridCount: Math.min(20, Math.max(5, Math.floor(range / (avgPrice * 0.02)))), // 2% grids
      profitPerGrid: Math.max(0.5, volatility * 100 * 0.5) // Minimum 0.5% profit
    };

    return optimizedConfig;
  }

  private calculateVolatility(prices: number[]): number {
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    
    return Math.sqrt(variance);
  }

  public backtest(marketData: PriceData[]): {
    totalProfit: number;
    profitPercent: number;
    totalTrades: number;
    winRate: number;
    maxDrawdown: number;
    sharpeRatio: number;
  } {
    const testBot = new GridTradingBot(this.config);
    testBot.start();
    
    let maxPortfolioValue = this.config.totalAmount;
    let maxDrawdown = 0;
    const portfolioValues: number[] = [];

    for (const data of marketData) {
      testBot.updatePrice(data.close);
      const stats = testBot.getStatistics();
      portfolioValues.push(stats.totalValue);
      
      if (stats.totalValue > maxPortfolioValue) {
        maxPortfolioValue = stats.totalValue;
      }
      
      const drawdown = ((maxPortfolioValue - stats.totalValue) / maxPortfolioValue) * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    const finalStats = testBot.getStatistics();
    const winningTrades = testBot.getTrades().filter(t => t.type === 'SELL' && (t.profit || 0) > 0).length;
    const totalSellTrades = testBot.getTrades().filter(t => t.type === 'SELL').length;
    const winRate = totalSellTrades > 0 ? (winningTrades / totalSellTrades) * 100 : 0;

    // Calculate Sharpe Ratio (simplified)
    const returns = portfolioValues.slice(1).map((val, i) => (val - portfolioValues[i]) / portfolioValues[i]);
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const returnStd = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length);
    const sharpeRatio = returnStd > 0 ? avgReturn / returnStd : 0;

    return {
      totalProfit: finalStats.totalProfit,
      profitPercent: finalStats.profitPercent,
      totalTrades: finalStats.totalTrades,
      winRate,
      maxDrawdown,
      sharpeRatio
    };
  }

  public reset(): void {
    this.gridLevels = [];
    this.trades = [];
    this.currentPrice = 0;
    this.isRunning = false;
    this.totalInvested = 0;
    this.totalValue = 0;
    this.totalProfit = 0;
    this.generateGridLevels();
  }
}
