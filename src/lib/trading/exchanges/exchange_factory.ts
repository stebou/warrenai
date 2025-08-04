// src/lib/trading/exchanges/exchange_factory.ts
import { BaseExchange } from './base_exchange';
import { BinanceExchange } from './binance_exchange';
import { CoinbaseAdvancedExchange } from './coinbase_advanced_exchange';
import { CoinbaseAdvancedClient } from './coinbase_advanced_client_v2';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';

export type ExchangeType = 'binance' | 'coinbase' | 'coinbase-advanced';

export interface ExchangeConfig {
  type: ExchangeType;
  apiKey?: string;
  apiSecret?: string;
  sandbox?: boolean;
  testnet?: boolean; // Pour Binance testnet
  rateLimit?: number;
  userId?: string; // Pour récupérer les clés de l'utilisateur
  walletId?: string; // Pour Coinbase DeFi
  network?: 'ethereum' | 'base'; // Pour Coinbase DeFi
  maxSlippage?: number; // Pour Coinbase DeFi
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
      case 'binance':
        if (!config.apiKey || !config.apiSecret) {
          throw new Error('Binance exchange requires apiKey and apiSecret');
        }
        exchange = new BinanceExchange({
          apiKey: config.apiKey,
          apiSecret: config.apiSecret,
          testnet: config.testnet || false
        });
        break;
        
      case 'coinbase':
        // TODO: Implémenter CoinbaseExchange (OAuth API)
        throw new Error('Coinbase OAuth exchange not implemented yet.');
        
      case 'coinbase-advanced':
        if (!config.apiKey || !config.apiSecret) {
          throw new Error('Coinbase Advanced exchange requires apiKey and apiSecret');
        }
        exchange = new CoinbaseAdvancedExchange({
          apiKey: config.apiKey,
          apiSecret: config.apiSecret,
          sandbox: config.sandbox || false
        }) as any; // Cast temporaire pour compatibilité
        break;
        
        
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

  // Méthode pour créer un exchange en récupérant les clés de l'utilisateur
  static async createForUser(userId: string, exchangeType: ExchangeType = 'binance', testnet: boolean = true): Promise<BaseExchange> {
    try {
      // Récupérer les clés de l'utilisateur depuis la base de données
      let exchangeName: string;
      if (exchangeType === 'coinbase' || exchangeType === 'coinbase-advanced') {
        exchangeName = 'COINBASE';
      } else {
        exchangeName = exchangeType.toUpperCase();
      }
      
      const credentials = await prisma.exchangeCredentials.findFirst({
        where: {
          userId,
          exchange: exchangeName as any,
          isTestnet: exchangeType === 'coinbase' ? false : testnet, // Coinbase n'a pas de testnet
          isActive: true
        }
      });

      if (!credentials) {
        log.warn('[ExchangeFactory] No credentials found for user', { 
          userId, 
          exchangeType, 
          testnet 
        });
        throw new Error(`No ${exchangeType} credentials found for user ${userId}. Please connect your exchange account first.`);
      }

      // Créer l'exchange avec les clés de l'utilisateur
      let exchange: BaseExchange;
      
      if (exchangeType === 'coinbase' || exchangeType === 'coinbase-advanced') {
        // Pour Coinbase, utiliser directement CoinbaseAdvancedClient
        const coinbaseClient = new CoinbaseAdvancedClient({
          apiKeyName: credentials.apiKey,
          privateKey: credentials.apiSecret,
          sandbox: false
        });
        
        // Adapter le client Coinbase pour qu'il implémente BaseExchange
        exchange = {
          isConnected: () => true,
          connect: async () => { /* Coinbase se connecte automatiquement */ },
          disconnect: async () => { /* Pas de déconnexion nécessaire */ },
          getAccountInfo: async () => {
            const accounts = await coinbaseClient.getAccounts();
            return { accounts };
          },
          // Autres méthodes nécessaires...
        } as any; // Cast temporaire
      } else {
        exchange = await this.create({
          type: exchangeType,
          apiKey: credentials.apiKey,
          apiSecret: credentials.apiSecret,
          testnet
        });
      }

      // Mettre à jour la date de dernière utilisation
      await prisma.exchangeCredentials.update({
        where: { id: credentials.id },
        data: { lastUsed: new Date() }
      });

      log.info('[ExchangeFactory] Exchange created for user', {
        userId,
        exchangeType,
        testnet,
        credentialsId: credentials.id
      });

      return exchange;

    } catch (error) {
      log.error('[ExchangeFactory] Failed to create exchange for user', {
        userId,
        exchangeType,
        testnet,
        error: error instanceof Error ? error.message : String(error)
      });
      
      throw error;
    }
  }
}