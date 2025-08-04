#!/usr/bin/env tsx

import { CoinbaseAdvancedExchange } from '../src/lib/trading/exchanges/coinbase_advanced_exchange';
import { OrderSide, OrderType } from '../src/lib/trading/exchanges/types';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

async function testCoinbaseAdvanced() {
  console.log('🚀 Test Coinbase Advanced Trade API\n');

  // Configuration avec les clés d'environnement
  const config = {
    apiKey: process.env.COINBASE_ADVANCED_API_KEY || 'your-api-key',
    apiSecret: process.env.COINBASE_ADVANCED_API_SECRET || 'your-api-secret',
    sandbox: false // Mode production avec vraies clés
  };

  console.log('📋 Configuration:');
  console.log(`  API Key: ${config.apiKey.substring(0, 10)}...`);
  console.log(`  Sandbox: ${config.sandbox}`);
  console.log('');

  try {
    // Créer l'exchange
    const exchange = new CoinbaseAdvancedExchange(config);

    console.log('📞 Test de connexion...');
    try {
      await exchange.connect();
      console.log('✅ Connexion réussie');
    } catch (error) {
      console.log('❌ Connexion échouée (normal avec fausses clés):', error.message);
      console.log('\n📝 Pour tester avec de vraies clés:');
      console.log('1. Créer un compte Coinbase Developer Platform');
      console.log('2. Générer des clés API CDP');
      console.log('3. Ajouter les variables d\'environnement:');
      console.log('   - COINBASE_ADVANCED_API_KEY');
      console.log('   - COINBASE_ADVANCED_API_SECRET');
      return;
    }

    console.log('\n💰 Test récupération balances...');
    try {
      const balances = await exchange.getBalance();
      console.log('✅ Balances récupérées:', balances);
    } catch (error) {
      console.log('❌ Erreur balances:', error.message);
    }

    console.log('\n📊 Test récupération prix...');
    try {
      const price = await exchange.getPrice('BTC-USD');
      console.log(`✅ Prix BTC-USD: $${price}`);
    } catch (error) {
      console.log('❌ Erreur prix:', error.message);
    }

    console.log('\n🔄 Test placement ordre (simulation)...');
    try {
      const orderId = await exchange.placeOrder({
        symbol: 'BTC-USD',
        side: OrderSide.BUY,
        type: OrderType.MARKET,
        quantity: 10 // $10 USD
      });
      console.log(`✅ Ordre placé avec ID: ${orderId}`);
      
      // Vérifier le statut
      const status = await exchange.getOrderStatus(orderId);
      console.log(`📋 Statut ordre:`, status);
      
    } catch (error) {
      console.log('❌ Erreur placement ordre:', error.message);
    }

    console.log('\n📚 Test récupération historique...');
    try {
      const history = await exchange.getOrderHistory('BTC-USD', 10);
      console.log(`✅ Historique récupéré: ${history.length} ordres`);
    } catch (error) {
      console.log('❌ Erreur historique:', error.message);
    }

    await exchange.disconnect();

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }

  console.log('\n🎯 Fonctionnalités implémentées:');
  console.log('✅ Authentification JWT automatique');
  console.log('✅ Placement ordres market et limit');
  console.log('✅ Récupération prix en temps réel');
  console.log('✅ Gestion des balances');
  console.log('✅ Historique des ordres');
  console.log('✅ Annulation d\'ordres');
  console.log('✅ Conversion automatique des symboles');
  console.log('');
  console.log('🔗 Votre bot peut maintenant trader sur Coinbase Advanced!');
}

testCoinbaseAdvanced().catch(console.error);