// src/lib/trading/exchanges/exchange_factory.ts
import { BaseExchange } from './base_exchange';
import { MockExchange } from './mock_exchange';
import { log } from '@/lib/logger';

export type ExchangeType = 'mock' | 'binance' | 'coinbase';

export interface ExchangeConfig {
  type: ExchangeType;
  apiKey?: string;
  apiSecret?: string;
  sandbox?: boolean;
  rateLimit?: number;
}

export class ExchangeFactory {
  private static instances = new Map<string, BaseExchange>();

  static async create(config: ExchangeConfig): Promise<BaseExchange> {
    const instanceKey = `${config.type}_${config.sandbox ? 'sandbox' : 'live'}`;
    
    // Réutiliser l'instance existante si elle existe
    const existingInstance = this.instances.get(instanceKey);
    if (existingInstance && existingInstance.isConnected()) {
      return existingInstance;
    }

    let exchange: BaseExchange;

    switch (config.type) {
      case 'mock':
        exchange = new MockExchange();
        break;
        
      case 'binance':
        // TODO: Implémenter BinanceExchange
        throw new Error('Binance exchange not implemented yet. Use mock for testing.');
        
      case 'coinbase':
        // TODO: Implémenter CoinbaseExchange
        throw new Error('Coinbase exchange not implemented yet. Use mock for testing.');
        
      default:
        throw new Error(`Exchange type ${config.type} not supported`);
    }

    // Connexion à l'exchange
    try {
      await exchange.connect();
      this.instances.set(instanceKey, exchange);
      
      log.info('[ExchangeFactory] Exchange created and connected', {
        type: config.type,
        sandbox: config.sandbox,
        instanceKey
      });
      
      return exchange;
    } catch (error) {
      log.error('[ExchangeFactory] Failed to connect to exchange', {
        type: config.type,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  static async disconnect(type: ExchangeType, sandbox = false): Promise<void> {
    const instanceKey = `${type}_${sandbox ? 'sandbox' : 'live'}`;
    const instance = this.instances.get(instanceKey);
    
    if (instance) {
      await instance.disconnect();
      this.instances.delete(instanceKey);
      
      log.info('[ExchangeFactory] Exchange disconnected', { type, sandbox });
    }
  }

  static async disconnectAll(): Promise<void> {
    const disconnectPromises = Array.from(this.instances.values()).map(exchange => 
      exchange.disconnect()
    );
    
    await Promise.all(disconnectPromises);
    this.instances.clear();
    
    log.info('[ExchangeFactory] All exchanges disconnected');
  }

  static getConnectedExchanges(): { type: string; connected: boolean }[] {
    return Array.from(this.instances.entries()).map(([key, exchange]) => ({
      type: key,
      connected: exchange.isConnected()
    }));
  }
}