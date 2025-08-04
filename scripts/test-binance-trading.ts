#!/usr/bin/env tsx
/**
 * Script de test complet pour vérifier le trading sur Binance testnet
 * Usage: npx tsx scripts/test-binance-trading.ts
 */

import { BinanceExchange } from '../src/lib/trading/exchanges/binance_exchange';
import { BotController, type TradingSignal } from '../src/lib/trading/bot/bot_controller';
import { prisma } from '../src/lib/prisma';
import { log } from '../src/lib/logger';

interface TestConfig {
  apiKey: string;
  apiSecret: string;
  testnet: boolean;
  testSymbol: string;
  testQuantity: number;
}

// Configuration de test (utilise les clés testnet du .env)
const TEST_CONFIG: TestConfig = {
  apiKey: process.env.BINANCE_TESTNET_API_KEY || '',
  apiSecret: process.env.BINANCE_TESTNET_SECRET || '',
  testnet: true,
  testSymbol: 'BTCUSDT',
  testQuantity: 0.01 // Quantité ajustée pour Binance testnet
};

class BinanceTradingTester {
  private exchange: BinanceExchange;
  private testResults: any[] = [];

  constructor(config: TestConfig) {
    if (!config.apiKey || !config.apiSecret) {
      throw new Error('BINANCE_TESTNET_API_KEY et BINANCE_TESTNET_SECRET doivent être définis dans les variables d\'environnement');
    }

    this.exchange = new BinanceExchange({
      apiKey: config.apiKey,
      apiSecret: config.apiSecret,
      testnet: config.testnet
    });
  }

  /**
   * Test 1: Connexion et informations du compte
   */
  async testConnection(): Promise<void> {
    try {
      console.log('🔗 Test 1: Connexion à Binance testnet...');
      
      await this.exchange.connect();
      const accountInfo = await this.exchange.getAccountInfo();
      
      console.log('✅ Connexion réussie !');
      console.log('💰 Soldes du compte testnet:');
      
      accountInfo.balances?.forEach(balance => {
        if (parseFloat(balance.free || '0') > 0) {
          console.log(`   ${balance.asset}: ${balance.free} (disponible), ${balance.locked} (bloqué)`);
        }
      });

      this.testResults.push({
        test: 'connection',
        status: 'success',
        data: {
          balances: accountInfo.balances?.filter(b => parseFloat(b.free || '0') > 0)
        }
      });
    } catch (error) {
      console.error('❌ Erreur de connexion:', error);
      this.testResults.push({
        test: 'connection',
        status: 'error',
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Test 2: Récupération des données de marché
   */
  async testMarketData(): Promise<void> {
    try {
      console.log('\n📊 Test 2: Récupération des données de marché...');
      
      const ticker = await this.exchange.getTicker(TEST_CONFIG.testSymbol);
      console.log(`📈 ${TEST_CONFIG.testSymbol}:`);
      console.log(`   Prix: $${ticker.price}`);
      console.log(`   Variation 24h: ${ticker.changePercent24h}%`);
      console.log(`   Volume 24h: ${ticker.volume24h}`);

      const orderBook = await this.exchange.getOrderBook(TEST_CONFIG.testSymbol, 5);
      console.log(`📖 Carnet d'ordres (top 3):`);
      console.log('   Ventes (asks):', orderBook.asks.slice(0, 3));
      console.log('   Achats (bids):', orderBook.bids.slice(0, 3));

      const candles = await this.exchange.getCandles(TEST_CONFIG.testSymbol, '1h', 5);
      console.log(`🕯️ Dernières 3 bougies 1h:`, candles.slice(-3).map(c => ({
        time: new Date(c.timestamp).toISOString(),
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume
      })));

      this.testResults.push({
        test: 'market_data',
        status: 'success',
        data: { ticker, orderBookDepth: orderBook.asks.length + orderBook.bids.length, candlesCount: candles.length }
      });
    } catch (error) {
      console.error('❌ Erreur données de marché:', error);
      this.testResults.push({
        test: 'market_data',
        status: 'error',
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Test 3: Passage d'ordres de test
   */
  async testOrderPlacement(): Promise<void> {
    try {
      console.log('\n🛒 Test 3: Passage d\'ordres de test...');
      
      // Récupérer le prix actuel
      const ticker = await this.exchange.getTicker(TEST_CONFIG.testSymbol);
      const currentPrice = parseFloat(ticker.price);
      
      // Test 1: Ordre d'achat limite très en dessous du marché (ne sera pas exécuté)
      const buyPrice = Math.round(currentPrice * 0.9 * 100) / 100; // 10% en dessous, arrondi à 2 décimales
      console.log(`📝 Tentative d'ordre d'achat limite à $${buyPrice.toFixed(2)} (90% du prix marché)...`);
      
      const buyOrder = await this.exchange.placeOrder({
        symbol: TEST_CONFIG.testSymbol,
        side: 'BUY',
        type: 'LIMIT',
        quantity: TEST_CONFIG.testQuantity,
        price: buyPrice,
        timeInForce: 'GTC'
      });

      console.log('✅ Ordre d\'achat placé:', {
        orderId: buyOrder.id,
        status: buyOrder.status,
        side: buyOrder.side,
        quantity: buyOrder.quantity,
        price: buyOrder.price
      });

      // Attendre un peu puis annuler l'ordre
      console.log('⏳ Attente 2 secondes avant annulation...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      const cancelResult = await this.exchange.cancelOrder(TEST_CONFIG.testSymbol, buyOrder.id);
      console.log('❌ Ordre annulé:', cancelResult);

      // Test 2: Ordre de vente limite très au dessus du marché (ne sera pas exécuté)
      const sellPrice = Math.round(currentPrice * 1.1 * 100) / 100; // 10% au dessus, arrondi à 2 décimales
      console.log(`📝 Tentative d'ordre de vente limite à $${sellPrice.toFixed(2)} (110% du prix marché)...`);
      
      const sellOrder = await this.exchange.placeOrder({
        symbol: TEST_CONFIG.testSymbol,
        side: 'SELL',
        type: 'LIMIT',
        quantity: TEST_CONFIG.testQuantity,
        price: sellPrice,
        timeInForce: 'GTC'
      });

      console.log('✅ Ordre de vente placé:', {
        orderId: sellOrder.id,
        status: sellOrder.status,
        side: sellOrder.side,
        quantity: sellOrder.quantity,
        price: sellOrder.price
      });

      // Attendre puis annuler
      console.log('⏳ Attente 2 secondes avant annulation...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      const cancelResult2 = await this.exchange.cancelOrder(TEST_CONFIG.testSymbol, sellOrder.id);
      console.log('❌ Ordre annulé:', cancelResult2);

      this.testResults.push({
        test: 'order_placement',
        status: 'success',
        data: {
          buyOrder: { id: buyOrder.id, status: buyOrder.status },
          sellOrder: { id: sellOrder.id, status: sellOrder.status },
          cancelledSuccessfully: true
        }
      });

    } catch (error) {
      console.error('❌ Erreur passage d\'ordres:', error);
      this.testResults.push({
        test: 'order_placement',
        status: 'error',
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Test 4: Simulation d'un bot de trading
   */
  async testBotSimulation(): Promise<void> {
    try {
      console.log('\n🤖 Test 4: Simulation d\'un bot de trading...');
      
      // Créer un bot fictif pour les tests
      const mockBot = {
        id: 'test-bot-' + Date.now(),
        name: 'Test Trading Bot',
        strategy: 'momentum',
        userId: 'test-user',
        aiConfig: {
          originalConfig: {
            riskLimits: {
              maxAllocation: 0.1,
              maxDailyLoss: 0.05,
              maxPositionSize: 0.08,
              stopLoss: 0.02,
              takeProfit: 0.06,
              maxDrawdown: 0.15
            },
            strategyHints: ['momentum'],
            tradingFrequency: 1,
            targetPairs: [TEST_CONFIG.testSymbol],
            preferredIndicators: ['RSI', 'MACD'],
            initialAllocation: {
              initialAmount: 1000,
              baseCurrency: 'USDT'
            }
          }
        }
      };

      // Simuler une analyse de marché et génération de signal
      const ticker = await this.exchange.getTicker(TEST_CONFIG.testSymbol);
      const candles = await this.exchange.getCandles(TEST_CONFIG.testSymbol, '1h', 20);
      
      // Générer un signal de trading simple (basé sur la variation récente)
      const change24h = parseFloat(ticker.changePercent24h || '0');
      let signal: TradingSignal;

      if (change24h > 1) {
        signal = {
          action: 'BUY',
          symbol: TEST_CONFIG.testSymbol,
          quantity: TEST_CONFIG.testQuantity,
          price: parseFloat(ticker.price),
          confidence: Math.min(change24h / 5, 0.9),
          reason: `Momentum positif: +${change24h.toFixed(2)}%`
        };
      } else if (change24h < -1) {
        signal = {
          action: 'SELL',
          symbol: TEST_CONFIG.testSymbol,
          quantity: TEST_CONFIG.testQuantity,
          price: parseFloat(ticker.price),
          confidence: Math.min(Math.abs(change24h) / 5, 0.9),
          reason: `Momentum négatif: ${change24h.toFixed(2)}%`
        };
      } else {
        signal = {
          action: 'HOLD',
          symbol: TEST_CONFIG.testSymbol,
          quantity: 0,
          confidence: 0,
          reason: 'Pas d\'opportunité de trading'
        };
      }

      console.log('📊 Signal généré:', signal);

      if (signal.action !== 'HOLD') {
        // Placer un ordre limite qui ne sera probablement pas exécuté
        const limitPrice = signal.action === 'BUY' 
          ? Math.round(parseFloat(ticker.price) * 0.95 * 100) / 100  // 5% en dessous pour BUY, arrondi à 2 décimales
          : Math.round(parseFloat(ticker.price) * 1.05 * 100) / 100; // 5% au dessus pour SELL, arrondi à 2 décimales

        console.log(`📝 Placement d'ordre ${signal.action} limite à $${limitPrice.toFixed(2)}...`);

        const order = await this.exchange.placeOrder({
          symbol: signal.symbol,
          side: signal.action,
          type: 'LIMIT',
          quantity: signal.quantity,
          price: limitPrice,
          timeInForce: 'GTC'
        });

        console.log('✅ Ordre bot placé:', {
          signal: signal.action,
          orderId: order.id,
          status: order.status,
          reason: signal.reason
        });

        // Attendre puis annuler (c'est un test)
        console.log('⏳ Attente 3 secondes avant annulation...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        const cancelResult = await this.exchange.cancelOrder(signal.symbol, order.id);
        console.log('❌ Ordre bot annulé:', cancelResult);

        this.testResults.push({
          test: 'bot_simulation',
          status: 'success',
          data: {
            signal,
            order: { id: order.id, status: order.status },
            cancelled: true
          }
        });
      } else {
        console.log('⏸️ Signal HOLD - Aucun ordre placé');
        this.testResults.push({
          test: 'bot_simulation',
          status: 'success',
          data: { signal, orderPlaced: false }
        });
      }

    } catch (error) {
      console.error('❌ Erreur simulation bot:', error);
      this.testResults.push({
        test: 'bot_simulation',
        status: 'error',
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Test 5: Vérification de l'historique des ordres
   */
  async testOrderHistory(): Promise<void> {
    try {
      console.log('\n📜 Test 5: Vérification de l\'historique des ordres...');
      
      const orders = await this.exchange.getOrderHistory(TEST_CONFIG.testSymbol, 10);
      console.log(`📋 Trouvé ${orders.length} ordre(s) récent(s):`);
      
      orders.slice(0, 5).forEach((order, index) => {
        console.log(`   ${index + 1}. ${order.side} ${order.quantity} ${order.symbol} @ $${order.price} - Status: ${order.status}`);
        console.log(`      ID: ${order.id}, Date: ${new Date(order.timestamp).toISOString()}`);
      });

      this.testResults.push({
        test: 'order_history',
        status: 'success',
        data: { orderCount: orders.length }
      });

    } catch (error) {
      console.error('❌ Erreur historique ordres:', error);
      this.testResults.push({
        test: 'order_history',
        status: 'error',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Résumé des tests
   */
  printSummary(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSUMÉ DES TESTS BINANCE TRADING');
    console.log('='.repeat(60));

    const successCount = this.testResults.filter(r => r.status === 'success').length;
    const totalTests = this.testResults.length;

    console.log(`✅ Tests réussis: ${successCount}/${totalTests}`);
    console.log(`❌ Tests échoués: ${totalTests - successCount}/${totalTests}`);

    this.testResults.forEach((result, index) => {
      const status = result.status === 'success' ? '✅' : '❌';
      console.log(`${status} Test ${index + 1} (${result.test}): ${result.status}`);
      if (result.error) {
        console.log(`   Erreur: ${result.error}`);
      }
    });

    if (successCount === totalTests) {
      console.log('\n🎉 TOUS LES TESTS SONT PASSÉS ! Votre bot peut trader sur Binance testnet.');
    } else {
      console.log('\n⚠️  Certains tests ont échoué. Vérifiez la configuration.');
    }
  }

  async disconnect(): Promise<void> {
    await this.exchange.disconnect();
  }
}

/**
 * Script principal
 */
async function main() {
  console.log('🚀 Démarrage des tests de trading Binance testnet');
  console.log('='.repeat(60));

  const tester = new BinanceTradingTester(TEST_CONFIG);

  try {
    await tester.testConnection();
    await tester.testMarketData();
    await tester.testOrderPlacement();
    await tester.testBotSimulation();
    await tester.testOrderHistory();
  } finally {
    await tester.disconnect();
    tester.printSummary();
  }
}

// Exécuter les tests si ce script est appelé directement
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
}

export { BinanceTradingTester, TEST_CONFIG };