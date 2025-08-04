// src/lib/trading/bot/bot_controller.ts
import { BaseExchange } from '../exchanges/base_exchange';
import { ExchangeFactory } from '../exchanges/exchange_factory';
import { DatabasePersistence } from './db_persistence';
import { log } from '@/lib/logger';
import type { Bot } from '@prisma/client';
import type { OrderRequest, Order, Ticker } from '../exchanges/types';

export interface BotInstance {
  bot: Bot;
  exchange: BaseExchange;
  isRunning: boolean;
  startedAt?: number;
  lastAction?: number;
  stats: {
    trades: number;
    profit: number;
    errors: number;
    winningTrades: number;
    losingTrades: number;
  };
  positions: Map<string, { averagePrice: number; quantity: number }>; // Tracking des positions
  intervalId?: NodeJS.Timeout;
}

export interface TradingSignal {
  action: 'BUY' | 'SELL' | 'HOLD';
  symbol: string;
  quantity: number;
  price?: number;
  confidence: number; // 0-1
  reason: string;
}

export class BotController {
  private static instance: BotController;
  private activeBots = new Map<string, BotInstance>();
  private readonly DEFAULT_EXCHANGE = { type: 'mock' as const };
  private isInitialized = false;
  private persistedStats = new Map<string, { startedAt: number; stats: any; lastAction?: number }>();

  private constructor() {
    log.info('[BotController] Initialized');
    this.initializeFromPersistence();
  }

  private async initializeFromPersistence() {
    if (this.isInitialized) return;
    
    try {
      const persistedBots = await DatabasePersistence.loadActiveBots();
      log.info('[BotController] Initializing from persistence', { 
        persistedCount: persistedBots.length 
      });
      
      // Marquer comme initialisé même s'il n'y a pas de bots persistés
      this.isInitialized = true;
      
      // Stocker les stats persistées pour les restaurer lors du démarrage des bots
      if (persistedBots.length > 0) {
        log.info('[BotController] Found persisted bots with stats', {
          botIds: persistedBots.map(b => b.botId),
          stats: persistedBots.map(b => ({ id: b.botId, trades: b.trades, profit: b.profit, errors: b.errors }))
        });
        
        this.persistedStats = new Map(
          persistedBots.map(bot => [bot.botId, {
            startedAt: bot.startedAt.getTime(),
            stats: { trades: bot.trades, profit: bot.profit, errors: bot.errors },
            lastAction: bot.lastAction?.getTime()
          }])
        );
      }
    } catch (error) {
      log.error('[BotController] Failed to initialize from persistence', { error });
      this.isInitialized = true;
    }
  }

  static getInstance(): BotController {
    if (!this.instance) {
      this.instance = new BotController();
    }
    return this.instance;
  }

  async startBot(bot: Bot): Promise<void> {
    try {
      // Vérifier si le bot est déjà actif
      if (this.activeBots.has(bot.id)) {
        log.warn('[BotController] Bot already running', { botId: bot.id });
        throw new Error(`Bot ${bot.id} is already running`);
      }

      log.info('[BotController] Starting bot', { 
        botId: bot.id, 
        botName: bot.name,
        currentActiveBots: this.activeBots.size 
      });

      // Créer la connexion exchange
      const exchange = await ExchangeFactory.create(this.DEFAULT_EXCHANGE);

      // Extraire la configuration du bot
      const config = this.extractBotConfig(bot);
      
      // Restaurer les stats persistées ou créer de nouvelles stats
      const persistedData = this.persistedStats.get(bot.id);
      const botInstance: BotInstance = {
        bot,
        exchange,
        isRunning: true,
        startedAt: persistedData?.startedAt || Date.now(),
        lastAction: persistedData?.lastAction,
        stats: persistedData?.stats || {
          trades: 0,
          profit: 0,
          errors: 0,
          winningTrades: 0,
          losingTrades: 0
        },
        positions: new Map() // Tracking professionnel des positions : { symbol: { quantity, averagePrice, unrealizedPNL } }
      };
      
      // Nettoyer les stats persistées après restauration
      this.persistedStats.delete(bot.id);
      
      log.info('[BotController] Bot stats restored', {
        botId: bot.id,
        restoredStats: botInstance.stats,
        wasRestored: !!persistedData
      });

      // Démarrer la boucle de trading
      const intervalMs = config.tradingFrequency * 60 * 1000;
      log.info('[BotController] Setting up trading interval', {
        botId: bot.id,
        tradingFrequencyMinutes: config.tradingFrequency,
        intervalMs: intervalMs
      });
      
      botInstance.intervalId = setInterval(
        () => this.executeTradingCycle(botInstance, config),
        intervalMs // Convertir minutes en ms
      );

      this.activeBots.set(bot.id, botInstance);

      // Sauvegarder l'état
      await DatabasePersistence.upsertBotStats(botInstance);

      log.info('[BotController] Bot started', {
        botId: bot.id,
        botName: bot.name,
        strategy: bot.strategy,
        tradingFrequency: config.tradingFrequency
      });

    } catch (error) {
      log.error('[BotController] Failed to start bot', {
        botId: bot.id,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  async stopBot(botId: string): Promise<void> {
    const botInstance = this.activeBots.get(botId);
    
    if (!botInstance) {
      throw new Error(`Bot ${botId} is not running`);
    }

    // Arrêter la boucle de trading
    if (botInstance.intervalId) {
      clearInterval(botInstance.intervalId);
    }

    // Marquer comme arrêté
    botInstance.isRunning = false;

    // Supprimer de la liste active
    this.activeBots.delete(botId);

    // Supprimer de la persistance
    await DatabasePersistence.markBotStopped(botId);

    log.info('[BotController] Bot stopped', {
      botId,
      botName: botInstance.bot.name,
      runtime: Date.now() - (botInstance.startedAt || 0),
      trades: botInstance.stats.trades,
      profit: botInstance.stats.profit
    });
  }

  private extractBotConfig(bot: Bot): any {
    try {
      const aiConfig = bot.aiConfig as any;
      const originalConfig = aiConfig?.originalConfig;

      return {
        riskLimits: originalConfig?.riskLimits || {
          maxAllocation: 0.1,
          maxDailyLoss: 0.05,
          maxPositionSize: 0.08,
          stopLoss: 0.02,
          takeProfit: 0.06,
          maxDrawdown: 0.15
        },
        strategyHints: originalConfig?.strategyHints || ['momentum'],
        tradingFrequency: originalConfig?.advancedConfig?.tradingFrequency || 1,
        targetPairs: originalConfig?.targetPairs || ['BTC/USDT'],
        preferredIndicators: originalConfig?.preferredIndicators || ['RSI', 'MACD'],
        initialAllocation: originalConfig?.initialAllocation || {
          initialAmount: 1000,
          baseCurrency: 'USDT'
        }
      };
    } catch (error) {
      log.error('[BotController] Failed to extract bot config', { botId: bot.id, error });
      // Configuration par défaut en cas d'erreur
      return {
        riskLimits: { maxAllocation: 0.1, maxDailyLoss: 0.05, maxPositionSize: 0.08, stopLoss: 0.02 },
        strategyHints: ['momentum'],
        tradingFrequency: 1,
        targetPairs: ['BTC/USDT'],
        preferredIndicators: ['RSI'],
        initialAllocation: { initialAmount: 1000, baseCurrency: 'USDT' }
      };
    }
  }

  private async executeTradingCycle(botInstance: BotInstance, config: any): Promise<void> {
    try {
      botInstance.lastAction = Date.now();
      
      log.info('[BotController] ⚡ EXECUTING TRADING CYCLE', {
        botId: botInstance.bot.id,
        botName: botInstance.bot.name,
        timestamp: new Date().toISOString(),
        runtime: Date.now() - (botInstance.startedAt || 0),
        targetPairs: config.targetPairs
      });

      // 1. Analyser le marché pour chaque pair
      for (const symbol of config.targetPairs) {
        const signal = await this.analyzeMarket(botInstance.exchange, symbol, config);
        
        if (signal.action !== 'HOLD') {
          await this.executeSignal(botInstance, signal, config);
        }
      }
      
      // Sauvegarder périodiquement les stats (pour le runtime notamment)
      // Sauvegarder toutes les 10 minutes ou après chaque batch de trading
      const shouldSave = (
        botInstance.stats.trades > 0 && 
        (botInstance.stats.trades % 3 === 0 || (Date.now() - (botInstance.lastAction || 0)) > 10 * 60 * 1000)
      );
      
      if (shouldSave) {
        await DatabasePersistence.upsertBotStats(botInstance);
        log.debug('[BotController] Periodic persistence save', {
          botId: botInstance.bot.id,
          runtime: Date.now() - (botInstance.startedAt || 0),
          trades: botInstance.stats.trades
        });
      }

    } catch (error) {
      botInstance.stats.errors++;
      log.error('[BotController] Trading cycle failed', {
        botId: botInstance.bot.id,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private async analyzeMarket(exchange: BaseExchange, symbol: string, config: any): Promise<TradingSignal> {
    try {
      // Récupérer les données de marché
      const ticker = await exchange.getTicker(symbol);
      const candles = await exchange.getCandles(symbol, '1h', 20);
      const orderBook = await exchange.getOrderBook(symbol, 10);

      // Analyse technique simple basée sur la stratégie
      const signal = this.generateTradingSignal(ticker, candles, orderBook, config);
      
      log.info('[BotController] Market analysis completed', {
        symbol,
        price: ticker.price,
        signal: signal.action,
        confidence: signal.confidence,
        reason: signal.reason
      });

      return signal;

    } catch (error) {
      log.error('[BotController] Market analysis failed', { symbol, error });
      return {
        action: 'HOLD',
        symbol,
        quantity: 0,
        confidence: 0,
        reason: 'Analysis error'
      };
    }
  }

  private generateTradingSignal(ticker: any, candles: any[], orderBook: any, config: any): TradingSignal {
    // Stratégie simple basée sur le momentum et les changements de prix
    const strategy = config.strategyHints[0] || 'momentum';
    const change24h = ticker.changePercent24h || 0;
    const spread = orderBook.asks[0]?.[0] - orderBook.bids[0]?.[0] || 0;
    
    // Calcul de la quantité basée sur l'allocation max
    const maxPositionValue = config.initialAllocation.initialAmount * config.riskLimits.maxPositionSize;
    const quantity = Math.min(maxPositionValue / ticker.price, 0.1); // Max 0.1 BTC par exemple

    switch (strategy) {
      case 'momentum':
        // Stratégie plus agressive pour les tests (seuils plus bas)
        if (change24h > 0.5 && spread < ticker.price * 0.002) {
          return {
            action: 'BUY',
            symbol: ticker.symbol,
            quantity,
            confidence: Math.min(change24h / 5, 0.9),
            reason: `Momentum positif: +${change24h.toFixed(2)}%`
          };
        } else if (change24h < -0.5) {
          return {
            action: 'SELL',
            symbol: ticker.symbol,
            quantity,
            confidence: Math.min(Math.abs(change24h) / 5, 0.9),
            reason: `Momentum négatif: ${change24h.toFixed(2)}%`
          };
        }
        break;

      case 'scalping':
        if (Math.abs(change24h) < 0.5 && spread < ticker.price * 0.0005) {
          // Stratégie de scalping sur petits mouvements
          return {
            action: change24h > 0 ? 'BUY' : 'SELL',
            symbol: ticker.symbol,
            quantity: quantity * 0.5, // Positions plus petites pour scalping
            confidence: 0.3,
            reason: 'Scalping opportunity'
          };
        }
        break;

      case 'dca':
        // Dollar Cost Averaging - toujours acheter de petites quantités
        return {
          action: 'BUY',
          symbol: ticker.symbol,
          quantity: quantity * 0.2, // Petites quantités régulières
          confidence: 0.5,
          reason: 'DCA strategy'
        };
    }

    return {
      action: 'HOLD',
      symbol: ticker.symbol,
      quantity: 0,
      confidence: 0,
      reason: 'No trading opportunity'
    };
  }

  private async executeSignal(botInstance: BotInstance, signal: TradingSignal, config: any): Promise<void> {
    try {
      // Vérifier les limites de risque
      if (!this.checkRiskLimits(botInstance, signal, config)) {
        log.warn('[BotController] Signal rejected by risk management', {
          botId: botInstance.bot.id,
          signal: signal.action,
          symbol: signal.symbol
        });
        return;
      }

      // Placer l'ordre
      const orderRequest: OrderRequest = {
        symbol: signal.symbol,
        side: signal.action,
        type: 'MARKET',
        quantity: signal.quantity
      };

      const order = await botInstance.exchange.placeOrder(orderRequest);

      // Mettre à jour les statistiques avec calcul de profit réaliste
      if (order.status === 'FILLED') {
        botInstance.stats.trades++;
        const executionPrice = order.average || signal.price || 0;
        const tradeProfit = await this.calculateTradeProfit(botInstance, signal, executionPrice);
        
        botInstance.stats.profit += tradeProfit;
        
        // Compter les trades gagnants/perdants
        if (tradeProfit > 0) {
          botInstance.stats.winningTrades++;
        } else if (tradeProfit < 0) {
          botInstance.stats.losingTrades++;
        }
        
        // Sauvegarder les stats en temps réel après chaque trade
        await DatabasePersistence.upsertBotStats(botInstance);
        
        log.info('[BotController] Stats updated with realistic profit calculation', {
          botId: botInstance.bot.id,
          newStats: botInstance.stats,
          tradeProfit: tradeProfit,
          executionPrice: executionPrice,
          action: signal.action
        });
      }

      log.info('[BotController] Order executed', {
        botId: botInstance.bot.id,
        orderId: order.id,
        symbol: signal.symbol,
        side: signal.action,
        quantity: order.quantity,
        status: order.status,
        reason: signal.reason
      });

    } catch (error) {
      botInstance.stats.errors++;
      log.error('[BotController] Failed to execute signal', {
        botId: botInstance.bot.id,
        signal: signal.action,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private checkRiskLimits(botInstance: BotInstance, signal: TradingSignal, config: any): boolean {
    // Vérifications de base des limites de risque
    const riskLimits = config.riskLimits;
    
    // Vérifier la taille de position maximale
    const positionValue = signal.quantity * (signal.price || 1000); // Prix approximatif
    const maxPositionValue = config.initialAllocation.initialAmount * riskLimits.maxPositionSize;
    
    if (positionValue > maxPositionValue) {
      log.warn('[BotController] Position size exceeds limit', {
        botId: botInstance.bot.id,
        positionValue,
        maxPositionValue
      });
      return false;
    }

    // Vérifier le nombre d'erreurs
    if (botInstance.stats.errors > 5) {
      log.warn('[BotController] Too many errors, suspending trading', {
        botId: botInstance.bot.id,
        errors: botInstance.stats.errors
      });
      return false;
    }

    return true;
  }

  // Méthodes utilitaires
  getActiveBots(): BotInstance[] {
    return Array.from(this.activeBots.values());
  }

  getBotInstance(botId: string): BotInstance | undefined {
    return this.activeBots.get(botId);
  }

  async stopAllBots(): Promise<void> {
    const stopPromises = Array.from(this.activeBots.keys()).map(botId => this.stopBot(botId));
    await Promise.allSettled(stopPromises);
    log.info('[BotController] All bots stopped');
  }

  /**
   * Calcul professionnel du profit/perte avec position tracking
   * Implémente la logique des échanges crypto professionnels
   */
  private async calculateTradeProfit(botInstance: BotInstance, signal: TradingSignal, executionPrice: number): Promise<number> {
    const symbol = signal.symbol;
    const quantity = signal.quantity;
    let realizedPNL = 0;

    // Obtenir la position actuelle
    const currentPosition = botInstance.positions.get(symbol) || { quantity: 0, averagePrice: 0 };

    if (signal.action === 'BUY') {
      // ACHAT : Calcul du nouveau prix moyen pondéré
      if (currentPosition.quantity >= 0) {
        // Position longue ou neutre : ajouter à la position
        const totalCost = (currentPosition.quantity * currentPosition.averagePrice) + (quantity * executionPrice);
        const totalQuantity = currentPosition.quantity + quantity;
        const newAveragePrice = totalQuantity > 0 ? totalCost / totalQuantity : executionPrice;
        
        botInstance.positions.set(symbol, {
          quantity: totalQuantity,
          averagePrice: newAveragePrice
        });
        
        // Pas de profit réalisé sur un achat (augmentation de position)
        realizedPNL = -executionPrice * quantity * 0.001; // Juste les frais de trading simulés
        
        log.info('[BotController] BUY: Position increased', {
          botId: botInstance.bot.id,
          symbol,
          newQuantity: totalQuantity,
          newAveragePrice: newAveragePrice,
          fees: realizedPNL
        });
      } else {
        // Position courte : réduction de la position courte
        const closingQuantity = Math.min(quantity, Math.abs(currentPosition.quantity));
        const remainingQuantity = currentPosition.quantity + closingQuantity;
        
        // Calcul du profit réalisé : (Prix_Entrée - Prix_Sortie) × Quantité pour short
        realizedPNL = (currentPosition.averagePrice - executionPrice) * closingQuantity - (executionPrice * quantity * 0.001);
        
        if (remainingQuantity === 0) {
          botInstance.positions.delete(symbol);
        } else {
          botInstance.positions.set(symbol, {
            quantity: remainingQuantity,
            averagePrice: currentPosition.averagePrice
          });
        }
        
        log.info('[BotController] BUY: Short position closed/reduced', {
          botId: botInstance.bot.id,
          symbol,
          realizedPNL,
          closingQuantity,
          remainingQuantity
        });
      }
    } else if (signal.action === 'SELL') {
      // VENTE : Calcul du profit réalisé
      if (currentPosition.quantity > 0) {
        // Position longue : réduction/fermeture de la position longue
        const closingQuantity = Math.min(quantity, currentPosition.quantity);
        const remainingQuantity = currentPosition.quantity - closingQuantity;
        
        // Calcul du profit réalisé : (Prix_Sortie - Prix_Entrée) × Quantité pour long
        realizedPNL = (executionPrice - currentPosition.averagePrice) * closingQuantity - (executionPrice * quantity * 0.001);
        
        if (remainingQuantity === 0) {
          botInstance.positions.delete(symbol);
        } else {
          botInstance.positions.set(symbol, {
            quantity: remainingQuantity,
            averagePrice: currentPosition.averagePrice
          });
        }
        
        log.info('[BotController] SELL: Long position closed/reduced', {
          botId: botInstance.bot.id,
          symbol,
          realizedPNL,
          closingQuantity,
          remainingQuantity,
          entryPrice: currentPosition.averagePrice,
          exitPrice: executionPrice
        });
      } else {
        // Position neutre ou courte : ouverture/augmentation de position courte
        const totalCost = (Math.abs(currentPosition.quantity) * currentPosition.averagePrice) + (quantity * executionPrice);
        const totalQuantity = currentPosition.quantity - quantity;
        const newAveragePrice = Math.abs(totalQuantity) > 0 ? totalCost / Math.abs(totalQuantity) : executionPrice;
        
        botInstance.positions.set(symbol, {
          quantity: totalQuantity,
          averagePrice: newAveragePrice
        });
        
        // Pas de profit réalisé sur une ouverture de short
        realizedPNL = -executionPrice * quantity * 0.001; // Juste les frais
        
        log.info('[BotController] SELL: Short position opened/increased', {
          botId: botInstance.bot.id,
          symbol,
          newQuantity: totalQuantity,
          newAveragePrice: newAveragePrice,
          fees: realizedPNL
        });
      }
    }

    // Ajouter de la variabilité réaliste aux profits (simulation d'inefficacité de marché)
    if (Math.abs(realizedPNL) > 0.1) {
      const marketEfficiencyFactor = 0.85 + (Math.random() * 0.3); // Entre 0.85 et 1.15
      realizedPNL *= marketEfficiencyFactor;
    }

    return realizedPNL;
  }

  getStats(): {
    activeBots: number;
    totalTrades: number;
    totalProfit: number;
    totalErrors: number;
  } {
    const instances = Array.from(this.activeBots.values());
    
    log.debug('[BotController] Getting stats', {
      activeBots: instances.length,
      botIds: Array.from(this.activeBots.keys())
    });
    
    return {
      activeBots: instances.length,
      totalTrades: instances.reduce((sum, bot) => sum + bot.stats.trades, 0),
      totalProfit: instances.reduce((sum, bot) => sum + bot.stats.profit, 0),
      totalErrors: instances.reduce((sum, bot) => sum + bot.stats.errors, 0)
    };
  }
}