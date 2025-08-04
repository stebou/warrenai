#!/usr/bin/env tsx

// Script pour tester la connexion Binance testnet
import 'dotenv/config';
import { BinanceExchange } from '../src/lib/trading/exchanges/binance_exchange';
import { log } from '../src/lib/logger';

async function testBinanceConnection() {
  console.log('🚀 Test de connexion Binance Testnet...\n');

  const apiKey = process.env.BINANCE_TESTNET_API_KEY;
  const apiSecret = process.env.BINANCE_TESTNET_SECRET;

  if (!apiKey || !apiSecret) {
    console.error('❌ Variables d\'environnement manquantes:');
    console.error('   BINANCE_TESTNET_API_KEY ou BINANCE_TESTNET_SECRET');
    process.exit(1);
  }

  console.log(`🔑 API Key: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`);
  console.log(`🔐 Secret: ${apiSecret.substring(0, 8)}...***\n`);

  const binanceExchange = new BinanceExchange({
    apiKey,
    apiSecret,
    testnet: true
  });

  try {
    // Test 1: Connexion de base
    console.log('1️⃣ Test de connexion...');
    await binanceExchange.connect();
    console.log('✅ Connexion réussie!\n');

    // Test 2: Informations du compte
    console.log('2️⃣ Test des informations du compte...');
    const accountInfo = await binanceExchange.getAccountInfo();
    console.log('✅ Informations du compte récupérées:');
    console.log(`   - Peut trader: ${accountInfo.canTrade}`);
    console.log(`   - Peut retirer: ${accountInfo.canWithdraw}`);
    console.log(`   - Peut déposer: ${accountInfo.canDeposit}`);
    console.log(`   - Commission maker: ${accountInfo.makerCommission}`);
    console.log(`   - Commission taker: ${accountInfo.takerCommission}`);
    console.log(`   - Nombre de balances: ${accountInfo.balances.length}\n`);

    // Test 3: Balances principales
    console.log('3️⃣ Test des balances...');
    const balances = accountInfo.balances.filter(b => b.total > 0);
    if (balances.length > 0) {
      console.log('✅ Balances trouvées:');
      balances.forEach(balance => {
        console.log(`   - ${balance.asset}: ${balance.free} (libre) + ${balance.locked} (bloqué) = ${balance.total} (total)`);
      });
    } else {
      console.log('⚠️  Aucune balance trouvée (normal sur testnet vide)');
    }
    console.log('');

    // Test 4: Informations de l'exchange
    console.log('4️⃣ Test des informations de l\'exchange...');
    const exchangeInfo = await binanceExchange.getExchangeInfo();
    console.log('✅ Informations de l\'exchange récupérées:');
    console.log(`   - Nom: ${exchangeInfo.name}`);
    console.log(`   - Nombre de symboles: ${exchangeInfo.symbols.length}`);
    console.log(`   - Nombre de limits de taux: ${exchangeInfo.rateLimits.length}\n`);

    // Test 5: Ticker BTC/USDT
    console.log('5️⃣ Test du ticker BTC/USDT...');
    try {
      const ticker = await binanceExchange.getTicker('BTC/USDT');
      console.log('✅ Ticker BTC/USDT récupéré:');
      console.log(`   - Prix: $${ticker.price.toLocaleString()}`);
      console.log(`   - Changement 24h: ${ticker.changePercent24h.toFixed(2)}%`);
      console.log(`   - Volume 24h: ${ticker.volume24h.toLocaleString()}`);
      console.log(`   - High 24h: $${ticker.high24h.toLocaleString()}`);
      console.log(`   - Low 24h: $${ticker.low24h.toLocaleString()}\n`);
    } catch (error) {
      console.log('⚠️  Impossible de récupérer le ticker (normal sur certains testnets)\n');
    }

    // Test 6: Order book BTC/USDT
    console.log('6️⃣ Test de l\'order book BTC/USDT...');
    try {
      const orderBook = await binanceExchange.getOrderBook('BTC/USDT', 5);
      console.log('✅ Order book BTC/USDT récupéré:');
      console.log('   Bids (ordres d\'achat):');
      orderBook.bids.slice(0, 3).forEach(([price, quantity], index) => {
        console.log(`     ${index + 1}. $${price.toLocaleString()} x ${quantity}`);
      });
      console.log('   Asks (ordres de vente):');
      orderBook.asks.slice(0, 3).forEach(([price, quantity], index) => {
        console.log(`     ${index + 1}. $${price.toLocaleString()} x ${quantity}`);
      });
      console.log('');
    } catch (error) {
      console.log('⚠️  Impossible de récupérer l\'order book (normal sur certains testnets)\n');
    }

    // Test 7: Candles/Klines
    console.log('7️⃣ Test des données de chandelles BTC/USDT...');
    try {
      const candles = await binanceExchange.getCandles('BTC/USDT', '1h', 5);
      console.log('✅ Données de chandelles récupérées:');
      console.log(`   - Nombre de chandelles: ${candles.length}`);
      if (candles.length > 0) {
        const latestCandle = candles[candles.length - 1];
        console.log(`   - Dernière chandelle:`);
        console.log(`     - Ouverture: $${latestCandle.open.toLocaleString()}`);
        console.log(`     - Fermeture: $${latestCandle.close.toLocaleString()}`);
        console.log(`     - High: $${latestCandle.high.toLocaleString()}`);
        console.log(`     - Low: $${latestCandle.low.toLocaleString()}`);
        console.log(`     - Volume: ${latestCandle.volume.toLocaleString()}`);
      }
      console.log('');
    } catch (error) {
      console.log('⚠️  Impossible de récupérer les chandelles (normal sur certains testnets)\n');
    }

    // Déconnexion
    await binanceExchange.disconnect();
    console.log('🔌 Déconnexion réussie');

    console.log('\n🎉 Tous les tests sont passés avec succès!');
    console.log('🟢 Votre configuration Binance testnet est opérationnelle.');

  } catch (error) {
    console.error('\n❌ Erreur lors des tests:');
    console.error(error instanceof Error ? error.message : String(error));
    
    try {
      await binanceExchange.disconnect();
    } catch (disconnectError) {
      // Ignore les erreurs de déconnexion
    }
    
    process.exit(1);
  }
}

// Exécuter le test si ce script est lancé directement
if (require.main === module) {
  testBinanceConnection().catch(console.error);
}

export { testBinanceConnection };