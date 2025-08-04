// src/lib/trading/exchanges/types.ts

export interface OrderBook {
  symbol: string;
  bids: [number, number][]; // [price, quantity]
  asks: [number, number][]; // [price, quantity] 
  timestamp: number;
}

export interface Ticker {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  timestamp: number;
}

export interface Candle {
  symbol: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type OrderSide = 'BUY' | 'SELL';
export type OrderType = 'MARKET' | 'LIMIT' | 'STOP_LOSS' | 'TAKE_PROFIT';
export type OrderStatus = 'PENDING' | 'FILLED' | 'CANCELLED' | 'REJECTED';
export type TimeInForce = 'GTC' | 'IOC' | 'FOK'; // Good Till Cancel, Immediate or Cancel, Fill or Kill

export interface OrderRequest {
  symbol: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  price?: number; // Pour LIMIT orders
  stopPrice?: number; // Pour STOP orders
  timeInForce?: TimeInForce;
  clientOrderId?: string;
}

export interface Order {
  id: string;
  clientOrderId?: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  price?: number;
  stopPrice?: number;
  status: OrderStatus;
  filled: number;
  remaining: number;
  average?: number; // Prix moyen d'exécution
  fee?: number;
  feeCurrency?: string;
  timestamp: number;
  updatedAt: number;
}

export interface Balance {
  asset: string;
  free: number; // Disponible pour trading
  locked: number; // Bloqué dans des ordres
  total: number; // free + locked
}

export interface AccountInfo {
  balances: Balance[];
  makerCommission: number; // en basis points (ex: 10 = 0.1%)
  takerCommission: number;
  canTrade: boolean;
  canWithdraw: boolean;
  canDeposit: boolean;
  updateTime: number;
}

export interface Trade {
  id: string;
  orderId: string;
  symbol: string;
  side: OrderSide;
  quantity: number;
  price: number;
  fee: number;
  feeCurrency: string;
  timestamp: number;
}

export interface ExchangeInfo {
  name: string;
  rateLimits: {
    rateLimitType: string;
    interval: string;
    intervalNum: number;
    limit: number;
  }[];
  symbols: {
    symbol: string;
    baseAsset: string;
    quoteAsset: string;
    status: string;
    minQty: number;
    maxQty: number;
    stepSize: number;
    minPrice: number;
    maxPrice: number;
    tickSize: number;
    minNotional: number;
  }[];
}