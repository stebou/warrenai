/**
 * Coinbase Advanced Trade SDK Officiel
 * Utilise le SDK officiel de Coinbase: @coinbase-sample/advanced-trade-sdk-ts
 * Documentation: https://github.com/coinbase-samples/advanced-sdk-ts
 */

import { 
  CoinbaseAdvTradeCredentials,
  CoinbaseAdvTradeClient,
  AccountsService,
  ProductsService,
  OrdersService
} from '@coinbase-sample/advanced-trade-sdk-ts';

export interface CoinbaseOfficialSDKConfig {
  keyName: string; // Format: organizations/{org_id}/apiKeys/{key_id}
  privateKey: string; // Clé privée ECDSA au format PEM
}

export interface CoinbaseSDKAccount {
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
}

export interface CoinbaseSDKProduct {
  product_id: string;
  price: string;
  price_percentage_change_24h: string;
  volume_24h: string;
  base_name: string;
  quote_name: string;
  status: string;
  trading_disabled: boolean;
}

export interface CoinbaseSDKOrder {
  order_id: string;
  product_id: string;
  side: 'BUY' | 'SELL';
  status: string;
  created_time: string;
  filled_size: string;
  average_filled_price: string;
  fee: string;
}

export class CoinbaseOfficialSDK {
  private credentials: CoinbaseAdvTradeCredentials;
  private client: CoinbaseAdvTradeClient;
  private accountsService: AccountsService;
  private productsService: ProductsService;
  private ordersService: OrdersService;

  constructor(config: CoinbaseOfficialSDKConfig) {
    console.log('🏦 Initialisation SDK Officiel Coinbase Advanced Trade');
    console.log(`   Key Name: ${config.keyName.substring(0, 40)}...`);
    
    // Créer les credentials selon la documentation officielle
    this.credentials = new CoinbaseAdvTradeCredentials(
      config.keyName,
      config.privateKey.replace(/\\n/g, '\n') // Nettoyer les \n échappés
    );
    
    // Créer le client
    this.client = new CoinbaseAdvTradeClient(this.credentials);
    
    // Initialiser les services
    this.accountsService = new AccountsService(this.client);
    this.productsService = new ProductsService(this.client);
    this.ordersService = new OrdersService(this.client);
    
    console.log('✅ SDK Officiel Coinbase initialisé avec succès');
  }

  /**
   * Teste la connexion à l'API
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('📞 Test de connexion avec SDK officiel...');
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
  async getAccounts(): Promise<CoinbaseSDKAccount[]> {
    try {
      console.log('📞 Récupération des comptes via SDK officiel...');
      
      const response = await this.accountsService
        .listAccounts({})
        .catch(error => {
          console.error('Erreur lors de listAccounts:', error);
          throw error;
        });
      
      console.log('✅ Comptes récupérés via SDK officiel:', response);
      
      // Adapter le format de réponse
      if (response && response.accounts) {
        return response.accounts.map((account: any) => ({
          uuid: account.uuid || account.account_id,
          name: account.name || account.currency,
          currency: account.currency,
          available_balance: {
            value: account.available_balance?.value || '0',
            currency: account.available_balance?.currency || account.currency
          },
          default: account.default || false,
          active: account.active !== false,
          created_at: account.created_at || new Date().toISOString(),
          updated_at: account.updated_at || new Date().toISOString(),
          type: account.type || 'ACCOUNT_TYPE_CRYPTO',
          ready: account.ready !== false
        }));
      }
      
      return [];
    } catch (error: any) {
      console.error('❌ Erreur récupération comptes SDK:', error);
      throw error;
    }
  }

  /**
   * Récupère les informations d'un produit
   */
  async getProduct(productId: string): Promise<CoinbaseSDKProduct> {
    try {
      console.log(`📊 Récupération produit ${productId} via SDK officiel...`);
      
      const response = await this.productsService
        .getProduct({ product_id: productId })
        .catch(error => {
          console.error('Erreur lors de getProduct:', error);
          throw error;
        });
      
      console.log('✅ Produit récupéré via SDK officiel:', response);
      
      return {
        product_id: response.product_id || productId,
        price: response.price || '0',
        price_percentage_change_24h: response.price_percentage_change_24h || '0',
        volume_24h: response.volume_24h || '0',
        base_name: response.base_name || '',
        quote_name: response.quote_name || '',
        status: response.status || 'online',
        trading_disabled: response.trading_disabled || false
      };
    } catch (error: any) {
      console.error(`❌ Erreur récupération produit ${productId}:`, error);
      throw error;
    }
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
  ): Promise<CoinbaseSDKOrder> {
    try {
      console.log(`📈 Placement ordre ${side} ${size} ${productId} via SDK officiel...`);

      const orderRequest = {
        client_order_id: `warren-sdk-${Date.now()}`,
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

      const response = await this.ordersService
        .createOrder(orderRequest)
        .catch(error => {
          console.error('Erreur lors de createOrder:', error);
          throw error;
        });

      console.log('✅ Ordre placé via SDK officiel:', response);

      // Adapter la réponse
      if (response && response.success_response) {
        return {
          order_id: response.success_response.order_id,
          product_id: response.success_response.product_id || productId,
          side: response.success_response.side as 'BUY' | 'SELL',
          status: 'PENDING',
          created_time: new Date().toISOString(),
          filled_size: '0',
          average_filled_price: '0',
          fee: '0'
        };
      } else {
        throw new Error(`Ordre échoué: ${response.failure_reason || 'Raison inconnue'}`);
      }
    } catch (error: any) {
      console.error('❌ Erreur placement ordre SDK:', error);
      throw error;
    }
  }

  /**
   * Récupère l'historique des ordres
   */
  async getOrders(productId?: string, limit: number = 100): Promise<CoinbaseSDKOrder[]> {
    try {
      console.log('📚 Récupération historique des ordres via SDK officiel...');
      
      const request: any = { limit: limit.toString() };
      if (productId) {
        request.product_id = productId;
      }

      const response = await this.ordersService
        .listOrders(request)
        .catch(error => {
          console.error('Erreur lors de listOrders:', error);
          throw error;
        });

      console.log('✅ Historique récupéré via SDK officiel:', response);

      // Adapter la réponse
      if (response && response.orders) {
        return response.orders.map((order: any) => ({
          order_id: order.order_id,
          product_id: order.product_id,
          side: order.side as 'BUY' | 'SELL',
          status: order.status,
          created_time: order.created_time,
          filled_size: order.filled_size || '0',
          average_filled_price: order.average_filled_price || '0',
          fee: order.fee || '0'
        }));
      }

      return [];
    } catch (error: any) {
      console.error('❌ Erreur récupération historique SDK:', error);
      throw error;
    }
  }

  /**
   * Annule un ordre
   */
  async cancelOrder(orderId: string): Promise<boolean> {
    try {
      console.log(`❌ Annulation ordre ${orderId} via SDK officiel...`);
      
      const response = await this.ordersService
        .cancelOrders({ order_ids: [orderId] })
        .catch(error => {
          console.error('Erreur lors de cancelOrders:', error);
          throw error;
        });

      console.log('✅ Ordre annulé via SDK officiel:', response);
      
      return response && response.results && response.results.length > 0;
    } catch (error: any) {
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