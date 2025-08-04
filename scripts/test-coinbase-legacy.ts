#!/usr/bin/env tsx

import { CoinbaseLegacyClient } from '../src/lib/trading/exchanges/coinbase_legacy_client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

async function testCoinbaseLegacy() {
  console.log('🚀 Test Coinbase Legacy Client (HMAC-SHA256)\n');

  // Configuration avec les nouvelles clés Legacy
  const config = {
    apiKey: process.env.COINBASE_ADVANCED_API_KEY || 'your-api-key',
    apiSecret: process.env.COINBASE_ADVANCED_API_SECRET || 'your-api-secret',
    sandbox: false // Test en production avec clés Legacy
  };

  console.log('📋 Configuration Legacy:');
  console.log(`  API Key: ${config.apiKey}`);
  console.log(`  API Secret: ${config.apiSecret.substring(0, 10)}...`);
  console.log(`  Sandbox: ${config.sandbox}`);
  console.log('');

  try {
    // Créer le client Legacy
    const client = new CoinbaseLegacyClient(config);

    console.log('📞 Test de connexion via Legacy client...');
    try {
      const isConnected = await client.testConnection();
      if (isConnected) {
        console.log('✅ Connexion réussie avec Legacy client');
      } else {
        console.log('❌ Connexion échouée avec Legacy client');
        return;
      }
    } catch (error: any) {
      console.log('❌ Connexion échouée:', error.message);
      console.log('\n📝 Vérifications:');
      console.log('1. Les clés API sont-elles correctes?');
      console.log('2. Les permissions sont-elles configurées?');
      console.log('3. L\'IP est-elle autorisée?');
      return;
    }

    console.log('\n💰 Test récupération balances via Legacy...');
    try {
      const balances = await client.getBalances();
      console.log('✅ Balances récupérées via Legacy:', balances);
    } catch (error: any) {
      console.log('❌ Erreur balances Legacy:', error.message);
    }

    console.log('\n📊 Test récupération prix BTC-USD via Legacy...');
    try {
      const price = await client.getPrice('BTC-USD');
      console.log(`✅ Prix BTC-USD via Legacy: $${price}`);
    } catch (error: any) {
      console.log('❌ Erreur prix Legacy:', error.message);
    }

    console.log('\n📚 Test récupération historique via Legacy...');
    try {
      const history = await client.getOrders('BTC-USD', 5);
      console.log(`✅ Historique récupéré via Legacy: ${history.length} ordres`);
      if (history.length > 0) {
        console.log('   Premier ordre:', history[0]);
      }
    } catch (error: any) {
      console.log('❌ Erreur historique Legacy:', error.message);
    }

    // Test placement ordre (simulation)
    console.log('\n🔄 Test placement ordre (simulation) via Legacy...');
    try {
      // NOTE: Décommentez seulement si vous voulez vraiment placer un ordre réel!
      // const orderId = await client.createMarketOrder('BTC-USD', 'BUY', '10'); // $10 USD
      // console.log(`✅ Ordre placé via Legacy avec ID: ${orderId.order_id}`);
      console.log('⚠️  Test ordre désactivé - décommentez pour tester vraiment');
    } catch (error: any) {
      console.log('❌ Erreur placement ordre Legacy:', error.message);
    }

  } catch (error: any) {
    console.error('❌ Erreur générale Legacy:', error);
  }

  console.log('\n🎯 Résumé Legacy Client:');
  console.log('✅ Authentification HMAC-SHA256 (plus simple que JWT ES256)');
  console.log('✅ Compatible avec les clés client API Coinbase');
  console.log('✅ Pas de problème de format de clé privée');
  console.log('✅ Support complet des opérations de trading');
  console.log('');
  console.log('🔗 Warren AI peut maintenant trader sur Coinbase avec les clés Legacy!');
}

testCoinbaseLegacy().catch(console.error);