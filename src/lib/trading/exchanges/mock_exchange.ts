// src/lib/trading/exchanges/mock_exchange.ts
import { BaseExchange } from './base_exchange';
import { log } from '@/lib/logger';
import type { 
  OrderBook, 
  Ticker, 
  Candle, 
  OrderRequest, 
  Order, 
  AccountInfo, 
  Trade, 
  ExchangeInfo,
  Balance,
  OrderStatus,
  OrderSide
} from './types';

export class MockExchange implements BaseExchange {
  private connected = false;
  private orders = new Map<string, Order>();
  private trades: Trade[] = [];
  private balances = new Map<string, Balance>();
  private orderIdCounter = 1;
  private tradeIdCounter = 1;
  
  // Données de marché simulées
  private marketData = new Map<string, {
    price: number;
    trend: number; // -1 à 1, pour simulation de tendance
    volatility: number; // 0 à 1, pour simulation de volatilité
    lastUpdate: number;
  }>();

  constructor() {
    // Initialisation des balances par défaut
    this.initializeBalances();
    // Initialisation des données de marché
    this.initializeMarketData();
    
    log.info('[MockExchange] Initialized with demo data');
  }

  private initializeBalances() {
    // Balances de démo généreuses pour les tests
    const defaultBalances = [
      { asset: 'USDT', free: 10000, locked: 0 },
      { asset: 'BTC', free: 1, locked: 0 },
      { asset: 'ETH', free: 10, locked: 0 },
      { asset: 'ADA', free: 1000, locked: 0 },
      { asset: 'SOL', free: 50, locked: 0 },
    ];

    for (const balance of defaultBalances) {
      this.balances.set(balance.asset, {
        ...balance,
        total: balance.free + balance.locked
      });
    }
  }

  private initializeMarketData() {
    const symbols = [
      { symbol: 'BTC/USDT', price: 45000, volatility: 0.02, trend: 0.1 },
      { symbol: 'ETH/USDT', price: 2800, volatility: 0.03, trend: 0.05 },
      { symbol: 'ADA/USDT', price: 0.48, volatility: 0.04, trend: -0.02 },
      { symbol: 'SOL/USDT', price: 98, volatility: 0.05, trend: 0.15 },
      { symbol: 'MATIC/USDT', price: 0.89, volatility: 0.03, trend: 0.08 },
    ];

    for (const data of symbols) {
      this.marketData.set(data.symbol, {
        price: data.price,
        volatility: data.volatility,
        trend: data.trend,
        lastUpdate: Date.now()
      });
    }
  }

  // Simulation de prix avec mouvement réaliste
  private simulatePrice(symbol: string): number {
    const data = this.marketData.get(symbol);
    if (!data) return 0;

    const now = Date.now();
    const timeDiff = (now - data.lastUpdate) / 1000; // en secondes
    
    // Mouvement aléatoire avec tendance
    const randomFactor = (Math.random() - 0.5) * 2; // -1 à 1
    const trendFactor = data.trend * timeDiff * 0.001; // Influence de la tendance
    const volatilityFactor = data.volatility * randomFactor * 0.01;
    
    const priceChange = data.price * (trendFactor + volatilityFactor);
    const newPrice = Math.max(data.price + priceChange, data.price * 0.95); // Minimum 5% de baisse
    
    // Mise à jour des données
    this.marketData.set(symbol, {
      ...data,
      price: newPrice,
      lastUpdate: now
    });

    return newPrice;
  }

  async connect(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulation latence
    this.connected = true;
    log.info('[MockExchange] Connected successfully');
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    log.info('[MockExchange] Disconnected');
  }

  isConnected(): boolean {
    return this.connected;
  }

  async getExchangeInfo(): Promise<ExchangeInfo> {
    if (!this.connected) throw new Error('Exchange not connected');
    
    return {
      name: 'MockExchange',
      rateLimits: [
        {
          rateLimitType: 'REQUEST_WEIGHT',
          interval: 'MINUTE',
          intervalNum: 1,
          limit: 1200
        }
      ],
      symbols: Array.from(this.marketData.keys()).map(symbol => {
        const [base, quote] = symbol.split('/');
        return {
          symbol,
          baseAsset: base,
          quoteAsset: quote,
          status: 'TRADING',
          minQty: 0.001,
          maxQty: 100000,
          stepSize: 0.001,
          minPrice: 0.01,
          maxPrice: 1000000,
          tickSize: 0.01,
          minNotional: 10
        };
      })
    };
  }

  async getTicker(symbol: string): Promise<Ticker> {
    if (!this.connected) throw new Error('Exchange not connected');
    
    const currentPrice = this.simulatePrice(symbol);
    const data = this.marketData.get(symbol);
    
    if (!data) throw new Error(`Symbol ${symbol} not found`);

    // Simulation des données 24h
    const change24h = currentPrice * 0.05 * (Math.random() - 0.5);
    const changePercent24h = (change24h / (currentPrice - change24h)) * 100;

    return {
      symbol,
      price: currentPrice,
      change24h,
      changePercent24h,
      volume24h: Math.random() * 1000000,
      high24h: currentPrice * (1 + Math.random() * 0.05),
      low24h: currentPrice * (1 - Math.random() * 0.05),
      timestamp: Date.now()
    };
  }

  async getOrderBook(symbol: string, limit = 20): Promise<OrderBook> {
    if (!this.connected) throw new Error('Exchange not connected');
    
    const currentPrice = this.simulatePrice(symbol);
    const spread = currentPrice * 0.001; // 0.1% spread

    const bids: [number, number][] = [];
    const asks: [number, number][] = [];

    // Génération des bids (ordres d'achat)
    for (let i = 0; i < limit; i++) {
      const price = currentPrice - spread/2 - (i * spread * 0.1);
      const quantity = Math.random() * 10 + 0.1;
      bids.push([price, quantity]);
    }

    // Génération des asks (ordres de vente)  
    for (let i = 0; i < limit; i++) {
      const price = currentPrice + spread/2 + (i * spread * 0.1);
      const quantity = Math.random() * 10 + 0.1;
      asks.push([price, quantity]);
    }

    return {
      symbol,
      bids: bids.sort((a, b) => b[0] - a[0]), // Prix décroissant
      asks: asks.sort((a, b) => a[0] - b[0]), // Prix croissant
      timestamp: Date.now()
    };
  }

  async getCandles(symbol: string, interval: string, limit = 100): Promise<Candle[]> {
    if (!this.connected) throw new Error('Exchange not connected');
    
    const currentPrice = this.simulatePrice(symbol);
    const candles: Candle[] = [];
    
    // Conversion de l'intervalle en millisecondes
    const intervalMs = this.parseInterval(interval);
    const now = Date.now();
    
    for (let i = limit - 1; i >= 0; i--) {
      const timestamp = now - (i * intervalMs);
      const basePrice = currentPrice * (1 + (Math.random() - 0.5) * 0.1);
      
      const open = basePrice * (1 + (Math.random() - 0.5) * 0.02);
      const close = basePrice * (1 + (Math.random() - 0.5) * 0.02);
      const high = Math.max(open, close) * (1 + Math.random() * 0.01);
      const low = Math.min(open, close) * (1 - Math.random() * 0.01);
      const volume = Math.random() * 1000;

      candles.push({
        symbol,
        timestamp,
        open,
        high,
        low,
        close,
        volume
      });
    }

    return candles;
  }

  private parseInterval(interval: string): number {
    const unit = interval.slice(-1);
    const value = parseInt(interval.slice(0, -1));
    
    switch (unit) {
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 60 * 1000; // 1 minute par défaut
    }
  }

  async getAccountInfo(): Promise<AccountInfo> {
    if (!this.connected) throw new Error('Exchange not connected');
    
    return {
      balances: Array.from(this.balances.values()),
      makerCommission: 10, // 0.1%
      takerCommission: 10, // 0.1%
      canTrade: true,
      canWithdraw: true,
      canDeposit: true,
      updateTime: Date.now()
    };
  }

  async getBalance(asset?: string): Promise<Balance[]> {
    if (!this.connected) throw new Error('Exchange not connected');
    
    if (asset) {
      const balance = this.balances.get(asset);
      return balance ? [balance] : [];
    }
    
    return Array.from(this.balances.values());
  }

  async placeOrder(orderRequest: OrderRequest): Promise<Order> {
    if (!this.connected) throw new Error('Exchange not connected');
    
    const orderId = `mock_order_${this.orderIdCounter++}`;
    const timestamp = Date.now();
    
    // Validation basique
    if (!this.marketData.has(orderRequest.symbol)) {
      throw new Error(`Symbol ${orderRequest.symbol} not supported`);
    }

    // Simulation de l'exécution d'ordre
    const currentPrice = this.simulatePrice(orderRequest.symbol);
    let status: OrderStatus = 'PENDING';
    let filled = 0;
    let average: number | undefined;

    // Pour les ordres MARKET, exécution immédiate
    if (orderRequest.type === 'MARKET') {
      status = 'FILLED';
      filled = orderRequest.quantity;
      average = currentPrice;
      
      // Simulation du trade
      await this.simulateTrade(orderId, orderRequest, currentPrice);
    }
    // Pour les ordres LIMIT, vérifier si le prix permet l'exécution
    else if (orderRequest.type === 'LIMIT' && orderRequest.price) {
      const canFill = (
        (orderRequest.side === 'BUY' && orderRequest.price >= currentPrice) ||
        (orderRequest.side === 'SELL' && orderRequest.price <= currentPrice)
      );
      
      if (canFill) {
        status = 'FILLED';
        filled = orderRequest.quantity;
        average = orderRequest.price;
        
        await this.simulateTrade(orderId, orderRequest, orderRequest.price);
      }
    }

    const order: Order = {
      id: orderId,
      clientOrderId: orderRequest.clientOrderId,
      symbol: orderRequest.symbol,
      side: orderRequest.side,
      type: orderRequest.type,
      quantity: orderRequest.quantity,
      price: orderRequest.price,
      stopPrice: orderRequest.stopPrice,
      status,
      filled,
      remaining: orderRequest.quantity - filled,
      average,
      fee: status === 'FILLED' ? (filled * (average || currentPrice) * 0.001) : undefined,
      feeCurrency: status === 'FILLED' ? 'USDT' : undefined,
      timestamp,
      updatedAt: timestamp
    };

    this.orders.set(orderId, order);
    
    log.info('[MockExchange] Order placed', {
      orderId,
      symbol: orderRequest.symbol,
      side: orderRequest.side,
      type: orderRequest.type,
      quantity: orderRequest.quantity,
      status
    });

    return order;
  }

  private async simulateTrade(orderId: string, orderRequest: OrderRequest, executionPrice: number): Promise<void> {
    const tradeId = `mock_trade_${this.tradeIdCounter++}`;
    const fee = orderRequest.quantity * executionPrice * 0.001; // 0.1% fee
    
    const trade: Trade = {
      id: tradeId,
      orderId,
      symbol: orderRequest.symbol,
      side: orderRequest.side,
      quantity: orderRequest.quantity,
      price: executionPrice,
      fee,
      feeCurrency: 'USDT',
      timestamp: Date.now()
    };

    this.trades.push(trade);
    
    // Mise à jour des balances
    await this.updateBalancesAfterTrade(trade);
  }

  private async updateBalancesAfterTrade(trade: Trade): Promise<void> {
    const [baseAsset, quoteAsset] = trade.symbol.split('/');
    const totalValue = trade.quantity * trade.price;
    
    if (trade.side === 'BUY') {
      // Achat: diminuer quote, augmenter base
      this.adjustBalance(quoteAsset, -(totalValue + trade.fee));
      this.adjustBalance(baseAsset, trade.quantity);
    } else {
      // Vente: diminuer base, augmenter quote  
      this.adjustBalance(baseAsset, -trade.quantity);
      this.adjustBalance(quoteAsset, totalValue - trade.fee);
    }
  }

  private adjustBalance(asset: string, change: number): void {
    const balance = this.balances.get(asset);
    if (balance) {
      balance.free = Math.max(0, balance.free + change);
      balance.total = balance.free + balance.locked;
      this.balances.set(asset, balance);
    }
  }

  async cancelOrder(symbol: string, orderId: string): Promise<Order> {
    if (!this.connected) throw new Error('Exchange not connected');
    
    const order = this.orders.get(orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);
    if (order.symbol !== symbol) throw new Error('Symbol mismatch');
    if (order.status === 'FILLED') throw new Error('Cannot cancel filled order');
    
    order.status = 'CANCELLED';
    order.updatedAt = Date.now();
    
    log.info('[MockExchange] Order cancelled', { orderId, symbol });
    return order;
  }

  async getOrder(symbol: string, orderId: string): Promise<Order> {
    if (!this.connected) throw new Error('Exchange not connected');
    
    const order = this.orders.get(orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);
    if (order.symbol !== symbol) throw new Error('Symbol mismatch');
    
    return order;
  }

  async getOpenOrders(symbol?: string): Promise<Order[]> {
    if (!this.connected) throw new Error('Exchange not connected');
    
    const openOrders = Array.from(this.orders.values()).filter(order => 
      order.status === 'PENDING' && (!symbol || order.symbol === symbol)
    );
    
    return openOrders;
  }

  async getOrderHistory(symbol?: string, limit = 100): Promise<Order[]> {
    if (!this.connected) throw new Error('Exchange not connected');
    
    const history = Array.from(this.orders.values())
      .filter(order => !symbol || order.symbol === symbol)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
      
    return history;
  }

  async getMyTrades(symbol: string, limit = 100): Promise<Trade[]> {
    if (!this.connected) throw new Error('Exchange not connected');
    
    return this.trades
      .filter(trade => trade.symbol === symbol)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }
}