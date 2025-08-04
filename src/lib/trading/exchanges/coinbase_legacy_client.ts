/**
 * Coinbase Advanced Trade API Client (Legacy Authentication)
 * Utilise HMAC-SHA256 au lieu de JWT ES256
 */

import crypto from 'crypto';
import axios, { AxiosInstance } from 'axios';

export interface CoinbaseLegacyConfig {
  apiKey: string;
  apiSecret: string;
  sandbox?: boolean;
}

export interface CoinbaseLegacyAccount {
  uuid: string;
  name: string;
  currency: string;
  available_balance: {
    value: string;
    currency: string;
  };
  default: boolean;
}

export interface CoinbaseLegacyOrder {
  order_id: string;
  product_id: string;
  side: 'BUY' | 'SELL';
  status: string;
  time_in_force: string;
  created_time: string;
  completion_percentage: string;
  filled_size: string;
  average_filled_price: string;
  fee: string;
}

export class CoinbaseLegacyClient {
  private config: CoinbaseLegacyConfig;
  private httpClient: AxiosInstance;
  private baseURL: string;

  constructor(config: CoinbaseLegacyConfig) {
    this.config = config;
    this.baseURL = config.sandbox 
      ? 'https://api-public.sandbox.exchange.coinbase.com'
      : 'https://api.exchange.coinbase.com';
    
    this.httpClient = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
    });
    
    console.log(`🏦 Client Coinbase Legacy initialisé (sandbox: ${config.sandbox || false})`);
  }

  /**
   * Créer la signature HMAC-SHA256 pour l'authentification
   */
  private createSignature(timestamp: string, method: string, path: string, body: string = ''): string {
    const message = timestamp + method.toUpperCase() + path + body;
    const signature = crypto
      .createHmac('sha256', this.config.apiSecret)
      .update(message)
      .digest('hex');
    
    return signature;
  }

  /**
   * Effectuer une requête authentifiée
   */
  private async authenticatedRequest(method: string, path: string, body?: any): Promise<any> {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const bodyString = body ? JSON.stringify(body) : '';
    const signature = this.createSignature(timestamp, method, path, bodyString);
    
    const headers = {
      'CB-ACCESS-KEY': this.config.apiKey,
      'CB-ACCESS-SIGN': signature,
      'CB-ACCESS-TIMESTAMP': timestamp,
      'CB-ACCESS-PASSPHRASE': '', // Pas de passphrase pour les nouvelles clés
      'Content-Type': 'application/json',
    };

    try {
      const response = await this.httpClient.request({
        method: method.toLowerCase() as any,
        url: path,
        headers,
        data: body
      });
      
      return response.data;
    } catch (error: any) {
      console.error(`❌ Erreur requête ${method} ${path}:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Tester la connexion à l'API
   */
  async testConnection(): Promise<boolean> {
    try {
      const accounts = await this.getAccounts();
      return accounts.length >= 0; // Même 0 compte est une connexion réussie
    } catch (error) {
      console.error('Erreur de connexion Coinbase Legacy:', error);
      return false;
    }
  }

  /**
   * Récupérer les comptes avec l'API Legacy
   */
  async getAccounts(): Promise<CoinbaseLegacyAccount[]> {
    try {
      console.log('📞 Appel Legacy: /accounts');
      
      const response = await this.authenticatedRequest('GET', '/accounts');
      
      console.log('✅ Réponse Legacy reçue:', response);
      
      // La réponse est directement un array pour l'API legacy
      const accounts = Array.isArray(response) ? response : [];
      
      return accounts.map((account: any) => ({
        uuid: account.id,
        name: account.currency,
        currency: account.currency,
        available_balance: {
          value: account.available || '0',
          currency: account.currency
        },
        default: false
      }));
      
    } catch (error: any) {
      console.error('❌ Erreur Legacy getAccounts:', error);
      throw error;
    }
  }

  /**
   * Récupérer le prix actuel d'un produit
   */
  async getPrice(productId: string): Promise<number> {
    try {
      console.log(`📊 Récupération prix ${productId} via Legacy`);
      
      // Utiliser l'endpoint public pour le prix
      const response = await this.httpClient.get(`/products/${productId}/ticker`);
      
      console.log('✅ Prix récupéré via Legacy:', response.data);
      
      return parseFloat(response.data.price || '0');
      
    } catch (error: any) {
      console.error(`❌ Erreur récupération prix ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Placer un ordre au marché avec l'API Legacy
   */
  async createMarketOrder(
    productId: string, 
    side: 'BUY' | 'SELL', 
    size: string,
    sizeType: 'quote' | 'base' = 'quote'
  ): Promise<CoinbaseLegacyOrder> {
    try {
      console.log(`📊 Placement ordre Legacy ${side} ${size} ${productId}`);
      
      const orderData = {
        type: 'market',
        side: side.toLowerCase(),
        product_id: productId,
        [sizeType === 'quote' ? 'funds' : 'size']: size
      };

      const response = await this.authenticatedRequest('POST', '/orders', orderData);
      
      console.log('✅ Ordre placé via Legacy:', response);
      
      return {
        order_id: response.id,
        product_id: productId,
        side: side,
        status: response.status || 'PENDING',
        time_in_force: 'IOC',
        created_time: response.created_at || new Date().toISOString(),
        completion_percentage: '0',
        filled_size: response.filled_size || '0',
        average_filled_price: response.executed_value || '0',
        fee: response.fill_fees || '0'
      };
      
    } catch (error: any) {
      console.error('❌ Erreur placement ordre Legacy:', error);
      throw error;
    }
  }

  /**
   * Récupérer les balances des comptes
   */
  async getBalances(): Promise<{ [currency: string]: number }> {
    try {
      const accounts = await this.getAccounts();
      const balances: { [currency: string]: number } = {};
      
      accounts.forEach(account => {
        balances[account.currency] = parseFloat(account.available_balance.value);
      });
      
      return balances;
      
    } catch (error: any) {
      console.error('❌ Erreur récupération balances Legacy:', error);
      throw error;
    }
  }

  /**
   * Récupérer l'historique des ordres
   */
  async getOrders(productId?: string, limit: number = 100): Promise<CoinbaseLegacyOrder[]> {
    try {
      console.log(`📚 Récupération historique ordres via Legacy`);
      
      let path = '/orders';
      const params = new URLSearchParams();
      
      if (productId) params.append('product_id', productId);
      params.append('limit', limit.toString());
      
      if (params.toString()) {
        path += '?' + params.toString();
      }

      const response = await this.authenticatedRequest('GET', path);
      
      console.log('✅ Historique récupéré via Legacy:', response);
      
      const orders = Array.isArray(response) ? response : [];
      
      return orders.map((order: any) => ({
        order_id: order.id,
        product_id: order.product_id,
        side: order.side?.toUpperCase() || 'BUY',
        status: order.status,
        time_in_force: order.time_in_force || 'GTC',
        created_time: order.created_at,
        completion_percentage: '100', // Simplifié
        filled_size: order.filled_size || '0',
        average_filled_price: order.executed_value || '0',
        fee: order.fill_fees || '0'
      }));
      
    } catch (error: any) {
      console.error('❌ Erreur récupération historique Legacy:', error);
      throw error;
    }
  }

  /**
   * Annuler un ordre
   */
  async cancelOrder(orderId: string): Promise<boolean> {
    try {
      console.log(`❌ Annulation ordre ${orderId} via Legacy`);
      
      const response = await this.authenticatedRequest('DELETE', `/orders/${orderId}`);
      
      console.log('✅ Ordre annulé via Legacy:', response);
      
      return true;
      
    } catch (error: any) {
      console.error(`❌ Erreur annulation ordre ${orderId}:`, error);
      return false;
    }
  }
}