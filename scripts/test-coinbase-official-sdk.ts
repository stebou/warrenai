#!/usr/bin/env tsx

import { CoinbaseOfficialExchange } from '../src/lib/trading/exchanges/coinbase_official_exchange';
import { OrderSide, OrderType } from '../src/lib/trading/exchanges/types';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

async function testCoinbaseOfficialSDK() {
  console.log('🚀 Test Coinbase Official SDK\n');

  // Configuration avec les clés d'environnement
  const config = {
    apiKey: process.env.COINBASE_ADVANCED_API_KEY || 'your-api-key',
    apiSecret: process.env.COINBASE_ADVANCED_API_SECRET || 'your-api-secret',
    sandbox: false // Test en production avec SDK officiel
  };

  console.log('📋 Configuration SDK Officiel:');
  console.log(`  API Key: ${config.apiKey.substring(0, 20)}...`);
  console.log(`  Sandbox: ${config.sandbox}`);
  console.log('');

  try {
    // Créer l'exchange avec le SDK officiel
    const exchange = new CoinbaseOfficialExchange(config);

    console.log('📞 Test de connexion via SDK officiel...');
    try {
      await exchange.connect();
      console.log('✅ Connexion réussie avec SDK officiel');
    } catch (error: any) {
      console.log('❌ Connexion échouée:', error.message);
      console.log('\n📝 Instructions:');
      console.log('1. Vérifiez vos clés CDP sur: https://portal.cdp.coinbase.com');
      console.log('2. Assurez-vous que les scopes "view" et "trade" sont activés');
      console.log('3. Vérifiez le Domain allowlist (warrenai.vercel.app)');
      return;
    }

    console.log('\n💰 Test récupération balances via SDK...');
    try {
      const balances = await exchange.getBalance();
      console.log('✅ Balances récupérées via SDK officiel:', balances);
    } catch (error: any) {
      console.log('❌ Erreur balances SDK:', error.message);
    }

    console.log('\n📊 Test récupération prix via SDK...');
    try {
      const price = await exchange.getPrice('BTC-USD');
      console.log(`✅ Prix BTC-USD via SDK: $${price}`);
    } catch (error: any) {
      console.log('❌ Erreur prix SDK:', error.message);
    }

    console.log('\n🔄 Test placement ordre (simulation) via SDK...');
    try {
      const orderId = await exchange.placeOrder({
        symbol: 'BTC-USD',
        side: OrderSide.BUY,
        type: OrderType.MARKET,
        quantity: 10 // $10 USD
      });
      console.log(`✅ Ordre placé via SDK avec ID: ${orderId}`);
      
      // Vérifier le statut
      const status = await exchange.getOrderStatus(orderId);
      console.log(`📋 Statut ordre SDK:`, status);
      
    } catch (error: any) {
      console.log('❌ Erreur placement ordre SDK:', error.message);
    }

    console.log('\n📚 Test récupération historique via SDK...');
    try {
      const history = await exchange.getOrderHistory('BTC-USD', 10);
      console.log(`✅ Historique récupéré via SDK: ${history.length} ordres`);
      if (history.length > 0) {
        console.log('   Premier ordre:', history[0]);
      }
    } catch (error: any) {
      console.log('❌ Erreur historique SDK:', error.message);
    }

    await exchange.disconnect();

  } catch (error: any) {
    console.error('❌ Erreur générale SDK:', error);
  }

  console.log('\n🎯 Avantages du SDK Officiel:');
  console.log('✅ Authentification gérée automatiquement');
  console.log('✅ Mise à jour automatique des spécifications API');
  console.log('✅ Support officiel de Coinbase');
  console.log('✅ Pas de gestion manuelle des JWT');
  console.log('✅ Meilleure compatibilité long terme');
  console.log('');
  console.log('🔗 Warren AI utilise maintenant le SDK officiel Coinbase !');
}

testCoinbaseOfficialSDK().catch(console.error);