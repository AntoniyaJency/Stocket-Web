// WebSocket service for real-time stock price updates

import { useEffect } from 'react';
import { StockPrice } from './stockApi';

export interface RealtimeUpdate {
  s: string; // symbol
  p: number; // last price
  t: number; // timestamp
  v: number; // volume
}

export interface WebSocketMessage {
  type: 'trade' | 'quote' | 'error' | 'connection' | 'price_update';
  data: RealtimeUpdate | StockPrice | string | { symbol: string; price: number; change: number; changePercent: number };
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private subscribers: Map<string, Set<(data: WebSocketMessage) => void>> = new Map();
  private subscribedSymbols: Set<string> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private apiKey: string;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isConnecting = false;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || 'demo';
  }

  connect(): Promise<void> {
    if (this.isConnecting || this.isConnected()) {
      return Promise.resolve();
    }

    this.isConnecting = true;

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(`wss://ws.finnhub.io?token=${this.apiKey}`);
        
        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          this.isConnecting = false;
          
          // Start heartbeat
          this.startHeartbeat();
          
          // Resubscribe to previous symbols after reconnection
          if (this.subscribedSymbols.size > 0) {
            this.subscribedSymbols.forEach(symbol => {
              this.subscribe(symbol);
            });
          }
          
          this.notifyAllSubscribers({
            type: 'connection',
            data: 'connected'
          });
          
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'trade') {
              data.data.forEach((trade: RealtimeUpdate) => {
                const message: WebSocketMessage = {
                  type: 'trade',
                  data: trade
                };
                this.notifySubscribers(trade.s, message);
              });
            } else if (data.type === 'ping') {
              // Respond to ping with pong
              this.send({ type: 'pong' });
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.isConnecting = false;
          this.stopHeartbeat();
          this.handleReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnecting = false;
          const errorMessage: WebSocketMessage = {
            type: 'error',
            data: 'WebSocket connection error'
          };
          this.notifyAllSubscribers(errorMessage);
          reject(error);
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping' });
      }
    }, 30000); // Send ping every 30 seconds
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private send(data: { type: string; [key: string]: any }) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect().catch(error => {
          console.error('Reconnection failed:', error);
        });
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
      const errorMessage: WebSocketMessage = {
        type: 'error',
        data: 'Connection lost. Please refresh the page.'
      };
      this.notifyAllSubscribers(errorMessage);
    }
  }

  subscribe(symbol: string, callback?: (data: WebSocketMessage) => void) {
    if (!this.subscribers.has(symbol)) {
      this.subscribers.set(symbol, new Set());
    }
    
    if (callback) {
      this.subscribers.get(symbol)!.add(callback);
    }
    
    this.subscribedSymbols.add(symbol);
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'subscribe', symbol: symbol }));
      console.log(`Subscribed to ${symbol}`);
    } else {
      // Try to connect if not connected
      this.connect().catch(console.error);
    }
  }

  unsubscribe(symbol: string, callback?: (data: WebSocketMessage) => void) {
    if (callback) {
      const callbacks = this.subscribers.get(symbol);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscribers.delete(symbol);
        }
      }
    } else {
      this.subscribers.delete(symbol);
    }
    
    this.subscribedSymbols.delete(symbol);
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'unsubscribe', symbol: symbol }));
      console.log(`Unsubscribed from ${symbol}`);
    }
  }

  private notifySubscribers(symbol: string, message: WebSocketMessage) {
    const callbacks = this.subscribers.get(symbol);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(message);
        } catch (error) {
          console.error('Error in subscriber callback:', error);
        }
      });
    }
  }

  private notifyAllSubscribers(message: WebSocketMessage) {
    this.subscribers.forEach((callbacks) => {
      callbacks.forEach(callback => {
        try {
          callback(message);
        } catch (error) {
          console.error('Error in subscriber callback:', error);
        }
      });
    });
  }

  disconnect() {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.subscribers.clear();
    this.subscribedSymbols.clear();
    this.isConnecting = false;
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  getConnectionStatus(): 'connecting' | 'connected' | 'disconnected' | 'error' {
    if (this.isConnecting) return 'connecting';
    if (!this.ws) return 'disconnected';
    if (this.ws.readyState === WebSocket.OPEN) return 'connected';
    if (this.ws.readyState === WebSocket.CONNECTING) return 'connecting';
    return 'disconnected';
  }
}

// Singleton instance
export const websocketService = new WebSocketService();

// React hook for WebSocket
export function useWebSocket(symbol: string, callback: (data: WebSocketMessage) => void) {
  useEffect(() => {
    if (!symbol) return;

    // Connect if not already connected
    if (!websocketService.isConnected()) {
      websocketService.connect().catch(console.error);
    }

    // Subscribe to symbol
    websocketService.subscribe(symbol, callback);

    return () => {
      websocketService.unsubscribe(symbol, callback);
    };
  }, [symbol, callback]);
}
