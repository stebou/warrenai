const { Coinbase } = require('coinbase-advanced-node');
const dotenv = require('dotenv');

dotenv.config({ path: '.env' });

async function debugSDKDetailed() {
  try {
    const config = {
      cloudApiKeyName: process.env.COINBASE_ADVANCED_API_KEY,
      cloudApiSecret: process.env.COINBASE_ADVANCED_API_SECRET.replace(/\\n/g, '\n'),
    };
    
    console.log('📋 Configuration:');
    console.log(`  API Key: ${config.cloudApiKeyName?.substring(0, 20)}...`);
    console.log(`  Secret: ${config.cloudApiSecret?.substring(0, 50)}...`);
    console.log('');
    
    const client = new Coinbase(config);
    
    console.log('🔍 Client structure:');
    console.log('Client keys:', Object.keys(client));
    console.log('');
    
    // Tester si le client a une méthode directe
    if (typeof client.coinbaseRequest === 'function') {
      console.log('✅ coinbaseRequest method available');
      
      // Essayer un appel direct avec coinbaseRequest
      console.log('📞 Testing accounts with coinbaseRequest...');
      try {
        const accountsResponse = await client.coinbaseRequest('GET', '/accounts');
        console.log('✅ Accounts response:', accountsResponse);
      } catch (error) {
        console.log('❌ coinbaseRequest error:', error.message);
      }
    }
    
    // Tester REST client
    if (client.rest) {
      console.log('🔍 REST client structure:');
      console.log('REST keys:', Object.keys(client.rest));
      
      if (typeof client.rest.coinbaseRequest === 'function') {
        console.log('✅ rest.coinbaseRequest method available');
        
        try {
          const response = await client.rest.coinbaseRequest('GET', '/accounts');
          console.log('✅ REST accounts response:', response);
        } catch (error) {
          console.log('❌ REST coinbaseRequest error:', error.message);
        }
      }
    }
    
    // Explorer d'autres méthodes possibles
    console.log('\n🔍 Testing common method names:');
    const methodsToTest = ['getAccounts', 'getProducts', 'getTime', 'listAccounts'];
    
    for (const method of methodsToTest) {
      if (typeof client[method] === 'function') {
        console.log(`✅ client.${method} exists`);
        try {
          const result = await client[method]();
          console.log(`   Result:`, result);
        } catch (error) {
          console.log(`   Error: ${error.message}`);
        }
      } else {
        console.log(`❌ client.${method} not found`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugSDKDetailed().catch(console.error);