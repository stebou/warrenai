/**
 * Coinbase Advanced Exchange - Implémentation pour le bot de trading
 * Compatible avec l'architecture existante
 */

import { CoinbaseAdvancedClient, CoinbaseAdvancedConfig } from './coinbase_advanced_client';

export interface Order {
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  quantity: number;
  price?: number;
  clientOrderId?: string;
}

export interface Balance {
  asset: string;
  free: number;
  locked: number;
  total: number;
}

export interface Position {
  symbol: string;
  side: 'long' | 'short';
  size: number;
  avgPrice: number;
  unrealizedPnl: number;
  timestamp: number;
}

export class CoinbaseAdvancedExchange {
  private client: CoinbaseAdvancedClient;
  private config: CoinbaseAdvancedConfig;
  private connected: boolean = false;

  constructor(config: CoinbaseAdvancedConfig) {
    this.config = config;
    this.client = new CoinbaseAdvancedClient(config);
  }

  async connect(): Promise<void> {
    try {
      const isConnected = await this.client.testConnection();
      if (!isConnected) {
        throw new Error('Impossible de se connecter à Coinbase Advanced Trade API');
      }
      
      this.connected = true;
      console.log('✅ Coinbase Advanced Exchange connecté');
    } catch (error) {
      console.error('❌ Erreur de connexion Coinbase Advanced:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    console.log('🔌 Coinbase Advanced Exchange déconnecté');
  }

  isConnected(): boolean {
    return this.connected;
  }

  async placeOrder(order: Order): Promise<string> {
    try {
      console.log(`📊 Placement ordre: ${order.side} ${order.quantity} ${order.symbol}`);

      const productId = this.formatSymbol(order.symbol);
      
      if (order.type === 'market') {
        // Ordre au marché
        const sizeType = order.side === 'buy' ? 'quote' : 'base';
        const result = await this.client.createMarketOrder(
          productId,
          order.side === 'buy' ? 'BUY' : 'SELL',
          order.quantity.toString(),
          sizeType
        );
        
        return result.order_id;
      } else {
        // Ordre à cours limité
        if (!order.price) {
          throw new Error('Prix requis pour un ordre limit');
        }
        
        const result = await this.client.createLimitOrder(
          productId,
          order.side === 'buy' ? 'BUY' : 'SELL',
          order.quantity.toString(),
          order.price.toString()
        );
        
        return result.order_id;
      }
    } catch (error) {
      console.error('❌ Erreur placement ordre:', error);
      throw error;
    }
  }

  async cancelOrder(orderId: string): Promise<void> {
    try {
      const success = await this.client.cancelOrder(orderId);
      if (!success) {
        throw new Error(`Impossible d'annuler l'ordre ${orderId}`);
      }
    } catch (error) {
      console.error(`❌ Erreur annulation ordre ${orderId}:`, error);
      throw error;
    }
  }

  async getOrderStatus(orderId: string): Promise<any> {
    try {
      return await this.client.getOrder(orderId);
    } catch (error) {
      console.error(`❌ Erreur récupération statut ${orderId}:`, error);
      throw error;
    }
  }

  async getBalance(asset?: string): Promise<Balance[]> {
    try {
      const balances = await this.client.getBalances();
      const result: Balance[] = [];
      
      for (const [currency, amount] of Object.entries(balances)) {
        if (!asset || currency === asset) {
          result.push({
            asset: currency,
            free: amount,
            locked: 0, // Coinbase ne sépare pas les fonds bloqués dans cette API
            total: amount
          });
        }
      }
      
      return result;
    } catch (error) {
      console.error('❌ Erreur récupération balances:', error);
      throw error;
    }
  }

  async getPositions(): Promise<Position[]> {
    // Coinbase Advanced ne gère pas les positions comme un exchange de futures
    // Les positions sont représentées par les balances
    return [];
  }

  async getPrice(symbol: string): Promise<number> {
    try {
      const productId = this.formatSymbol(symbol);
      return await this.client.getPrice(productId);
    } catch (error) {
      console.error(`❌ Erreur récupération prix ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Convertir le format de symbole du bot vers le format Coinbase
   * Ex: BTCUSDT -> BTC-USD, ETHUSDC -> ETH-USDC
   */
  private formatSymbol(symbol: string): string {
    // Si c'est déjà au format Coinbase (avec tiret)
    if (symbol.includes('-')) {
      return symbol;
    }

    // Mapping des symboles communs
    const symbolMap: { [key: string]: string } = {
      'BTCUSDT': 'BTC-USD',
      'ETHUSDT': 'ETH-USD',
      'BTCUSDC': 'BTC-USDC',
      'ETHUSDC': 'ETH-USDC',
      'ADAUSDT': 'ADA-USD',
      'SOLUSDT': 'SOL-USD',
      'DOTUSDT': 'DOT-USD',
      'LINKUSDT': 'LINK-USD',
      'AVAXUSDT': 'AVAX-USD',
      'MATICUSDT': 'MATIC-USD'
    };

    // Vérifier la map d'abord
    if (symbolMap[symbol]) {
      return symbolMap[symbol];
    }

    // Tentative de parsing automatique
    // Supposer que les 3-4 derniers caractères sont la quote currency
    if (symbol.endsWith('USDT')) {
      const base = symbol.slice(0, -4);
      return `${base}-USD`;
    } else if (symbol.endsWith('USDC')) {
      const base = symbol.slice(0, -4);
      return `${base}-USDC`;
    } else if (symbol.endsWith('BTC')) {
      const base = symbol.slice(0, -3);
      return `${base}-BTC`;
    } else if (symbol.endsWith('ETH')) {
      const base = symbol.slice(0, -3);
      return `${base}-ETH`;
    }

    // Retourner tel quel si on ne peut pas convertir
    return symbol;
  }

  /**
   * Méthodes supplémentaires pour compatibilité avec l'architecture existante
   */
  async getExchangeInfo(): Promise<any> {
    return {
      name: 'Coinbase Advanced',
      rateLimits: [],
      symbols: []
    };
  }

  async getTicker(symbol: string): Promise<any> {
    const price = await this.getPrice(symbol);
    return {
      symbol,
      price,
      volume: 0,
      change24h: 0,
      high24h: price,
      low24h: price,
      timestamp: Date.now()
    };
  }

  async getOrderBook(symbol: string): Promise<any> {
    return {
      symbol,
      bids: [],
      asks: [],
      timestamp: Date.now()
    };
  }

  async testConnection(): Promise<boolean> {
    return await this.client.testConnection();
  }

  /**
   * Méthodes spécifiques à Coinbase
   */
  async getOrderHistory(productId?: string, limit: number = 100): Promise<any[]> {
    try {
      return await this.client.getOrders(productId, limit);
    } catch (error) {
      console.error('❌ Erreur récupération historique:', error);
      throw error;
    }
  }

  async getProduct(productId: string): Promise<any> {
    try {
      return await this.client.getProduct(productId);
    } catch (error) {
      console.error(`❌ Erreur récupération produit ${productId}:`, error);
      throw error;
    }
  }
}