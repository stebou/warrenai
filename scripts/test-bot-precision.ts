#!/usr/bin/env ts-node

/**
 * Script de test pour vérifier la précision des quantités Binance
 * et les nouvelles stratégies de trading
 */

import { BinanceExchange } from '../src/lib/trading/exchanges/binance_exchange.js';
import { BotController } from '../src/lib/trading/bot/bot_controller.js';
import { prisma } from '../src/lib/prisma.js';
import { log } from '../src/lib/logger.js';

async function testBotPrecision() {
  log.info('🧪 [Test] Starting bot precision and strategy test');

  try {
    // 1. Tester la connexion Binance et l'exchange info
    const testCredentials = {
      apiKey: process.env.BINANCE_API_KEY || '',
      apiSecret: process.env.BINANCE_API_SECRET || '',
      testnet: true
    };

    if (!testCredentials.apiKey || !testCredentials.apiSecret) {
      log.warn('⚠️ [Test] Missing Binance credentials, testing bot logic only');
      await testBotLogicOnly();
      return;
    }

    const exchange = new BinanceExchange(testCredentials);
    await exchange.connect();

    log.info('✅ [Test] Binance connection successful');

    // 2. Récupérer les informations d'exchange pour tester la précision
    const exchangeInfo = await exchange.getExchangeInfo();
    const btcSymbol = exchangeInfo.symbols.find(s => s.symbol === 'BTCUSDT');
    
    if (btcSymbol) {
      log.info('📊 [Test] BTC/USDT Symbol Info:', {
        minQty: btcSymbol.minQty,
        maxQty: btcSymbol.maxQty,
        stepSize: btcSymbol.stepSize,
        minPrice: btcSymbol.minPrice,
        tickSize: btcSymbol.tickSize,
        minNotional: btcSymbol.minNotional
      });
    }

    // 3. Tester le ticker et les données de marché
    const ticker = await exchange.getTicker('BTC/USDT');
    log.info('💰 [Test] Current BTC/USDT Price:', {
      price: ticker.price,
      change24h: ticker.changePercent24h,
      volume: ticker.volume24h
    });

    // 4. Tester les candles pour les indicateurs techniques
    const candles = await exchange.getCandles('BTC/USDT', '1h', 50);
    log.info('📈 [Test] Candles retrieved:', {
      count: candles.length,
      latest: candles[candles.length - 1]
    });

    // 5. Tester un bot existant ou créer un bot de test
    const testBot = await prisma.bot.findFirst({
      where: {
        user: {
          email: { contains: 'test' }
        }
      }
    });

    if (testBot) {
      const botController = BotController.getInstance();
      
      // Extraire la configuration
      const config = (botController as any).extractBotConfig(testBot);
      log.info('⚙️ [Test] Bot Configuration:', {
        strategy: config.strategy,
        targetPair: config.targetPair,
        riskLimits: config.riskLimits,
        tradingFrequency: config.tradingFrequency
      });

      // Tester la génération de signal
      const orderBook = await exchange.getOrderBook('BTC/USDT', 10);
      const signal = (botController as any).generateTradingSignal(ticker, candles, orderBook, config);
      
      log.info('🎯 [Test] Trading Signal Generated:', {
        action: signal.action,
        symbol: signal.symbol,
        quantity: signal.quantity,
        confidence: signal.confidence,
        reason: signal.reason
      });

      // Tester l'ajustement de quantité
      const adjustedQuantity = (botController as any).adjustQuantityForSymbol('BTCUSDT', signal.quantity, ticker.price);
      log.info('📏 [Test] Quantity Adjustment:', {
        original: signal.quantity,
        adjusted: adjustedQuantity,
        minQty: btcSymbol?.minQty,
        stepSize: btcSymbol?.stepSize
      });

      // Tester les indicateurs techniques
      const rsi = (botController as any).calculateRSI(candles);
      const macd = (botController as any).calculateMACDSignal(candles);
      const sma20 = (botController as any).calculateSMA(candles, 20);
      
      log.info('📊 [Test] Technical Indicators:', {
        RSI: rsi.toFixed(2),
        MACD: macd.toFixed(6),
        SMA20: sma20.toFixed(2),
        currentPrice: ticker.price
      });

    } else {
      log.warn('⚠️ [Test] No test bot found in database');
    }

    // 6. Nettoyer
    await exchange.disconnect();
    log.info('✅ [Test] All precision tests completed successfully');

  } catch (error) {
    log.error('❌ [Test] Test failed:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
  } finally {
    await prisma.$disconnect();
  }
}

async function testBotLogicOnly() {
  log.info('🤖 [Test] Testing bot logic without exchange connection');

  try {
    const botController = BotController.getInstance();

    // Simuler des données de marché
    const mockTicker = {
      symbol: 'BTC/USDT',
      price: 45000,
      changePercent24h: 2.5,
      volume24h: 1000000
    };

    const mockCandles = Array.from({ length: 50 }, (_, i) => ({
      timestamp: Date.now() - (49 - i) * 60 * 60 * 1000,
      open: 44000 + Math.random() * 2000,
      high: 44500 + Math.random() * 2000,
      low: 43500 + Math.random() * 2000,
      close: 44000 + Math.random() * 2000,
      volume: 100 + Math.random() * 900
    }));

    const mockOrderBook = {
      bids: [[44990, 0.5], [44980, 1.0]],
      asks: [[45010, 0.5], [45020, 1.0]]
    };

    // Tester différentes configurations de bot
    const testConfigs = [
      {
        strategy: 'momentum',
        targetPair: 'BTC/USDT',
        tradingFrequency: 5,
        initialAllocation: { initialAmount: 1000, baseCurrency: 'USDT' },
        riskLimits: {
          maxPositionSize: 0.04,
          stopLossPercent: 0.03,
          takeProfitPercent: 0.06,
          riskPerTrade: 0.02
        }
      },
      {
        strategy: 'scalping',
        targetPair: 'ETH/USDT',
        tradingFrequency: 1,
        initialAllocation: { initialAmount: 1000, baseCurrency: 'USDT' },
        riskLimits: {
          maxPositionSize: 0.01,
          stopLossPercent: 0.005,
          takeProfitPercent: 0.01,
          riskPerTrade: 0.01
        }
      },
      {
        strategy: 'dca',
        targetPair: 'BTC/USDT',
        tradingFrequency: 60,
        initialAllocation: { initialAmount: 5000, baseCurrency: 'USDT' },
        riskLimits: {
          maxPositionSize: 0.02,
          stopLossPercent: 0.08,
          takeProfitPercent: 0.15,
          riskPerTrade: 0.02
        }
      }
    ];

    for (const config of testConfigs) {
      log.info(`📊 [Test] Testing ${config.strategy.toUpperCase()} strategy`);

      // Tester la génération de signal
      const signal = (botController as any).generateTradingSignal(
        { ...mockTicker, symbol: config.targetPair },
        mockCandles,
        mockOrderBook,
        config
      );

      // Tester l'ajustement de quantité
      const adjustedQuantity = (botController as any).adjustQuantityForSymbol(
        config.targetPair.replace('/', ''),
        signal.quantity,
        mockTicker.price
      );

      // Tester les indicateurs techniques
      const rsi = (botController as any).calculateRSI(mockCandles);
      const macd = (botController as any).calculateMACDSignal(mockCandles);
      const sma20 = (botController as any).calculateSMA(mockCandles, 20);

      log.info(`🎯 [Test] ${config.strategy} Results:`, {
        signal: {
          action: signal.action,
          symbol: signal.symbol,
          originalQuantity: signal.quantity,
          adjustedQuantity: adjustedQuantity,
          confidence: signal.confidence,
          reason: signal.reason
        },
        indicators: {
          RSI: rsi.toFixed(2),
          MACD: macd.toFixed(6),
          SMA20: sma20.toFixed(2)
        },
        riskLimits: config.riskLimits
      });

      // Tester les helper methods
      const maxPosition = (botController as any).getMaxPositionSizeForStrategy(config.strategy);
      const stopLoss = (botController as any).getStopLossForStrategy(config.strategy);
      const takeProfit = (botController as any).getTakeProfitForStrategy(config.strategy);
      const indicators = (botController as any).getIndicatorsForStrategy(config.strategy);

      log.info(`⚙️ [Test] ${config.strategy} Strategy Parameters:`, {
        maxPositionSize: (maxPosition * 100).toFixed(1) + '%',
        stopLoss: (stopLoss * 100).toFixed(1) + '%',
        takeProfit: (takeProfit * 100).toFixed(1) + '%',
        indicators: indicators
      });
    }

    log.info('✅ [Test] Bot logic tests completed successfully');

  } catch (error) {
    log.error('❌ [Test] Bot logic test failed:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}

// Exécuter le test si ce script est appelé directement
if (require.main === module) {
  testBotPrecision().catch(console.error);
}

export { testBotPrecision, testBotLogicOnly };