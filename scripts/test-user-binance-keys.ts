#!/usr/bin/env tsx

/**
 * Test des clés Binance testnet utilisateur
 */

import { BinanceExchange } from '../src/lib/trading/exchanges/binance_exchange.js';
import { log } from '../src/lib/logger.js';

async function testUserBinanceKeys() {
  log.info('🧪 [Test] Testing user Binance testnet credentials');

  // Clés de l'utilisateur fournies
  const userCredentials = {
    apiKey: 'yPvOd9D2iKnNzERGkKFFVTkdUXX9Y8g5seFAVOyzsszwz6CIowOHF26QuCmZIyDN',
    apiSecret: 'EW4gr5QMQR1HLkNK0aciD2kQ9C1FbEDHpmcD1lSwsAA5rAbehdy4vBAsjGmCMag2',
    testnet: true
  };

  try {
    // 1. Tester la création de l'exchange
    log.info('🔗 [Test] Creating Binance exchange instance');
    const exchange = new BinanceExchange(userCredentials);

    // 2. Tester la connexion
    log.info('🔗 [Test] Testing connection...');
    await exchange.connect();
    log.info('✅ [Test] Connection successful!');

    // 3. Tester l'account info
    log.info('💰 [Test] Getting account information...');
    const account = await exchange.getAccountInfo();
    log.info('✅ [Test] Account info retrieved:', {
      balanceCount: account.balances.length,
      canTrade: account.canTrade,
      canWithdraw: account.canWithdraw,
      canDeposit: account.canDeposit
    });

    // 4. Tester les données de marché
    log.info('📊 [Test] Getting BTC/USDT ticker...');
    const ticker = await exchange.getTicker('BTC/USDT');
    log.info('✅ [Test] Ticker retrieved:', {
      symbol: ticker.symbol,
      price: ticker.price,
      change24h: ticker.changePercent24h + '%'
    });

    // 5. Tester l'exchange info pour la précision
    log.info('ℹ️ [Test] Getting exchange info...');
    const exchangeInfo = await exchange.getExchangeInfo();
    const btcSymbol = exchangeInfo.symbols.find(s => s.symbol === 'BTCUSDT');
    if (btcSymbol) {
      log.info('✅ [Test] BTC precision info:', {
        minQty: btcSymbol.minQty,
        stepSize: btcSymbol.stepSize,
        minNotional: btcSymbol.minNotional
      });
    }

    // 6. Nettoyer
    await exchange.disconnect();
    log.info('✅ [Test] All tests passed! User credentials are valid for trading.');

  } catch (error) {
    log.error('❌ [Test] Test failed:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}

function displayUserCredentialsInfo() {
  console.log(`
🎯 NOUVELLE ARCHITECTURE - CREDENTIALS PAR UTILISATEUR

✅ AVANTAGES :
1. 🔒 **Sécurité** : Chaque utilisateur contrôle ses propres clés
2. 🚀 **Scalabilité** : Pas de limite sur le nombre d'utilisateurs
3. 💡 **Simplicité** : Plus besoin de gérer des clés globales
4. 🛡️ **Isolation** : Les clés d'un utilisateur n'affectent pas les autres

❌ PLUS BESOIN :
- Variables d'environnement Binance sur Vercel
- Clés partagées dans .env
- Gestion globale des credentials

🔄 PROCESSUS UTILISATEUR :
1. L'utilisateur va sur testnet.binance.vision
2. Il crée un compte (GitHub OAuth)
3. Il génère ses clés API (lecture + trading)
4. Il les saisit UNE FOIS dans ton interface
5. Tous ses bots utilisent ses clés automatiquement

✅ SÉCURITÉ GARANTIE :
- Clés stockées par utilisateur en base
- Isolation complète entre utilisateurs
- Chiffrement recommandé en production

🧪 TEST DES CLÉS UTILISATEUR :
`);
}

// Exécuter le test
if (require.main === module) {
  displayUserCredentialsInfo();
  testUserBinanceKeys().catch(console.error);
}

export { testUserBinanceKeys };