import { CoinbaseOfficialSDK } from '../src/lib/trading/exchanges/coinbase_official_sdk';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

async function testOfficialSDK() {
  console.log('🚀 Test SDK Officiel Coinbase Advanced Trade\n');

  const config = {
    keyName: process.env.COINBASE_ADVANCED_API_KEY || '',
    privateKey: process.env.COINBASE_ADVANCED_API_SECRET || ''
  };

  console.log('📋 Configuration SDK Officiel:');
  console.log(`  Key Name: ${config.keyName.substring(0, 40)}...`);
  console.log(`  Private Key: ${config.privateKey.substring(0, 30)}...`);
  console.log('');

  try {
    const sdk = new CoinbaseOfficialSDK(config);
    
    console.log('📞 Test de connexion...');
    const isConnected = await sdk.testConnection();
    
    if (isConnected) {
      console.log('✅ SDK Officiel connecté avec succès!');
      
      console.log('\n📊 Test récupération prix BTC-USD...');
      const price = await sdk.getPrice('BTC-USD');
      console.log(`✅ Prix BTC-USD: $${price.toLocaleString()}`);
      
      console.log('\n💰 Test récupération balances...');
      const balances = await sdk.getBalances();
      console.log('✅ Balances récupérées:');
      
      Object.entries(balances)
        .filter(([currency, balance]) => balance > 0)
        .slice(0, 5)
        .forEach(([currency, balance]) => {
          console.log(`   ${currency}: ${balance}`);
        });
    } else {
      console.log('❌ Connexion échouée');
    }

  } catch (error: any) {
    console.error('❌ Erreur SDK Officiel:', error.message);
  }

  console.log('\n🎯 SDK Officiel Coinbase - Prêt pour Warren AI!');
}

testOfficialSDK().catch(console.error);