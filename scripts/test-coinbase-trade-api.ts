#!/usr/bin/env tsx

import { CoinbaseDeFiExchange } from '../src/lib/trading/exchanges/coinbase_defi_exchange';
import { OrderSide, OrderType } from '../src/lib/trading/exchanges/types';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

async function testCoinbaseTradeAPI() {
  console.log('🚀 Test Coinbase Trade API (DeFi)\n');

  // Configuration de test (vous devrez remplacer par vos vraies valeurs)
  const config = {
    apiKey: process.env.COINBASE_TRADE_API_KEY || 'your-api-key',
    apiSecret: process.env.COINBASE_TRADE_API_SECRET || 'your-api-secret',
    walletId: process.env.COINBASE_WALLET_ID || 'your-wallet-id',
    network: 'base' as const,
    maxSlippage: 0.5, // 0.5%
    testMode: true
  };

  console.log('📋 Configuration:');
  console.log(`  Network: ${config.network}`);
  console.log(`  Max Slippage: ${config.maxSlippage}%`);
  console.log(`  Test Mode: ${config.testMode}`);
  console.log(`  API Key: ${config.apiKey.substring(0, 8)}...`);
  console.log('');

  try {
    // Créer l'exchange DeFi
    const exchange = new CoinbaseDeFiExchange(config);

    console.log('📞 Test de connexion...');
    try {
      await exchange.connect();
      console.log('✅ Connexion réussie');
    } catch (error) {
      console.log('❌ Connexion échouée (normal avec fausses clés):', error.message);
    }

    console.log('\n📊 Test de récupération de prix...');
    try {
      const price = await exchange.getPrice('ETHUSDC');
      console.log(`✅ Prix ETH/USDC: ${price}`);
    } catch (error) {
      console.log('❌ Récupération de prix échouée:', error.message);
    }

    console.log('\n🔄 Test de placement d\'ordre (simulation)...');
    try {
      const orderId = await exchange.placeOrder({
        symbol: 'ETHUSDC',
        side: OrderSide.BUY,
        type: OrderType.MARKET,
        quantity: 0.01 // 0.01 ETH
      });
      console.log(`✅ Ordre placé: ${orderId}`);
    } catch (error) {
      console.log('❌ Placement d\'ordre échoué:', error.message);
    }

    console.log('\n📝 Informations importantes:');
    console.log('1. Pour utiliser la Trade API, vous devez:');
    console.log('   - Créer un compte développeur Coinbase');
    console.log('   - Obtenir les clés API Trade API');
    console.log('   - Créer un wallet CDP');
    console.log('   - Configurer les variables d\'environnement');
    console.log('');
    console.log('2. Variables d\'environnement requises:');
    console.log('   - COINBASE_TRADE_API_KEY');
    console.log('   - COINBASE_TRADE_API_SECRET');
    console.log('   - COINBASE_WALLET_ID');
    console.log('');
    console.log('3. Réseaux supportés: Ethereum, Base');
    console.log('4. Latence: <500ms pour les swaps');
    console.log('5. Protection slippage intégrée');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

testCoinbaseTradeAPI().catch(console.error);