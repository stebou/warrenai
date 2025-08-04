// src/lib/trading/exchanges/base_exchange.ts
import type { 
  OrderBook, 
  Ticker, 
  Candle, 
  OrderRequest, 
  Order, 
  AccountInfo, 
  Trade, 
  ExchangeInfo,
  Balance
} from './types';

export interface BaseExchange {
  // Connexion et info
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  getExchangeInfo(): Promise<ExchangeInfo>;

  // Données de marché
  getTicker(symbol: string): Promise<Ticker>;
  getOrderBook(symbol: string, limit?: number): Promise<OrderBook>;
  getCandles(symbol: string, interval: string, limit?: number): Promise<Candle[]>;
  
  // Account et balances
  getAccountInfo(): Promise<AccountInfo>;
  getBalance(asset?: string): Promise<Balance[]>;
  
  // Trading
  placeOrder(order: OrderRequest): Promise<Order>;
  cancelOrder(symbol: string, orderId: string): Promise<Order>;
  getOrder(symbol: string, orderId: string): Promise<Order>;
  getOpenOrders(symbol?: string): Promise<Order[]>;
  getOrderHistory(symbol?: string, limit?: number): Promise<Order[]>;
  
  // Trades
  getMyTrades(symbol: string, limit?: number): Promise<Trade[]>;
  
  // WebSocket streams (optionnel pour le mock)
  subscribeToTicker?(symbol: string, callback: (ticker: Ticker) => void): void;
  subscribeToOrderBook?(symbol: string, callback: (orderBook: OrderBook) => void): void;
  unsubscribe?(streamId: string): void;
}