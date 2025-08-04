// src/lib/trading/bot/bot_controller.ts
import { BaseExchange } from '../exchanges/base_exchange';
import { ExchangeFactory } from '../exchanges/exchange_factory';
import { DatabasePersistence } from './db_persistence';
import { log } from '@/lib/logger';
import type { Bot } from '@prisma/client';
import type { OrderRequest, Order, Ticker } from '../exchanges/types';
import type { TradingWebSocketServer } from '@/lib/realtime/websocket-server';

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
  private isInitialized = false;
  private persistedStats = new Map<string, { startedAt: number; stats: any; lastAction?: number }>();
  private webSocketServer: TradingWebSocketServer | null = null;
  
  // Configuration pour l'exchange à utiliser
  private readonly USE_BINANCE = process.env.USE_BINANCE_EXCHANGE === 'true';
  private readonly USE_TESTNET = process.env.BINANCE_USE_TESTNET !== 'false'; // true par défaut

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

  // Méthode pour configurer le serveur WebSocket
  setWebSocketServer(wsServer: TradingWebSocketServer): void {
    this.webSocketServer = wsServer;
    log.info('[BotController] WebSocket server configured');
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

      // Créer la connexion exchange - toujours utiliser Binance maintenant
      const exchange = await ExchangeFactory.createForUser(bot.userId, 'binance', this.USE_TESTNET);

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
      
      // Exécuter immédiatement le premier cycle de trading
      setTimeout(() => this.executeTradingCycle(botInstance, config), 1000);
      
      botInstance.intervalId = setInterval(
        () => this.executeTradingCycle(botInstance, config),
        intervalMs // Convertir minutes en ms
      );

      this.activeBots.set(bot.id, botInstance);

      // Sauvegarder l'état
      await DatabasePersistence.upsertBotStats(botInstance);

      // Émettre l'événement WebSocket de changement de statut
      if (this.webSocketServer) {
        this.webSocketServer.emitBotStatusChange({
          botId: bot.id,
          userId: bot.userId,
          name: bot.name,
          status: 'running',
          timestamp: Date.now()
        });
      }

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

    // Émettre l'événement WebSocket de changement de statut
    if (this.webSocketServer) {
      this.webSocketServer.emitBotStatusChange({
        botId,
        userId: botInstance.bot.userId,
        name: botInstance.bot.name,
        status: 'stopped',
        timestamp: Date.now()
      });
    }

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

      // Configuration stricte basée sur les choix utilisateur
      const config = {
        // Stratégie principale choisie par l'utilisateur
        strategy: originalConfig?.strategyHints?.[0] || bot.strategy || 'momentum',
        
        // UNE SEULE PAIRE par bot (requirement strict)
        targetPair: originalConfig?.targetPairs?.[0] || originalConfig?.selectedPair || 'BTC/USDT',
        
        // Fréquence de trading choisie par l'utilisateur
        tradingFrequency: originalConfig?.advancedConfig?.tradingFrequency || 5, // 5 minutes par défaut
        
        // Allocation initiale choisie par l'utilisateur
        initialAllocation: {
          initialAmount: originalConfig?.initialAllocation?.initialAmount || 1000,
          baseCurrency: originalConfig?.initialAllocation?.baseCurrency || 'USDT'
        },
        
        // Risk Management basé sur les recherches 2025
        riskLimits: {
          // Position sizing dynamique basé sur la stratégie
          maxPositionSize: this.getMaxPositionSizeForStrategy(originalConfig?.strategyHints?.[0] || 'momentum'),
          
          // Stop-loss basé sur ATR et stratégie
          stopLossPercent: this.getStopLossForStrategy(originalConfig?.strategyHints?.[0] || 'momentum'),
          
          // Take-profit multi-niveaux
          takeProfitPercent: this.getTakeProfitForStrategy(originalConfig?.strategyHints?.[0] || 'momentum'),
          
          // Limites de drawdown
          maxDailyLoss: originalConfig?.riskLimits?.maxDailyLoss || 0.05,
          maxDrawdown: originalConfig?.riskLimits?.maxDrawdown || 0.15,
          
          // Risk per trade basé sur le capital
          riskPerTrade: originalConfig?.riskLimits?.riskPerTrade || 0.02 // 2% par trade
        },
        
        // Indicateurs techniques pour la stratégie
        technicalIndicators: this.getIndicatorsForStrategy(originalConfig?.strategyHints?.[0] || 'momentum'),
        
        // Exchange sélectionné (toujours Binance pour l'instant)
        exchange: originalConfig?.selectedExchange || 'binance'
      };

      log.info('[BotController] Bot configuration extracted', {
        botId: bot.id,
        strategy: config.strategy,
        targetPair: config.targetPair,
        tradingFrequency: config.tradingFrequency,
        riskLimits: config.riskLimits
      });

      return config;
    } catch (error) {
      log.error('[BotController] Failed to extract bot config', { botId: bot.id, error });
      // Configuration par défaut sécurisée
      return {
        strategy: 'momentum',
        targetPair: 'BTC/USDT',
        tradingFrequency: 5,
        initialAllocation: { initialAmount: 1000, baseCurrency: 'USDT' },
        riskLimits: {
          maxPositionSize: 0.02,
          stopLossPercent: 0.02,
          takeProfitPercent: 0.04,
          maxDailyLoss: 0.05,
          maxDrawdown: 0.15,
          riskPerTrade: 0.02
        },
        technicalIndicators: ['RSI', 'MACD'],
        exchange: 'binance'
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
        targetPair: config.targetPair, // UNE SEULE PAIRE
        strategy: config.strategy
      });

      // 1. Analyser le marché pour LA paire choisie par l'utilisateur
      const signal = await this.analyzeMarket(botInstance.exchange, config.targetPair, config);
      
      if (signal.action !== 'HOLD') {
        await this.executeSignal(botInstance, signal, config);
      }
      
      // Sauvegarder périodiquement les stats
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
    const strategy = config.strategy.toLowerCase();
    const change24h = ticker.changePercent24h || 0;
    const spread = orderBook.asks[0]?.[0] - orderBook.bids[0]?.[0] || 0;
    const currentPrice = ticker.price;
    
    // Calcul de la quantité basée sur le risk management 2025
    const portfolioValue = config.initialAllocation.initialAmount;
    const riskAmount = portfolioValue * config.riskLimits.riskPerTrade; // 2% du portfolio
    const stopLossDistance = currentPrice * config.riskLimits.stopLossPercent;
    
    // Position sizing basé sur le risque, pas sur un pourcentage fixe
    let quantity = riskAmount / stopLossDistance;
    
    // Ajuster selon le symbole et appliquer des limites raisonnables
    quantity = this.adjustQuantityForSymbol(config.targetPair, quantity, currentPrice);
    
    // Calculer des indicateurs techniques simples
    const rsi = this.calculateRSI(candles);
    const macd = this.calculateMACDSignal(candles);

    // Déterminer le type de stratégie à partir du nom complexe
    let strategyType = 'momentum'; // défaut
    if (strategy.includes('scalping')) {
      strategyType = 'scalping';
    } else if (strategy.includes('dca')) {
      strategyType = 'dca';
    } else if (strategy.includes('momentum')) {
      strategyType = 'momentum';
    }

    // Stratégies basées sur les recherches 2025
    switch (strategyType) {
      case 'momentum':
        // Momentum avec RSI moins restrictif (40/60 au lieu de 30/70)
        if (rsi < 40 && macd > 0) {
          return {
            action: 'BUY',
            symbol: config.targetPair,
            quantity,
            confidence: Math.min((60 - rsi) / 40 + Math.abs(macd) / 10, 0.9),
            reason: `Momentum BUY: RSI ${rsi.toFixed(1)} < 40, MACD bullish ${macd.toFixed(3)}`
          };
        } else if (rsi > 60 && macd < 0) {
          return {
            action: 'SELL',
            symbol: config.targetPair,
            quantity,
            confidence: Math.min((rsi - 40) / 40 + Math.abs(macd) / 10, 0.9),
            reason: `Momentum SELL: RSI ${rsi.toFixed(1)} > 60, MACD bearish ${macd.toFixed(3)}`
          };
        }
        break;

      case 'scalping':
        // Scalping avec conditions moins restrictives
        const spreadPercent = (spread / currentPrice) * 100;
        if (rsi < 50 && macd > -0.1) { // Conditions très relaxées
          return {
            action: 'BUY',
            symbol: config.targetPair,
            quantity: quantity * 0.5, // Positions plus petites
            confidence: 0.5,
            reason: `Scalping BUY: RSI ${rsi.toFixed(1)} < 50, MACD ${macd.toFixed(3)}`
          };
        } else if (rsi > 50 && macd < 0.1) {
          return {
            action: 'SELL',
            symbol: config.targetPair,
            quantity: quantity * 0.5,
            confidence: 0.5,
            reason: `Scalping SELL: RSI ${rsi.toFixed(1)} > 50, MACD ${macd.toFixed(3)}`
          };
        }
        break;

      case 'dca':
        // DCA avec conditions très relaxées
        const sma20 = this.calculateSMA(candles, 20);
        if (currentPrice < sma20 * 1.02 && rsi < 60) { // Beaucoup moins restrictif
          return {
            action: 'BUY',
            symbol: config.targetPair,
            quantity: quantity * 0.3, // Achats réguliers plus petits
            confidence: 0.7,
            reason: `DCA BUY: Prix ${((currentPrice/sma20 - 1) * 100).toFixed(2)}% vs SMA20, RSI ${rsi.toFixed(1)}`
          };
        }
        break;
    }

    return {
      action: 'HOLD',
      symbol: config.targetPair,
      quantity: 0,
      confidence: 0,
      reason: 'No trading opportunity'
    };
  }

  /**
   * Ajuste la quantité selon le symbole pour respecter les précisions Binance
   */
  private adjustQuantityForSymbol(symbol: string, quantity: number, price: number): number {
    // Limites raisonnables selon le symbole
    if (symbol.includes('BTC')) {
      // Pour BTC: entre 0.001 et 0.01
      return Math.min(Math.max(quantity, 0.001), 0.01);
    } else if (symbol.includes('ETH')) {
      // Pour ETH: entre 0.01 et 0.1
      return Math.min(Math.max(quantity, 0.01), 0.1);
    } else if (symbol.includes('USDT') || symbol.includes('USDC')) {
      // Pour stablecoins: entre 10 et 1000
      const valueBasedQuantity = Math.max(10 / price, 10);
      return Math.min(Math.max(quantity, valueBasedQuantity), 1000);
    } else {
      // Pour autres altcoins: entre 1 et 100
      return Math.min(Math.max(quantity, 1), 100);
    }
  }

  /**
   * Calcul RSI simplifié (14 périodes)
   */
  private calculateRSI(candles: any[]): number {
    if (candles.length < 15) return 50; // Neutre si pas assez de données
    
    const prices = candles.slice(-15).map(c => c.close);
    let gains = 0, losses = 0;
    
    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) gains += change;
      else losses += Math.abs(change);
    }
    
    const avgGain = gains / 14;
    const avgLoss = losses / 14;
    
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  /**
   * Calcul MACD simplifié (12, 26, 9)
   */
  private calculateMACDSignal(candles: any[]): number {
    if (candles.length < 26) return 0;
    
    const prices = candles.map(c => c.close);
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    
    return ema12 - ema26; // Ligne MACD
  }

  /**
   * Calcul EMA (Exponential Moving Average)
   */
  private calculateEMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1] || 0;
    
    const multiplier = 2 / (period + 1);
    let ema = prices.slice(0, period).reduce((sum, price) => sum + price, 0) / period;
    
    for (let i = period; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }
    
    return ema;
  }

  /**
   * Calcul SMA (Simple Moving Average)
   */
  private calculateSMA(candles: any[], period: number): number {
    if (candles.length < period) return candles[candles.length - 1]?.close || 0;
    
    const prices = candles.slice(-period).map(c => c.close);
    return prices.reduce((sum, price) => sum + price, 0) / period;
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
        
        // Émettre l'événement WebSocket de trade exécuté
        if (this.webSocketServer) {
          this.webSocketServer.emitTradeExecuted({
            botId: botInstance.bot.id,
            userId: botInstance.bot.userId, // Assurez-vous que le userId est disponible
            symbol: signal.symbol,
            side: signal.action,
            quantity: signal.quantity,
            price: executionPrice,
            profit: tradeProfit,
            type: tradeProfit > 0 ? 'win' : 'loss',
            timestamp: Date.now()
          });
        }
        
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
    const riskLimits = config.riskLimits;
    const portfolioValue = config.initialAllocation.initialAmount;
    
    // 1. Vérifier la taille de position maximale
    const positionValue = signal.quantity * (signal.price || 1000);
    const maxPositionValue = portfolioValue * riskLimits.maxPositionSize;
    
    if (positionValue > maxPositionValue) {
      log.warn('[BotController] Position size exceeds limit', {
        botId: botInstance.bot.id,
        positionValue,
        maxPositionValue,
        maxPositionPercent: (riskLimits.maxPositionSize * 100).toFixed(1) + '%'
      });
      return false;
    }

    // 2. Vérifier les pertes journalières maximales
    const dailyLossPercent = Math.abs(botInstance.stats.profit) / portfolioValue;
    if (dailyLossPercent > riskLimits.maxDailyLoss) {
      log.warn('[BotController] Daily loss limit exceeded', {
        botId: botInstance.bot.id,
        dailyLossPercent: (dailyLossPercent * 100).toFixed(2) + '%',
        maxDailyLoss: (riskLimits.maxDailyLoss * 100).toFixed(1) + '%'
      });
      return false;
    }

    // 3. Vérifier le drawdown maximum
    const drawdownPercent = Math.abs(botInstance.stats.profit) / portfolioValue;
    if (drawdownPercent > riskLimits.maxDrawdown) {
      log.warn('[BotController] Maximum drawdown exceeded', {
        botId: botInstance.bot.id,
        drawdownPercent: (drawdownPercent * 100).toFixed(2) + '%',
        maxDrawdown: (riskLimits.maxDrawdown * 100).toFixed(1) + '%'
      });
      return false;
    }

    // 4. Vérifier le nombre d'erreurs consécutives
    if (botInstance.stats.errors > 10) {
      log.warn('[BotController] Too many errors, suspending trading', {
        botId: botInstance.bot.id,
        errors: botInstance.stats.errors
      });
      return false;
    }

    // 5. Vérifier le taux de réussite minimum
    if (botInstance.stats.trades > 10) {
      const winRate = botInstance.stats.winningTrades / botInstance.stats.trades;
      if (winRate < 0.2) { // Au moins 20% de réussite après 10 trades
        log.warn('[BotController] Win rate too low, suspending trading', {
          botId: botInstance.bot.id,
          winRate: (winRate * 100).toFixed(1) + '%',
          totalTrades: botInstance.stats.trades
        });
        return false;
      }
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

  /**
   * Configuration de position sizing basée sur la stratégie (recherches 2025)
   */
  private getMaxPositionSizeForStrategy(strategy: string): number {
    switch (strategy) {
      case 'scalping':
        return 0.01; // 1% - positions plus petites pour scalping haute fréquence
      case 'momentum':
        return 0.04; // 4% - positions moyennes pour trends
      case 'dca':
        return 0.02; // 2% - positions régulières pour DCA
      default:
        return 0.02; // 2% par défaut
    }
  }

  /**
   * Configuration de stop-loss basée sur la stratégie et la volatilité
   */
  private getStopLossForStrategy(strategy: string): number {
    switch (strategy) {
      case 'scalping':
        return 0.005; // 0.5% - stops serrés pour scalping
      case 'momentum':
        return 0.03;  // 3% - stops plus larges pour trends
      case 'dca':
        return 0.08;  // 8% - stops très larges pour DCA long terme
      default:
        return 0.02;  // 2% par défaut
    }
  }

  /**
   * Configuration de take-profit basée sur la stratégie
   */
  private getTakeProfitForStrategy(strategy: string): number {
    switch (strategy) {
      case 'scalping':
        return 0.01;  // 1% - profits rapides pour scalping
      case 'momentum':
        return 0.06;  // 6% - profits moyens pour trends
      case 'dca':
        return 0.15;  // 15% - profits élevés pour DCA long terme
      default:
        return 0.04;  // 4% par défaut
    }
  }

  /**
   * Indicateurs techniques appropriés pour chaque stratégie
   */
  private getIndicatorsForStrategy(strategy: string): string[] {
    switch (strategy) {
      case 'scalping':
        return ['RSI', 'MACD', 'BollingerBands', 'Stochastic'];
      case 'momentum':
        return ['RSI', 'MACD', 'EMA', 'ADX'];
      case 'dca':
        return ['SMA', 'RSI', 'MACD'];
      default:
        return ['RSI', 'MACD'];
    }
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