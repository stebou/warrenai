/**
 * Coinbase Trade API Client pour les swaps on-chain
 * Supporte Ethereum et Base networks
 */

import axios, { AxiosResponse } from 'axios';

export interface CoinbaseTradeConfig {
  apiKey: string;
  apiSecret: string;
  baseUrl?: string;
  network: 'ethereum' | 'base';
}

export interface SwapQuoteRequest {
  from_asset: string;           // Token à vendre (ex: "ETH")
  to_asset: string;            // Token à acheter (ex: "USDC")  
  amount: string;              // Montant à échanger
  trade_type: 'exact_input' | 'exact_output';
  network_id: string;          // "ethereum-mainnet" ou "base-mainnet"
}

export interface SwapQuoteResponse {
  from_asset: {
    asset_id: string;
    amount: string;
  };
  to_asset: {
    asset_id: string;
    amount: string;
  };
  price_impact: string;
  gas_estimate: {
    gas_limit: string;
    gas_price: string;
    total_fee: string;
  };
  slippage_tolerance: string;
  expires_at: string;
  quote_id: string;
}

export interface SwapExecuteRequest {
  quote_id: string;
  wallet_id: string;
  slippage_tolerance?: string;
}

export interface SwapExecuteResponse {
  trade_id: string;
  status: 'pending' | 'completed' | 'failed';
  transaction_hash?: string;
  from_asset: {
    asset_id: string;
    amount: string;
  };
  to_asset: {
    asset_id: string;
    amount: string;
  };
  network_fee: {
    amount: string;
    asset: string;
  };
  created_at: string;
}

export class CoinbaseTradeClient {
  private config: CoinbaseTradeConfig;
  private baseUrl: string;

  constructor(config: CoinbaseTradeConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://api.coinbase.com/api/v1';
  }

  /**
   * Obtenir un devis pour un swap
   */
  async getSwapQuote(request: SwapQuoteRequest): Promise<SwapQuoteResponse> {
    try {
      const response: AxiosResponse<SwapQuoteResponse> = await axios.post(
        `${this.baseUrl}/trades/quote`,
        request,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
            'User-Agent': 'WarrenAI-TradingBot/1.0'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du devis:', error);
      throw new Error('Impossible d\'obtenir le devis de swap');
    }
  }

  /**
   * Exécuter un swap
   */
  async executeSwap(request: SwapExecuteRequest): Promise<SwapExecuteResponse> {
    try {
      const response: AxiosResponse<SwapExecuteResponse> = await axios.post(
        `${this.baseUrl}/trades/execute`,
        request,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
            'User-Agent': 'WarrenAI-TradingBot/1.0'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'exécution du swap:', error);
      throw new Error('Impossible d\'exécuter le swap');
    }
  }

  /**
   * Obtenir le statut d'un trade
   */
  async getTradeStatus(tradeId: string): Promise<SwapExecuteResponse> {
    try {
      const response: AxiosResponse<SwapExecuteResponse> = await axios.get(
        `${this.baseUrl}/trades/${tradeId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'User-Agent': 'WarrenAI-TradingBot/1.0'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du statut:', error);
      throw new Error('Impossible de récupérer le statut du trade');
    }
  }

  /**
   * Obtenir les assets supportés pour un réseau
   */
  async getSupportedAssets(networkId: string): Promise<any[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/assets?network_id=${networkId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'User-Agent': 'WarrenAI-TradingBot/1.0'
          }
        }
      );

      return response.data.data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des assets:', error);
      throw new Error('Impossible de récupérer les assets supportés');
    }
  }

  /**
   * Calculer le prix impact d'un trade
   */
  calculatePriceImpact(quote: SwapQuoteResponse): number {
    return parseFloat(quote.price_impact);
  }

  /**
   * Vérifier si le slippage est acceptable
   */
  isSlippageAcceptable(quote: SwapQuoteResponse, maxSlippage: number): boolean {
    const currentSlippage = parseFloat(quote.slippage_tolerance);
    return currentSlippage <= maxSlippage;
  }

  /**
   * Estimer les frais totaux (gas + network fees)
   */
  estimateTotalFees(quote: SwapQuoteResponse): {
    gasLimit: string;
    gasPrice: string;
    totalFee: string;
  } {
    return quote.gas_estimate;
  }
}