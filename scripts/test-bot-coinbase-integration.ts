#!/usr/bin/env tsx

import { BotController } from '../src/lib/trading/bot/bot_controller';
import { log } from '../src/lib/logger';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

// Mock bot data pour tester l'intégration Coinbase
const mockBot = {
  id: 'test-coinbase-bot-001',
  userId: 'test-user-coinbase',
  name: 'Test Coinbase Bot',
  strategy: 'momentum',
  aiConfig: {
    originalConfig: {
      selectedExchange: 'coinbase-official',
      strategyHints: ['momentum'],
      targetPairs: ['BTC/USDT'], // Format générique, sera converti en BTC-USD
      selectedPair: 'BTC/USDT',
      tradingFrequency: 1, // 1 minute pour test rapide
      initialAllocation: {
        initialAmount: 1000,
        baseCurrency: 'USD'
      },
      riskLimits: {
        maxDailyLoss: 0.02,
        maxDrawdown: 0.05,
        riskPerTrade: 0.01
      }
    }
  },
  status: 'ACTIVE',
  createdAt: new Date(),
  updatedAt: new Date()
} as any;

async function testBotCoinbaseIntegration() {
  console.log('🤖 Test intégration Bot + Coinbase SDK\n');

  try {
    // Obtenir l'instance du contrôleur
    const botController = BotController.getInstance();

    console.log('📋 Configuration du bot test:');
    console.log(`  Bot ID: ${mockBot.id}`);
    console.log(`  Exchange: ${mockBot.aiConfig.originalConfig.selectedExchange}`);
    console.log(`  Stratégie: ${mockBot.strategy}`);
    console.log(`  Paire: ${mockBot.aiConfig.originalConfig.selectedPair}`);
    console.log(`  Fréquence: ${mockBot.aiConfig.originalConfig.tradingFrequency} min`);
    console.log('');

    console.log('🚀 Démarrage du bot...');
    await botController.startBot(mockBot);

    console.log('✅ Bot démarré avec succès!');
    console.log('📊 Stats initiales:', botController.getStats());

    // Laisser le bot tourner quelques cycles
    console.log('\n⏱️  Laissons le bot exécuter quelques cycles...');
    
    // Afficher les stats toutes les 30 secondes
    const statsInterval = setInterval(() => {
      const stats = botController.getStats();
      console.log(`📈 Stats: ${stats.totalTrades} trades, ${stats.totalProfit.toFixed(4)} profit, ${stats.totalErrors} erreurs`);
      
      // Vérifier s'il y a des bots actifs
      const activeBots = botController.getActiveBots();
      if (activeBots.length > 0) {
        const botInstance = activeBots[0];
        console.log(`   Bot ${botInstance.bot.name}: ${botInstance.stats.trades} trades, ${botInstance.stats.profit.toFixed(4)} profit`);
      }
    }, 30000);

    // Arrêter après 5 minutes de test
    setTimeout(async () => {
      console.log('\n🛑 Arrêt du test après 5 minutes...');
      clearInterval(statsInterval);
      
      try {
        await botController.stopBot(mockBot.id);
        console.log('✅ Bot arrêté avec succès');
        
        const finalStats = botController.getStats();
        console.log('\n📊 Stats finales:', finalStats);
        
        process.exit(0);
      } catch (error) {
        console.error('❌ Erreur lors de l\'arrêt:', error);
        process.exit(1);
      }
    }, 5 * 60 * 1000); // 5 minutes

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    
    // Essayer d'arrêter le bot en cas d'erreur
    try {
      const botController = BotController.getInstance();
      await botController.stopBot(mockBot.id);
    } catch (stopError) {
      console.error('❌ Erreur lors de l\'arrêt d\'urgence:', stopError);
    }
    
    process.exit(1);
  }
}

// Gérer l'arrêt propre avec Ctrl+C
process.on('SIGINT', async () => {
  console.log('\n🛑 Signal d\'arrêt reçu (Ctrl+C)...');
  
  try {
    const botController = BotController.getInstance();
    await botController.stopAllBots();
    console.log('✅ Tous les bots arrêtés');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de l\'arrêt:', error);
    process.exit(1);
  }
});

testBotCoinbaseIntegration().catch(console.error);