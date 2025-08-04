/**
 * Coinbase DeFi Exchange Integration
 * Implémente l'interface BaseExchange pour les swaps on-chain via Trade API
 */

import { BaseExchange } from './base_exchange';
import { CoinbaseTradeClient, SwapQuoteRequest, SwapExecuteRequest } from './coinbase_trade_client';
import { Order, OrderSide, OrderType, Position, Balance } from './types';

export interface CoinbaseDeFiConfig {
  apiKey: string;
  apiSecret: string;
  walletId: string;
  network: 'ethereum' | 'base';
  maxSlippage: number; // En pourcentage (ex: 0.5 pour 0.5%)
  testMode: boolean;
}

export class CoinbaseDeFiExchange extends BaseExchange {
  private tradeClient: CoinbaseTradeClient;
  private config: CoinbaseDeFiConfig;

  constructor(config: CoinbaseDeFiConfig) {
    super();
    this.config = config;
    this.tradeClient = new CoinbaseTradeClient({
      apiKey: config.apiKey,
      apiSecret: config.apiSecret,
      network: config.network,
      baseUrl: config.testMode ? 'https://api-sandbox.coinbase.com/api/v1' : 'https://api.coinbase.com/api/v1'
    });
  }

  async connect(): Promise<void> {
    try {
      // Tester la connexion en récupérant les assets supportés
      const networkId = this.config.network === 'ethereum' ? 'ethereum-mainnet' : 'base-mainnet';
      await this.tradeClient.getSupportedAssets(networkId);
      console.log('✅ Coinbase DeFi Exchange connecté');
    } catch (error) {
      console.error('❌ Erreur de connexion Coinbase DeFi:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    console.log('🔌 Coinbase DeFi Exchange déconnecté');
  }

  async placeOrder(order: Order): Promise<string> {
    try {
      console.log(`📊 Placement d'ordre DeFi: ${order.side} ${order.quantity} ${order.symbol}`);

      // Conversion du symbole trading vers les asset IDs Coinbase
      const { fromAsset, toAsset } = this.parseSymbolForSwap(order.symbol, order.side);
      
      // Étape 1: Obtenir un devis
      const quoteRequest: SwapQuoteRequest = {
        from_asset: fromAsset,
        to_asset: toAsset,
        amount: order.quantity.toString(),
        trade_type: 'exact_input',
        network_id: this.config.network === 'ethereum' ? 'ethereum-mainnet' : 'base-mainnet'
      };

      const quote = await this.tradeClient.getSwapQuote(quoteRequest);
      
      // Vérifier le slippage
      if (!this.tradeClient.isSlippageAcceptable(quote, this.config.maxSlippage)) {
        throw new Error(`Slippage trop élevé: ${quote.slippage_tolerance}% > ${this.config.maxSlippage}%`);
      }

      // Vérifier le price impact
      const priceImpact = this.tradeClient.calculatePriceImpact(quote);
      if (priceImpact > 5) { // 5% max price impact
        console.warn(`⚠️  Price impact élevé: ${priceImpact}%`);
      }

      // Étape 2: Exécuter le swap si c'est un ordre market
      if (order.type === OrderType.MARKET) {
        const executeRequest: SwapExecuteRequest = {
          quote_id: quote.quote_id,
          wallet_id: this.config.walletId,
          slippage_tolerance: this.config.maxSlippage.toString()
        };

        const result = await this.tradeClient.executeSwap(executeRequest);
        
        console.log(`✅ Swap exécuté: ${result.trade_id}`);
        console.log(`📈 Prix: ${result.from_asset.amount} ${result.from_asset.asset_id} → ${result.to_asset.amount} ${result.to_asset.asset_id}`);
        
        return result.trade_id;
      }

      // Pour les ordres limit, on stocke le devis pour exécution future
      console.log(`📝 Ordre limit créé avec devis: ${quote.quote_id}`);
      return quote.quote_id;

    } catch (error) {
      console.error('❌ Erreur lors du placement d\'ordre:', error);
      throw error;
    }
  }

  async cancelOrder(orderId: string): Promise<void> {
    // Les swaps DeFi ne peuvent pas être annulés une fois exécutés
    // On peut seulement refuser d'exécuter un devis
    console.log(`❌ Impossible d'annuler un swap DeFi: ${orderId}`);
    throw new Error('Les swaps DeFi ne peuvent pas être annulés');
  }

  async getOrderStatus(orderId: string): Promise<any> {
    try {
      return await this.tradeClient.getTradeStatus(orderId);
    } catch (error) {
      console.error('❌ Erreur lors de la récupération du statut:', error);
      throw error;
    }
  }

  async getBalance(asset?: string): Promise<Balance[]> {
    // TODO: Implémenter via CDP Wallet API pour récupérer les balances
    console.log('📊 Récupération des balances DeFi...');
    return [];
  }

  async getPositions(): Promise<Position[]> {
    // Les positions DeFi sont représentées par les balances des tokens
    return [];
  }

  async getPrice(symbol: string): Promise<number> {
    try {
      // Obtenir un devis pour un montant minimal pour connaître le prix
      const { fromAsset, toAsset } = this.parseSymbolForSwap(symbol, OrderSide.BUY);
      
      const quote = await this.tradeClient.getSwapQuote({
        from_asset: fromAsset,
        to_asset: toAsset,
        amount: '1', // 1 unité pour obtenir le prix
        trade_type: 'exact_input',
        network_id: this.config.network === 'ethereum' ? 'ethereum-mainnet' : 'base-mainnet'
      });

      const price = parseFloat(quote.to_asset.amount) / parseFloat(quote.from_asset.amount);
      return price;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération du prix:', error);
      throw error;
    }
  }

  /**
   * Parse le symbole de trading pour déterminer les assets source et destination
   */
  private parseSymbolForSwap(symbol: string, side: OrderSide): { fromAsset: string; toAsset: string } {
    // Exemple: "ETHUSDC" -> BUY = ETH vers USDC, SELL = USDC vers ETH
    const baseAsset = symbol.slice(0, -4); // ETH
    const quoteAsset = symbol.slice(-4);   // USDC

    if (side === OrderSide.BUY) {
      return { fromAsset: quoteAsset, toAsset: baseAsset };
    } else {
      return { fromAsset: baseAsset, toAsset: quoteAsset };
    }
  }

  /**
   * Calculer les métriques de performance pour un swap
   */
  async getSwapMetrics(tradeId: string): Promise<{
    priceImpact: number;
    slippage: number;
    gasUsed: string;
    totalFees: string;
  }> {
    const status = await this.getOrderStatus(tradeId);
    
    return {
      priceImpact: 0, // À calculer depuis les données du trade
      slippage: 0,    // À calculer
      gasUsed: status.network_fee?.amount || '0',
      totalFees: status.network_fee?.amount || '0'
    };
  }
}