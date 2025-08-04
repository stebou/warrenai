#!/usr/bin/env tsx

/**
 * Test pour vérifier que les bots executent des signaux de trading immédiatement
 */

import { BotController } from '../src/lib/trading/bot/bot_controller.js';
import { prisma } from '../src/lib/prisma.js';
import { log } from '../src/lib/logger.js';

async function testImmediateTrading() {
  log.info('🚀 [Test] Testing immediate bot trading execution');

  try {
    // Récupérer le premier bot actif
    const bot = await prisma.bot.findFirst({
      where: { status: 'ACTIVE' },
      include: { user: true }
    });

    if (!bot) {
      log.warn('⚠️ [Test] No active bot found');
      return;
    }

    log.info('🤖 [Test] Testing bot:', {
      botId: bot.id,
      botName: bot.name,
      strategy: bot.strategy,
      userId: bot.userId
    });

    const botController = BotController.getInstance();
    
    // Démarrer le bot
    log.info('▶️ [Test] Starting bot...');
    await botController.startBot(bot);
    
    // Attendre 5 secondes pour voir la première exécution
    log.info('⏳ [Test] Waiting 5 seconds for immediate execution...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Vérifier les stats
    const stats = botController.getStats();
    log.info('📊 [Test] Stats after immediate execution:', stats);
    
    // Vérifier le bot spécifique
    const activeBots = botController.getActiveBots();
    const testBot = activeBots.find(b => b.bot.id === bot.id);
    if (testBot) {
      log.info('🎯 [Test] Test bot stats:', {
        botId: testBot.bot.id,
        stats: testBot.stats,
        isRunning: testBot.isRunning,
        positions: testBot.positions.length
      });
    }
    
    // Arrêter le bot
    await botController.stopBot(bot.id);
    log.info('✅ [Test] Test completed - bot stopped');

  } catch (error) {
    log.error('❌ [Test] Test failed:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
  } finally {
    await prisma.$disconnect();
  }
}

function displayTestInfo() {
  console.log(`
🚀 TEST EXECUTION IMMEDIATE DES BOTS

🎯 OBJECTIF :
- Vérifier que les bots exécutent des signaux de trading immédiatement après le démarrage
- Ne plus attendre la première période complète (5 minutes)

✅ MODIFICATIONS APPORTÉES :
- Ajout d'un setTimeout pour exécuter le premier cycle après 1 seconde
- Les bots devraient maintenant trader immédiatement

🧪 TEST EN COURS...
`);
}

// Exécuter le test
if (require.main === module) {
  displayTestInfo();
  testImmediateTrading().catch(console.error);
}

export { testImmediateTrading };