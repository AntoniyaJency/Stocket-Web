// Stock API service for fetching real market data

export interface StockPrice {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  volume: string;
  marketCap: string;
}

export interface PriceData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface StockQuote {
  c: number; // current price
  d: number; // change
  dp: number; // percent change
  h: number; // day high
  l: number; // day low
  o: number; // open price
  pc: number; // previous close
}

export interface MarketData {
  t: number; // timestamp
  c: number; // close price
  h: number; // high price
  l: number; // low price
  o: number; // open price
  v: number; // volume
}

const BASE_URL = 'https://finnhub.io/api/v1';
const API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || 'demo';

// Fetch current stock price
export async function fetchStockPrice(symbol: string): Promise<StockPrice> {
  try {
    const response = await fetch(
      `${BASE_URL}/quote?symbol=${symbol}&token=${API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch stock price: ${response.statusText}`);
    }
    
    const data: StockQuote = await response.json();
    
    // Fetch additional company info for name and market cap
    const profileResponse = await fetch(
      `${BASE_URL}/stock/profile2?symbol=${symbol}&token=${API_KEY}`
    );
    
    let marketCap = 'N/A';
    let name = symbol;
    
    if (profileResponse.ok) {
      const profileData = await profileResponse.json();
      marketCap = profileData.marketCapitalization ? 
        `₹${(profileData.marketCapitalization / 10000000000).toFixed(1)}T` : 'N/A';
      name = profileData.name || symbol;
    }
    
    return {
      symbol,
      name,
      price: data.c,
      change: data.d,
      changePercent: data.dp,
      dayHigh: data.h,
      dayLow: data.l,
      volume: 'N/A', // Would need separate endpoint for volume
      marketCap
    };
  } catch (error) {
    console.error('Error fetching stock price:', error);
    throw error;
  }
}

// Fetch historical price data for charts
export async function fetchHistoricalData(
  symbol: string, 
  resolution: '1' | '5' | '15' | '30' | '60' | 'D' | 'W' | 'M' = 'D',
  from?: number,
  to?: number
): Promise<PriceData[]> {
  try {
    const now = Math.floor(Date.now() / 1000);
    const timeFrom = from || (now - 30 * 24 * 60 * 60); // 30 days ago
    const timeTo = to || now;
    
    const response = await fetch(
      `${BASE_URL}/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${timeFrom}&to=${timeTo}&token=${API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch historical data: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.s !== 'ok') {
      throw new Error('API returned error status');
    }
    
    // Transform data to match our PriceData interface
    const priceData: PriceData[] = data.t.map((timestamp: number, index: number) => ({
      time: timestamp,
      open: data.o[index],
      high: data.h[index],
      low: data.l[index],
      close: data.c[index],
      volume: data.v[index]
    }));
    
    return priceData;
  } catch (error) {
    console.error('Error fetching historical data:', error);
    throw error;
  }
}

// Search for stocks
export async function searchStocks(query: string): Promise<StockPrice[]> {
  try {
    const response = await fetch(
      `${BASE_URL}/search?q=${query}&token=${API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to search stocks: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.result && data.result.length > 0) {
      // Fetch detailed quotes for top 5 results
      const symbols = data.result.slice(0, 5).map((item: { symbol: string }) => item.symbol);
      const quotes = await Promise.all(
        symbols.map((symbol: string) => fetchStockPrice(symbol))
      );
      
      return quotes;
    }
    
    return [];
  } catch (error) {
    console.error('Error searching stocks:', error);
    throw error;
  }
}

// Popular Indian stocks
export const POPULAR_STOCKS = [
  { symbol: 'RELIANCE', name: 'Reliance Industries' },
  { symbol: 'TCS', name: 'Tata Consultancy Services' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank' },
  { symbol: 'INFY', name: 'Infosys' },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever' },
  { symbol: 'SBIN', name: 'State Bank of India' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel' },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank' },
];
