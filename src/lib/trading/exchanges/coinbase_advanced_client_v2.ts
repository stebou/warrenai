/**
 * Coinbase Advanced Trade API Client
 * Implementation suivant les bonnes pratiques officielles Coinbase
 * Documentation: https://docs.cdp.coinbase.com/advanced-trade/docs/rest-api-auth
 */

import crypto from 'crypto';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import jwt from 'jsonwebtoken';

export interface CoinbaseAdvancedConfig {
  apiKeyName: string; // Format: organizations/{org_id}/apiKeys/{key_id}
  privateKey: string; // Clé privée ECDSA au format PEM
  sandbox?: boolean;
}

export interface CoinbaseAccount {
  uuid: string;
  name: string;
  currency: string;
  available_balance: {
    value: string;
    currency: string;
  };
  default: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
  type: string;
  ready: boolean;
  hold: {
    value: string;
    currency: string;
  };
}

export interface CoinbaseProduct {
  product_id: string;
  price: string;
  price_percentage_change_24h: string;
  volume_24h: string;
  volume_percentage_change_24h: string;
  base_increment: string;
  quote_increment: string;
  quote_min_size: string;
  quote_max_size: string;
  base_min_size: string;
  base_max_size: string;
  base_name: string;
  quote_name: string;
  watched: boolean;
  is_disabled: boolean;
  new: boolean;
  status: string;
  cancel_only: boolean;
  limit_only: boolean;
  post_only: boolean;
  trading_disabled: boolean;
  auction_mode: boolean;
  product_type: string;
}

export interface CoinbaseOrder {
  order_id: string;
  product_id: string;
  user_id: string;
  order_configuration: {
    market_market_ioc?: {
      quote_size?: string;
      base_size?: string;
    };
    limit_limit_gtc?: {
      base_size: string;
      limit_price: string;
      post_only: boolean;
    };
  };
  side: 'BUY' | 'SELL';
  client_order_id: string;
  status: string;
  time_in_force: string;
  created_time: string;
  completion_percentage: string;
  filled_size: string;
  average_filled_price: string;
  fee: string;
  number_of_fills: string;
  filled_value: string;
  pending_cancel: boolean;
  size_in_quote: boolean;
  total_fees: string;
  size_inclusive_of_fees: boolean;
  total_value_after_fees: string;
  trigger_status: string;
  order_type: string;
  reject_reason: string;
  settled: boolean;
  product_type: string;
  reject_message: string;
  cancel_message: string;
}

export class CoinbaseAdvancedClient {
  private config: CoinbaseAdvancedConfig;
  private httpClient: AxiosInstance;
  private baseURL: string;

  constructor(config: CoinbaseAdvancedConfig) {
    this.config = config;
    
    // URL de base selon l'environnement
    this.baseURL = config.sandbox 
      ? 'https://api-public.sandbox.exchange.coinbase.com'
      : 'https://api.coinbase.com/api/v3/brokerage';
    
    this.httpClient = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Warren-AI-Trading-Bot/1.0'
      }
    });
    
    console.log(`🏦 Coinbase Advanced Trade Client initialisé`);
    console.log(`   Base URL: ${this.baseURL}`);
    console.log(`   API Key: ${config.apiKeyName.substring(0, 30)}...`);
  }

  /**
   * Génère un JWT ES256 pour l'authentification
   * Suit les spécifications officielles Coinbase CDP
   */
  private generateJWT(method: string, path: string, body: string = ''): string {
    const timestamp = Math.floor(Date.now() / 1000);
    const uri = `${method.toUpperCase()} ${this.baseURL}${path}`;
    
    // Payload selon les spécifications officielles Coinbase
    const payload = {
      iss: 'coinbase-cloud', // Issuer officiel selon la doc
      nbf: timestamp, // Not before
      exp: timestamp + 120, // Expire dans 2 minutes
      sub: this.config.apiKeyName, // Subject = API Key Name complet
      uri: uri // URI complète selon les spécifications
    };

    // Header avec kid (Key ID) - doit être l'API Key Name complet
    const header = {
      kid: this.config.apiKeyName,
      typ: 'JWT',
      alg: 'ES256'
    };

    try {
      // Nettoyer la clé privée des échappements
      const cleanPrivateKey = this.config.privateKey.replace(/\\n/g, '\n');
      
      // Créer un objet clé privée avec Node.js crypto
      const privateKeyObject = crypto.createPrivateKey({
        key: cleanPrivateKey,
        format: 'pem',
        type: 'sec1' // Pour les clés ECDSA
      });

      // Signer avec ES256
      const token = jwt.sign(payload, privateKeyObject, {
        algorithm: 'ES256',
        header: header
      });

      return token;
    } catch (error) {
      console.error('❌ Erreur génération JWT:', error);
      throw new Error(`JWT generation failed: ${error}`);
    }
  }

  /**
   * Effectue une requête authentifiée à l'API Advanced Trade
   */
  private async makeAuthenticatedRequest<T = any>(
    method: string,
    path: string,
    data?: any
  ): Promise<T> {
    try {
      const bodyString = data ? JSON.stringify(data) : '';
      const jwt = this.generateJWT(method, path, bodyString);
      
      const config: AxiosRequestConfig = {
        method: method.toLowerCase() as any,
        url: path,
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json'
        }
      };

      if (data) {
        config.data = data;
      }

      const response = await this.httpClient.request<T>(config);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Erreur API ${method} ${path}:`, {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  }

  /**
   * Teste la connexion à l'API
   */
  async testConnection(): Promise<boolean> {
    try {
      const accounts = await this.getAccounts();
      console.log(`✅ Connexion réussie - ${accounts.length} comptes trouvés`);
      return true;
    } catch (error) {
      console.error('❌ Test de connexion échoué:', error);
      return false;
    }
  }

  /**
   * Récupère la liste des comptes
   */
  async getAccounts(): Promise<CoinbaseAccount[]> {
    console.log('📞 Récupération des comptes...');
    const response = await this.makeAuthenticatedRequest<{ data: CoinbaseAccount[] }>('GET', '/accounts');
    return response.data || [];
  }

  /**
   * Récupère les informations d'un produit (prix, etc.)
   */
  async getProduct(productId: string): Promise<CoinbaseProduct> {
    console.log(`📊 Récupération produit ${productId}...`);
    const response = await this.makeAuthenticatedRequest<CoinbaseProduct>('GET', `/products/${productId}`);
    return response;
  }

  /**
   * Récupère le prix actuel d'un produit
   */
  async getPrice(productId: string): Promise<number> {
    const product = await this.getProduct(productId);
    return parseFloat(product.price);
  }

  /**
   * Place un ordre au marché
   */
  async createMarketOrder(
    productId: string,
    side: 'BUY' | 'SELL',
    size: string,
    sizeType: 'quote' | 'base' = 'quote'
  ): Promise<CoinbaseOrder> {
    console.log(`📈 Placement ordre ${side} ${size} ${productId}...`);

    const orderData = {
      client_order_id: `warren-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      product_id: productId,
      side: side,
      order_configuration: {
        market_market_ioc: sizeType === 'quote' ? {
          quote_size: size
        } : {
          base_size: size
        }
      }
    };

    const response = await this.makeAuthenticatedRequest<{
      success: boolean;
      failure_reason?: string;
      order_id?: string;
      success_response?: {
        order_id: string;
        product_id: string;
        side: string;
        client_order_id: string;
      };
      error_response?: {
        error: string;
        message: string;
      };
    }>('POST', '/orders', orderData);

    if (response.success && response.success_response) {
      // Retourner l'ordre avec les données disponibles
      return {
        order_id: response.success_response.order_id,
        product_id: response.success_response.product_id,
        side: response.success_response.side as 'BUY' | 'SELL',
        client_order_id: response.success_response.client_order_id,
        status: 'PENDING',
        created_time: new Date().toISOString(),
        // Valeurs par défaut pour les champs requis
        user_id: '',
        order_configuration: orderData.order_configuration,
        time_in_force: 'IOC',
        completion_percentage: '0',
        filled_size: '0',
        average_filled_price: '0',
        fee: '0',
        number_of_fills: '0',
        filled_value: '0',
        pending_cancel: false,
        size_in_quote: sizeType === 'quote',
        total_fees: '0',
        size_inclusive_of_fees: false,
        total_value_after_fees: '0',
        trigger_status: '',
        order_type: 'MARKET',
        reject_reason: '',
        settled: false,
        product_type: 'SPOT',
        reject_message: '',
        cancel_message: ''
      } as CoinbaseOrder;
    } else {
      throw new Error(`Order failed: ${response.failure_reason || response.error_response?.message || 'Unknown error'}`);
    }
  }

  /**
   * Récupère l'historique des ordres
   */
  async getOrders(productId?: string, limit: number = 100): Promise<CoinbaseOrder[]> {
    console.log('📚 Récupération historique des ordres...');
    
    let path = '/orders/historical';
    const params = new URLSearchParams();
    
    if (productId) params.append('product_id', productId);
    params.append('limit', limit.toString());
    
    if (params.toString()) {
      path += '?' + params.toString();
    }

    const response = await this.makeAuthenticatedRequest<{ data: CoinbaseOrder[] }>('GET', path);
    return response.data || [];
  }

  /**
   * Annule un ordre
   */
  async cancelOrder(orderId: string): Promise<boolean> {
    console.log(`❌ Annulation ordre ${orderId}...`);
    
    try {
      const response = await this.makeAuthenticatedRequest<{
        success: boolean;
        failure_reason?: string;
      }>('POST', '/orders/batch_cancel', {
        order_ids: [orderId]
      });

      return response.success;
    } catch (error) {
      console.error(`❌ Erreur annulation ordre ${orderId}:`, error);
      return false;
    }
  }

  /**
   * Récupère les balances des comptes
   */
  async getBalances(): Promise<{ [currency: string]: number }> {
    const accounts = await this.getAccounts();
    const balances: { [currency: string]: number } = {};
    
    accounts.forEach(account => {
      balances[account.currency] = parseFloat(account.available_balance.value);
    });
    
    return balances;
  }
}