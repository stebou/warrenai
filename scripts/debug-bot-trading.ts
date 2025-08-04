#!/usr/bin/env tsx

/**
 * Script de diagnostic pour comprendre pourquoi les bots ne tradent pas
 */

import { BotController } from '../src/lib/trading/bot/bot_controller.js';
import { ExchangeFactory } from '../src/lib/trading/exchanges/exchange_factory.js';
import { prisma } from '../src/lib/prisma.js';
import { log } from '../src/lib/logger.js';

async function debugBotTrading() {
  log.info('🕵️ [Debug] Starting bot trading diagnosis');

  try {
    // 1. Vérifier les bots en base de données
    log.info('📊 [Debug] Checking bots in database...');
    const allBots = await prisma.bot.findMany({
      include: {
        user: {
          select: {
            id: true,
            clerkId: true,
            email: true
          }
        },
        stats: true
      }
    });

    log.info('🤖 [Debug] Found bots:', {
      totalBots: allBots.length,
      botsByStatus: allBots.reduce((acc: any, bot) => {
        acc[bot.status] = (acc[bot.status] || 0) + 1;
        return acc;
      }, {}),
      botsWithStats: allBots.filter(b => b.stats).length
    });

    if (allBots.length === 0) {
      log.warn('⚠️ [Debug] No bots found in database');
      return;
    }

    // 2. Vérifier les credentials d'exchange
    log.info('🔐 [Debug] Checking exchange credentials...');
    const allCredentials = await prisma.exchangeCredentials.findMany({
      include: {
        user: {
          select: {
            id: true,
            clerkId: true,
            email: true
          }
        }
      }
    });

    log.info('🔑 [Debug] Found credentials:', {
      totalCredentials: allCredentials.length,
      credentialsByExchange: allCredentials.reduce((acc: any, cred) => {
        const key = `${cred.exchange}_${cred.isTestnet ? 'testnet' : 'live'}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {}),
      activeCredentials: allCredentials.filter(c => c.isActive).length
    });

    // 3. Tester l'ExchangeFactory pour un utilisateur
    if (allCredentials.length > 0) {
      const testCredential = allCredentials[0];
      log.info('🧪 [Debug] Testing ExchangeFactory for user:', {
        userId: testCredential.userId,
        userEmail: testCredential.user.email,
        exchange: testCredential.exchange,
        isTestnet: testCredential.isTestnet
      });

      try {
        const exchange = await ExchangeFactory.createForUser(
          testCredential.userId,
          'binance',
          testCredential.isTestnet
        );
        log.info('✅ [Debug] ExchangeFactory works - exchange created and connected');
        
        // Test rapide des données de marché
        const ticker = await exchange.getTicker('BTC/USDT');
        log.info('📈 [Debug] Market data accessible:', {
          price: ticker.price,
          change: ticker.changePercent24h
        });
        
        await exchange.disconnect();
      } catch (error) {
        log.error('❌ [Debug] ExchangeFactory failed:', {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    // 4. Vérifier le BotController
    log.info('🎮 [Debug] Checking BotController...');
    const botController = BotController.getInstance();
    const activeBots = botController.getActiveBots();
    const stats = botController.getStats();

    log.info('🤖 [Debug] BotController status:', {
      activeBots: activeBots.length,
      activeBotsIds: activeBots.map(b => b.bot.id),
      stats
    });

    // 5. Tenter de démarrer un bot pour test
    if (allBots.length > 0) {
      const testBot = allBots[0];
      log.info('🚀 [Debug] Attempting to start test bot:', {
        botId: testBot.id,
        botName: testBot.name,
        strategy: testBot.strategy,
        userId: testBot.userId,
        status: testBot.status
      });

      try {
        // Vérifier la config extraite
        const config = (botController as any).extractBotConfig(testBot);
        log.info('⚙️ [Debug] Bot config extracted:', config);

        // Tenter de démarrer le bot
        await botController.startBot(testBot);
        log.info('✅ [Debug] Bot started successfully');
        
        // Attendre un peu pour voir s'il trade
        log.info('⏳ [Debug] Waiting 10 seconds to see if bot generates signals...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        // Vérifier les stats après
        const updatedStats = botController.getStats();
        log.info('📊 [Debug] Stats after 10 seconds:', updatedStats);

        // Arrêter le bot
        await botController.stopBot(testBot.id);
        log.info('🛑 [Debug] Test bot stopped');

      } catch (error) {
        log.error('❌ [Debug] Failed to start/test bot:', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
      }
    }

    log.info('✅ [Debug] Bot trading diagnosis completed');

  } catch (error) {
    log.error('❌ [Debug] Diagnosis failed:', {
      error: error instanceof Error ? error.message : String(error)
    });
  } finally {
    await prisma.$disconnect();
  }
}

function displayDiagnosisInfo() {
  console.log(`
🕵️ DIAGNOSTIC DES BOTS QUI NE TRADENT PAS

🔍 CE QUE NOUS ALLONS VÉRIFIER :

1. 🗃️  **Base de données** :
   - Nombre de bots créés
   - Statuts des bots (ACTIVE/INACTIVE)
   - Présence de statistiques

2. 🔐 **Credentials Exchange** :
   - Nombre de credentials par utilisateur
   - Validité des clés Binance
   - Correspondance utilisateur ↔ credentials

3. 🏭 **ExchangeFactory** :
   - Récupération des credentials utilisateur
   - Connexion Binance réussie
   - Accès aux données de marché

4. 🎮 **BotController** :
   - Bots actifs en mémoire
   - Configuration des bots
   - Génération de signaux de trading

5. 🚀 **Test réel** :
   - Démarrage d'un bot
   - Génération de signaux
   - Exécution de trades (si conditions réunies)

📊 DIAGNOSTIC EN COURS...
`);
}

// Exécuter le diagnostic
if (require.main === module) {
  displayDiagnosisInfo();
  debugBotTrading().catch(console.error);
}

export { debugBotTrading };