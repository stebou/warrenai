// src/lib/trading/exchanges/binance_exchange.ts
import { MainClient, WebsocketClient } from 'binance';
import { BaseExchange } from './base_exchange';
import { log } from '@/lib/logger';
import { EventEmitter } from 'events';
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
  OrderSide,
  OrderType
} from './types';

// Configuration pour Binance
export interface BinanceConfig {
  apiKey: string;
  apiSecret: string;
  testnet?: boolean;
  recvWindow?: number;
}

// Mapping des types d'ordres Binance vers nos types
const BINANCE_ORDER_TYPE_MAP: Record<string, OrderType> = {
  'MARKET': 'MARKET',
  'LIMIT': 'LIMIT',
  'STOP_LOSS': 'STOP_LOSS',
  'STOP_LOSS_LIMIT': 'STOP_LOSS_LIMIT',
  'TAKE_PROFIT': 'TAKE_PROFIT',
  'TAKE_PROFIT_LIMIT': 'TAKE_PROFIT_LIMIT'
};

// Mapping des statuts d'ordres Binance vers nos statuts
const BINANCE_ORDER_STATUS_MAP: Record<string, OrderStatus> = {
  'NEW': 'PENDING',
  'PARTIALLY_FILLED': 'PARTIALLY_FILLED',
  'FILLED': 'FILLED',
  'CANCELED': 'CANCELLED',
  'REJECTED': 'REJECTED',
  'EXPIRED': 'EXPIRED'
};

// Mapping des côtés d'ordres
const BINANCE_ORDER_SIDE_MAP: Record<string, OrderSide> = {
  'BUY': 'BUY',
  'SELL': 'SELL'
};

export class BinanceExchange extends EventEmitter implements BaseExchange {
  private client: MainClient;
  private wsClient: WebsocketClient | null = null;
  private connected = false;
  private config: BinanceConfig;
  private wsSubscriptions = new Map<string, string>();
  private exchangeInfo: ExchangeInfo | null = null;

  constructor(config: BinanceConfig) {
    super();
    this.config = config;
    
    // Initialiser le client Binance
    this.client = new MainClient({
      api_key: config.apiKey,
      api_secret: config.apiSecret,
      testnet: config.testnet || false,
      recvWindow: config.recvWindow || 5000,
      beautifyResponses: true,
      parseAPIRateLimits: true,
    });

    log.info('[BinanceExchange] Initialized', { 
      testnet: config.testnet || false,
      apiKeyPrefix: config.apiKey.substring(0, 8) + '...'
    });
  }

  async connect(): Promise<void> {
    try {
      // Test de connexion en récupérant les informations du compte
      await this.client.getAccountInformation();
      
      // Marquer comme connecté AVANT de charger les infos d'exchange
      this.connected = true;
      
      // Charger les informations d'exchange pour la précision des quantités
      this.exchangeInfo = await this.getExchangeInfo();
      
      // Initialiser WebSocket pour les mises à jour temps réel
      await this.initializeWebSocket();
      
      log.info('[BinanceExchange] Connected successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown connection error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      const errorCode = (error as any)?.code;
      const errorResponse = (error as any)?.response?.data;
      
      log.error('[BinanceExchange] Failed to connect', { 
        error: errorMessage,
        errorCode,
        errorResponse,
        stack: errorStack,
        testnet: this.config.testnet,
        apiKeyPrefix: this.config.apiKey.substring(0, 8) + '...'
      });
      throw new Error(`Binance connection failed: ${errorMessage} (Code: ${errorCode})`);
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    
    // Fermer les connexions WebSocket
    if (this.wsClient) {
      this.wsClient.closeAll();
      this.wsClient = null;
    }
    
    this.wsSubscriptions.clear();
    log.info('[BinanceExchange] Disconnected');
  }

  isConnected(): boolean {
    return this.connected;
  }

  private async initializeWebSocket(): Promise<void> {
    try {
      this.wsClient = new WebsocketClient({
        api_key: this.config.apiKey,
        api_secret: this.config.apiSecret,
        testnet: this.config.testnet || false,
        beautify: true,
      });

      // Gestionnaires d'événements WebSocket
      this.wsClient.on('message', (data) => {
        this.handleWebSocketMessage(data);
      });

      this.wsClient.on('open', () => {
        log.debug('[BinanceExchange] WebSocket connected');
      });

      this.wsClient.on('error', (error) => {
        log.error('[BinanceExchange] WebSocket error', { error });
      });

      this.wsClient.on('close', () => {
        log.warn('[BinanceExchange] WebSocket disconnected');
      });

    } catch (error) {
      log.error('[BinanceExchange] Failed to initialize WebSocket', { error });
    }
  }

  private handleWebSocketMessage(data: any): void {
    try {
      // Traitement des différents types de messages WebSocket
      if (data.e === '24hrTicker') {
        // Mise à jour de ticker 24h
        this.handleTickerUpdate(data);
      } else if (data.e === 'depthUpdate') {
        // Mise à jour d'order book
        this.handleOrderBookUpdate(data);
      } else if (data.e === 'executionReport') {
        // Rapport d'exécution d'ordre
        this.handleExecutionReport(data);
      }
    } catch (error) {
      log.error('[BinanceExchange] Error processing WebSocket message', { error });
    }
  }

  private handleTickerUpdate(data: any): void {
    const ticker: Ticker = {
      symbol: data.s,
      price: parseFloat(data.c),
      change24h: parseFloat(data.P),
      changePercent24h: parseFloat(data.P),
      volume24h: parseFloat(data.v),
      high24h: parseFloat(data.h),
      low24h: parseFloat(data.l),
      timestamp: data.E
    };

    this.emit('ticker_update', ticker);
  }

  private handleOrderBookUpdate(data: any): void {
    // Traitement des mises à jour d'order book
    this.emit('orderbook_update', {
      symbol: data.s,
      bids: data.b.map((bid: any) => [parseFloat(bid[0]), parseFloat(bid[1])]),
      asks: data.a.map((ask: any) => [parseFloat(ask[0]), parseFloat(ask[1])]),
      timestamp: data.E
    });
  }

  private handleExecutionReport(data: any): void {
    // Traitement des rapports d'exécution (ordres et trades)
    if (data.X === 'FILLED' || data.X === 'PARTIALLY_FILLED') {
      const trade: Trade = {
        id: data.t.toString(),
        orderId: data.i.toString(),
        symbol: data.s,
        side: BINANCE_ORDER_SIDE_MAP[data.S] || 'BUY',
        quantity: parseFloat(data.q),
        price: parseFloat(data.p),
        fee: parseFloat(data.n || '0'),
        feeCurrency: data.N || 'USDT',
        timestamp: data.T
      };

      this.emit('trade_executed', trade);
    }
  }

  async getExchangeInfo(): Promise<ExchangeInfo> {
    if (!this.connected) throw new Error('Exchange not connected');
    
    try {
      const response = await this.client.getExchangeInfo();
      
      return {
        name: 'Binance',
        rateLimits: response.rateLimits.map(limit => ({
          rateLimitType: limit.rateLimitType,
          interval: limit.interval,
          intervalNum: limit.intervalNum,
          limit: limit.limit
        })),
        symbols: response.symbols.map(symbol => ({
          symbol: symbol.symbol,
          baseAsset: symbol.baseAsset,
          quoteAsset: symbol.quoteAsset,
          status: symbol.status,
          minQty: parseFloat(symbol.filters.find(f => f.filterType === 'LOT_SIZE')?.minQty || '0'),
          maxQty: parseFloat(symbol.filters.find(f => f.filterType === 'LOT_SIZE')?.maxQty || '0'),
          stepSize: parseFloat(symbol.filters.find(f => f.filterType === 'LOT_SIZE')?.stepSize || '0'),
          minPrice: parseFloat(symbol.filters.find(f => f.filterType === 'PRICE_FILTER')?.minPrice || '0'),
          maxPrice: parseFloat(symbol.filters.find(f => f.filterType === 'PRICE_FILTER')?.maxPrice || '0'),
          tickSize: parseFloat(symbol.filters.find(f => f.filterType === 'PRICE_FILTER')?.tickSize || '0'),
          minNotional: parseFloat(symbol.filters.find(f => f.filterType === 'MIN_NOTIONAL')?.minNotional || '0')
        }))
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log.error('[BinanceExchange] Failed to get exchange info', { error: errorMessage });
      throw new Error(`Failed to get exchange info: ${errorMessage}`);
    }
  }

  async getTicker(symbol: string): Promise<Ticker> {
    if (!this.connected) throw new Error('Exchange not connected');
    
    try {
      // Convertir le format de symbole (BTC/USDT -> BTCUSDT)
      const binanceSymbol = symbol.replace('/', '');
      const response = await this.client.get24hrChangeStatistics({ symbol: binanceSymbol });

      return {
        symbol,
        price: parseFloat(response.lastPrice),
        change24h: parseFloat(response.priceChange),
        changePercent24h: parseFloat(response.priceChangePercent),
        volume24h: parseFloat(response.volume),
        high24h: parseFloat(response.highPrice),
        low24h: parseFloat(response.lowPrice),
        timestamp: Date.now()
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log.error('[BinanceExchange] Failed to get ticker', { symbol, error: errorMessage });
      throw new Error(`Failed to get ticker for ${symbol}: ${errorMessage}`);
    }
  }

  async getOrderBook(symbol: string, limit = 20): Promise<OrderBook> {
    if (!this.connected) throw new Error('Exchange not connected');
    
    try {
      const binanceSymbol = symbol.replace('/', '');
      const response = await this.client.getOrderBook({ symbol: binanceSymbol, limit });

      return {
        symbol,
        bids: response.bids.map(bid => [parseFloat(bid[0]), parseFloat(bid[1])]),
        asks: response.asks.map(ask => [parseFloat(ask[0]), parseFloat(ask[1])]),
        timestamp: Date.now()
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log.error('[BinanceExchange] Failed to get order book', { symbol, error: errorMessage });
      throw new Error(`Failed to get order book for ${symbol}: ${errorMessage}`);
    }
  }

  async getCandles(symbol: string, interval: string, limit = 100): Promise<Candle[]> {
    if (!this.connected) throw new Error('Exchange not connected');
    
    try {
      const binanceSymbol = symbol.replace('/', '');
      // Mapping des intervalles vers le format Binance
      const binanceInterval = this.mapIntervalToBinance(interval);
      
      const response = await this.client.getKlines({
        symbol: binanceSymbol,
        interval: binanceInterval,
        limit
      });

      return response.map(kline => ({
        symbol,
        timestamp: kline[0],
        open: parseFloat(kline[1]),
        high: parseFloat(kline[2]),
        low: parseFloat(kline[3]),
        close: parseFloat(kline[4]),
        volume: parseFloat(kline[5])
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log.error('[BinanceExchange] Failed to get candles', { symbol, interval, error: errorMessage });
      throw new Error(`Failed to get candles for ${symbol}: ${errorMessage}`);
    }
  }

  private mapIntervalToBinance(interval: string): string {
    // Mapping des intervalles standards vers Binance
    const intervalMap: Record<string, string> = {
      '1m': '1m',
      '3m': '3m',
      '5m': '5m',
      '15m': '15m',
      '30m': '30m',
      '1h': '1h',
      '2h': '2h',
      '4h': '4h',
      '6h': '6h',
      '8h': '8h',
      '12h': '12h',
      '1d': '1d',
      '3d': '3d',
      '1w': '1w',
      '1M': '1M'
    };

    return intervalMap[interval] || '1m';
  }

  async getAccountInfo(): Promise<AccountInfo> {
    if (!this.connected) throw new Error('Exchange not connected');
    
    try {
      const response = await this.client.getAccountInformation();

      return {
        balances: response.balances
          .filter(balance => parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0)
          .map(balance => ({
            asset: balance.asset,
            free: parseFloat(balance.free),
            locked: parseFloat(balance.locked),
            total: parseFloat(balance.free) + parseFloat(balance.locked)
          })),
        makerCommission: response.makerCommission,
        takerCommission: response.takerCommission,
        canTrade: response.canTrade,
        canWithdraw: response.canWithdraw,
        canDeposit: response.canDeposit,
        updateTime: response.updateTime
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log.error('[BinanceExchange] Failed to get account info', { error: errorMessage });
      throw new Error(`Failed to get account info: ${errorMessage}`);
    }
  }

  async getBalance(asset?: string): Promise<Balance[]> {
    if (!this.connected) throw new Error('Exchange not connected');
    
    try {
      const accountInfo = await this.getAccountInfo();
      
      if (asset) {
        return accountInfo.balances.filter(balance => balance.asset === asset);
      }
      
      return accountInfo.balances;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log.error('[BinanceExchange] Failed to get balance', { asset, error: errorMessage });
      throw new Error(`Failed to get balance: ${errorMessage}`);
    }
  }

  async placeOrder(orderRequest: OrderRequest): Promise<Order> {
    if (!this.connected) throw new Error('Exchange not connected');
    
    try {
      const binanceSymbol = orderRequest.symbol.replace('/', '');
      
      // Formater la quantité selon les règles de précision de Binance
      const formattedQuantity = this.formatQuantity(binanceSymbol, orderRequest.quantity);
      
      const binanceOrder: any = {
        symbol: binanceSymbol,
        side: orderRequest.side,
        type: orderRequest.type,
        quantity: formattedQuantity,
      };

      // Ajouter le prix pour les ordres LIMIT
      if (orderRequest.type === 'LIMIT' && orderRequest.price) {
        binanceOrder.price = this.formatPrice(binanceSymbol, orderRequest.price);
        binanceOrder.timeInForce = 'GTC'; // Good Till Cancelled par défaut
      }

      // Ajouter le prix stop si fourni
      if (orderRequest.stopPrice) {
        binanceOrder.stopPrice = this.formatPrice(binanceSymbol, orderRequest.stopPrice);
      }

      const response = await this.client.submitNewOrder(binanceOrder);

      return {
        id: response.orderId.toString(),
        clientOrderId: response.clientOrderId,
        symbol: orderRequest.symbol,
        side: BINANCE_ORDER_SIDE_MAP[response.side] || 'BUY',
        type: BINANCE_ORDER_TYPE_MAP[response.type] || 'MARKET',
        quantity: parseFloat(response.origQty),
        price: response.price ? parseFloat(response.price) : undefined,
        stopPrice: response.stopPrice ? parseFloat(response.stopPrice) : undefined,
        status: BINANCE_ORDER_STATUS_MAP[response.status] || 'PENDING',
        filled: parseFloat(response.executedQty),
        remaining: parseFloat(response.origQty) - parseFloat(response.executedQty),
        average: response.fills?.length > 0 ? 
          response.fills.reduce((acc: number, fill: any) => acc + parseFloat(fill.price), 0) / response.fills.length : 
          undefined,
        fee: response.fills?.reduce((acc: number, fill: any) => acc + parseFloat(fill.commission || '0'), 0),
        feeCurrency: response.fills?.[0]?.commissionAsset,
        timestamp: response.transactTime,
        updatedAt: response.transactTime
      };
    } catch (error: any) {
      // Binance API errors have a specific structure
      const errorMessage = error?.message || 'Unknown error';
      const errorCode = error?.code;
      const errorData = error?.data || error?.response?.data;
      
      log.error('[BinanceExchange] Failed to place order', { 
        orderRequest, 
        error,
        errorMessage,
        errorCode,
        errorData,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      throw new Error(`Failed to place order: ${errorMessage} (Code: ${errorCode})`);
    }
  }

  async cancelOrder(symbol: string, orderId: string): Promise<Order> {
    if (!this.connected) throw new Error('Exchange not connected');
    
    try {
      const binanceSymbol = symbol.replace('/', '');
      const response = await this.client.cancelOrder({
        symbol: binanceSymbol,
        orderId: parseInt(orderId)
      });

      return {
        id: response.orderId.toString(),
        clientOrderId: response.clientOrderId,
        symbol,
        side: BINANCE_ORDER_SIDE_MAP[response.side] || 'BUY',
        type: BINANCE_ORDER_TYPE_MAP[response.type] || 'MARKET',
        quantity: parseFloat(response.origQty),
        price: response.price ? parseFloat(response.price) : undefined,
        status: BINANCE_ORDER_STATUS_MAP[response.status] || 'CANCELLED',
        filled: parseFloat(response.executedQty),
        remaining: parseFloat(response.origQty) - parseFloat(response.executedQty),
        timestamp: Date.now(),
        updatedAt: Date.now()
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log.error('[BinanceExchange] Failed to cancel order', { symbol, orderId, error: errorMessage });
      throw new Error(`Failed to cancel order: ${errorMessage}`);
    }
  }

  async getOrder(symbol: string, orderId: string): Promise<Order> {
    if (!this.connected) throw new Error('Exchange not connected');
    
    try {
      const binanceSymbol = symbol.replace('/', '');
      const response = await this.client.getOrder({
        symbol: binanceSymbol,
        orderId: parseInt(orderId)
      });

      return {
        id: response.orderId.toString(),
        clientOrderId: response.clientOrderId,
        symbol,
        side: BINANCE_ORDER_SIDE_MAP[response.side] || 'BUY',
        type: BINANCE_ORDER_TYPE_MAP[response.type] || 'MARKET',
        quantity: parseFloat(response.origQty),
        price: response.price ? parseFloat(response.price) : undefined,
        status: BINANCE_ORDER_STATUS_MAP[response.status] || 'PENDING',
        filled: parseFloat(response.executedQty),
        remaining: parseFloat(response.origQty) - parseFloat(response.executedQty),
        average: parseFloat(response.cummulativeQuoteQty) / parseFloat(response.executedQty) || undefined,
        timestamp: response.time,
        updatedAt: response.updateTime
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log.error('[BinanceExchange] Failed to get order', { symbol, orderId, error: errorMessage });
      throw new Error(`Failed to get order: ${errorMessage}`);
    }
  }

  async getOpenOrders(symbol?: string): Promise<Order[]> {
    if (!this.connected) throw new Error('Exchange not connected');
    
    try {
      const params: any = {};
      if (symbol) {
        params.symbol = symbol.replace('/', '');
      }

      const response = await this.client.getCurrentOpenOrders(params);

      return response.map(order => ({
        id: order.orderId.toString(),
        clientOrderId: order.clientOrderId,
        symbol: symbol || order.symbol,
        side: BINANCE_ORDER_SIDE_MAP[order.side] || 'BUY',
        type: BINANCE_ORDER_TYPE_MAP[order.type] || 'MARKET',
        quantity: parseFloat(order.origQty),
        price: order.price ? parseFloat(order.price) : undefined,
        status: BINANCE_ORDER_STATUS_MAP[order.status] || 'PENDING',
        filled: parseFloat(order.executedQty),
        remaining: parseFloat(order.origQty) - parseFloat(order.executedQty),
        timestamp: order.time,
        updatedAt: order.updateTime
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log.error('[BinanceExchange] Failed to get open orders', { symbol, error: errorMessage });
      throw new Error(`Failed to get open orders: ${errorMessage}`);
    }
  }

  async getOrderHistory(symbol?: string, limit = 100): Promise<Order[]> {
    if (!this.connected) throw new Error('Exchange not connected');
    
    try {
      if (!symbol) {
        throw new Error('Symbol is required for Binance order history');
      }

      const binanceSymbol = symbol.replace('/', '');
      const response = await this.client.getAllOrders({
        symbol: binanceSymbol,
        limit
      });

      return response.map(order => ({
        id: order.orderId.toString(),
        clientOrderId: order.clientOrderId,
        symbol,
        side: BINANCE_ORDER_SIDE_MAP[order.side] || 'BUY',
        type: BINANCE_ORDER_TYPE_MAP[order.type] || 'MARKET',
        quantity: parseFloat(order.origQty),
        price: order.price ? parseFloat(order.price) : undefined,
        status: BINANCE_ORDER_STATUS_MAP[order.status] || 'PENDING',
        filled: parseFloat(order.executedQty),
        remaining: parseFloat(order.origQty) - parseFloat(order.executedQty),
        average: parseFloat(order.cummulativeQuoteQty) / parseFloat(order.executedQty) || undefined,
        timestamp: order.time,
        updatedAt: order.updateTime
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log.error('[BinanceExchange] Failed to get order history', { symbol, error: errorMessage });
      throw new Error(`Failed to get order history: ${errorMessage}`);
    }
  }

  async getMyTrades(symbol: string, limit = 100): Promise<Trade[]> {
    if (!this.connected) throw new Error('Exchange not connected');
    
    try {
      const binanceSymbol = symbol.replace('/', '');
      const response = await this.client.getAccountTradeList({
        symbol: binanceSymbol,
        limit
      });

      return response.map(trade => ({
        id: trade.id.toString(),
        orderId: trade.orderId.toString(),
        symbol,
        side: trade.isBuyer ? 'BUY' : 'SELL',
        quantity: parseFloat(trade.qty),
        price: parseFloat(trade.price),
        fee: parseFloat(trade.commission),
        feeCurrency: trade.commissionAsset,
        timestamp: trade.time
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log.error('[BinanceExchange] Failed to get my trades', { symbol, error: errorMessage });
      throw new Error(`Failed to get trades: ${errorMessage}`);
    }
  }

  // Méthodes WebSocket pour les abonnements temps réel
  subscribeToTicker(symbol: string, callback: (ticker: Ticker) => void): void {
    if (!this.wsClient) {
      log.warn('[BinanceExchange] WebSocket not initialized, cannot subscribe to ticker');
      return;
    }

    const binanceSymbol = symbol.replace('/', '').toLowerCase();
    const streamName = `${binanceSymbol}@ticker`;
    
    this.wsClient.subscribeTo24hrTickerStream(binanceSymbol);
    this.on('ticker_update', (ticker: Ticker) => {
      if (ticker.symbol === symbol) {
        callback(ticker);
      }
    });

    this.wsSubscriptions.set(symbol + '_ticker', streamName);
    log.debug('[BinanceExchange] Subscribed to ticker stream', { symbol, streamName });
  }

  subscribeToOrderBook(symbol: string, callback: (orderBook: OrderBook) => void): void {
    if (!this.wsClient) {
      log.warn('[BinanceExchange] WebSocket not initialized, cannot subscribe to order book');
      return;
    }

    const binanceSymbol = symbol.replace('/', '').toLowerCase();
    const streamName = `${binanceSymbol}@depth`;
    
    this.wsClient.subscribeToPartialBookDepthStream(binanceSymbol, '20', '100ms');
    this.on('orderbook_update', (orderBook: any) => {
      if (orderBook.symbol === symbol) {
        callback(orderBook);
      }
    });

    this.wsSubscriptions.set(symbol + '_orderbook', streamName);
    log.debug('[BinanceExchange] Subscribed to order book stream', { symbol, streamName });
  }

  unsubscribe(streamId: string): void {
    if (!this.wsClient) return;

    // Trouver et supprimer l'abonnement
    for (const [key, value] of this.wsSubscriptions) {
      if (value === streamId) {
        this.wsSubscriptions.delete(key);
        break;
      }
    }

    log.debug('[BinanceExchange] Unsubscribed from stream', { streamId });
  }

  // Méthodes publiques pour les événements temps réel
  public onTradeExecuted(callback: (trade: Trade) => void): void {
    this.on('trade_executed', callback);
  }

  public onTickerUpdate(callback: (ticker: Ticker) => void): void {
    this.on('ticker_update', callback);
  }

  public onOrderBookUpdate(callback: (orderBook: OrderBook) => void): void {
    this.on('orderbook_update', callback);
  }

  // Nettoyage des événements
  public removeAllRealtimeListeners(): void {
    this.removeAllListeners('trade_executed');
    this.removeAllListeners('ticker_update');
    this.removeAllListeners('orderbook_update');
  }

  /**
   * Formate la quantité selon les règles de précision de Binance pour un symbole donné
   */
  private formatQuantity(symbol: string, quantity: number): string {
    if (!this.exchangeInfo) {
      // Fallback: utiliser 8 décimales maximum
      return parseFloat(quantity.toFixed(8)).toString();
    }

    // Trouver les informations du symbole
    const symbolInfo = this.exchangeInfo.symbols.find(s => s.symbol === symbol);
    if (!symbolInfo) {
      log.warn(`[BinanceExchange] Symbol ${symbol} not found in exchange info, using fallback precision`);
      return parseFloat(quantity.toFixed(8)).toString();
    }

    // Utiliser les filtres LOT_SIZE pour déterminer la précision
    const stepSize = symbolInfo.stepSize;
    const minQty = symbolInfo.minQty;
    const maxQty = symbolInfo.maxQty;

    // Vérifier les limites min/max
    if (quantity < minQty) {
      log.warn(`[BinanceExchange] Quantity ${quantity} below minimum ${minQty} for ${symbol}`);
      throw new Error(`Quantity ${quantity} is below minimum ${minQty} for ${symbol}`);
    }
    if (quantity > maxQty) {
      log.warn(`[BinanceExchange] Quantity ${quantity} above maximum ${maxQty} for ${symbol}`);
      throw new Error(`Quantity ${quantity} is above maximum ${maxQty} for ${symbol}`);
    }

    // Calculer le nombre de décimales basé sur stepSize
    let precision = 0;
    if (stepSize > 0) {
      const stepStr = stepSize.toString();
      if (stepStr.includes('.')) {
        precision = stepStr.split('.')[1].replace(/0+$/, '').length;
      }
    }

    // Arrondir à la précision appropriée selon stepSize
    const adjustedQuantity = Math.floor(quantity / stepSize) * stepSize;
    const formattedQuantity = adjustedQuantity.toFixed(precision);
    
    log.debug(`[BinanceExchange] Formatted quantity for ${symbol}`, {
      original: quantity,
      stepSize,
      precision,
      adjusted: adjustedQuantity,
      formatted: formattedQuantity
    });

    return parseFloat(formattedQuantity).toString();
  }

  /**
   * Formate le prix selon les règles de précision de Binance pour un symbole donné
   */
  private formatPrice(symbol: string, price: number): string {
    if (!this.exchangeInfo) {
      return parseFloat(price.toFixed(8)).toString();
    }

    const symbolInfo = this.exchangeInfo.symbols.find(s => s.symbol === symbol);
    if (!symbolInfo) {
      return parseFloat(price.toFixed(8)).toString();
    }

    // Utiliser tickSize pour la précision du prix
    const tickSize = symbolInfo.tickSize;
    let precision = 0;
    
    if (tickSize > 0) {
      const tickStr = tickSize.toString();
      if (tickStr.includes('.')) {
        precision = tickStr.split('.')[1].replace(/0+$/, '').length;
      }
    }

    const adjustedPrice = Math.round(price / tickSize) * tickSize;
    return adjustedPrice.toFixed(precision);
  }
}