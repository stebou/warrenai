#!/usr/bin/env tsx

import { CoinbaseAdvancedClient } from '../src/lib/trading/exchanges/coinbase_advanced_client_v2';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

async function testCoinbaseV2Client() {
  console.log('🚀 Test Coinbase Advanced Trade API Client V2\n');

  const config = {
    apiKeyName: process.env.COINBASE_ADVANCED_API_KEY || '',
    privateKey: process.env.COINBASE_ADVANCED_API_SECRET || '',
    sandbox: false
  };

  console.log('📋 Configuration Client V2:');
  console.log(`  API Key Name: ${config.apiKeyName.substring(0, 40)}...`);
  console.log(`  Private Key: ${config.privateKey.substring(0, 30)}...`);
  console.log(`  Sandbox: ${config.sandbox}`);
  console.log('');

  try {
    const client = new CoinbaseAdvancedClient(config);
    console.log('📞 Test de connexion...');
    const isConnected = await client.testConnection();
    
    if (!isConnected) {
      console.log('❌ Connexion échouée');
      return;
    }

    console.log('\n💰 Test récupération comptes...');
    const accounts = await client.getAccounts();
    console.log(`✅ ${accounts.length} comptes récupérés`);
    
    accounts.slice(0, 5).forEach(account => {
      console.log(`   ${account.currency}: ${account.available_balance.value} (${account.name})`);
    });

    console.log('\n📊 Test récupération prix BTC-USD...');
    const price = await client.getPrice('BTC-USD');
    console.log(`✅ Prix BTC-USD: $${price.toLocaleString()}`);

  } catch (error: any) {
    console.error('❌ Erreur lors du test:', error.message);
    
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', error.response.data);
    }
  }

  console.log('\n🎯 Client V2 - Implémentation propre sans SDK');
}

testCoinbaseV2Client().catch(console.error);