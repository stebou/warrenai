import { NextRequest, NextResponse } from 'next/server';
import { CoinbaseAdvancedClient } from '@/lib/trading/exchanges/coinbase_advanced_client';

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Test Coinbase Advanced API depuis Vercel');
    
    // Configuration depuis les variables d'environnement
    const config = {
      apiKey: process.env.COINBASE_ADVANCED_API_KEY || '',
      apiSecret: process.env.COINBASE_ADVANCED_API_SECRET || '',
      sandbox: false
    };

    if (!config.apiKey || !config.apiSecret) {
      return NextResponse.json({
        success: false,
        error: 'Variables d\'environnement manquantes',
        details: {
          hasApiKey: !!config.apiKey,
          hasApiSecret: !!config.apiSecret
        }
      }, { status: 500 });
    }

    console.log(`📋 API Key: ${config.apiKey.substring(0, 20)}...`);
    
    // Créer le client
    const client = new CoinbaseAdvancedClient(config);
    
    const results: any = {
      success: true,
      timestamp: new Date().toISOString(),
      tests: {}
    };

    // Test 1: Connexion
    console.log('📞 Test connexion...');
    try {
      const connected = await client.testConnection();
      results.tests.connection = {
        success: connected,
        message: connected ? 'Connexion réussie' : 'Connexion échouée'
      };
    } catch (error: any) {
      results.tests.connection = {
        success: false,
        error: error.message,
        status: error.response?.status
      };
    }

    // Test 2: Récupération des comptes
    console.log('💰 Test récupération comptes...');
    try {
      const accounts = await client.getAccounts();
      results.tests.accounts = {
        success: true,
        count: accounts.length,
        accounts: accounts.map(acc => ({
          currency: acc.currency,
          balance: acc.available_balance.value,
          name: acc.name
        }))
      };
    } catch (error: any) {
      results.tests.accounts = {
        success: false,
        error: error.message,
        status: error.response?.status
      };
    }

    // Test 3: Prix BTC-USD
    console.log('📊 Test prix BTC...');
    try {
      const price = await client.getPrice('BTC-USD');
      results.tests.pricing = {
        success: true,
        btcPrice: price,
        message: `Prix BTC: $${price}`
      };
    } catch (error: any) {
      results.tests.pricing = {
        success: false,
        error: error.message,
        status: error.response?.status
      };
    }

    // Test 4: Balances
    console.log('💵 Test balances...');
    try {
      const balances = await client.getBalances();
      results.tests.balances = {
        success: true,
        balances: balances,
        totalCurrencies: Object.keys(balances).length
      };
    } catch (error: any) {
      results.tests.balances = {
        success: false,
        error: error.message,
        status: error.response?.status
      };
    }

    // Résumé
    const successful = Object.values(results.tests).filter((test: any) => test.success).length;
    const total = Object.keys(results.tests).length;
    
    results.summary = {
      successful,
      total,
      allSuccess: successful === total,
      message: `${successful}/${total} tests réussis`
    };

    console.log(`✅ Tests terminés: ${successful}/${total} réussis`);
    
    return NextResponse.json(results, { 
      status: results.summary.allSuccess ? 200 : 207 // 207 = Multi-Status
    });

  } catch (error: any) {
    console.error('❌ Erreur générale:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erreur lors du test Coinbase',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}