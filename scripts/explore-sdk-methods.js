const { Coinbase } = require('coinbase-advanced-node');
const dotenv = require('dotenv');

dotenv.config({ path: '.env' });

async function exploreSDKMethods() {
  try {
    const config = {
      cloudApiKeyName: process.env.COINBASE_ADVANCED_API_KEY,
      cloudApiSecret: process.env.COINBASE_ADVANCED_API_SECRET.replace(/\\n/g, '\n'),
    };
    
    const client = new Coinbase(config);
    
    console.log('🔍 Exploring SDK methods structure...\n');
    
    // Explorer les méthodes sous rest
    const restMethods = ['account', 'product', 'order', 'fill', 'time', 'portfolios'];
    
    for (const method of restMethods) {
      if (client.rest[method]) {
        console.log(`📦 client.rest.${method}:`);
        console.log(`   Type: ${typeof client.rest[method]}`);
        
        if (typeof client.rest[method] === 'object') {
          const subMethods = Object.keys(client.rest[method]).filter(key => 
            typeof client.rest[method][key] === 'function'
          );
          console.log(`   Methods: ${subMethods.join(', ')}`);
        }
        console.log('');
      }
    }
    
    // Tester quelques méthodes
    console.log('🧪 Testing specific methods...\n');
    
    // Test time (public endpoint)
    try {
      console.log('📞 Testing client.rest.time.get()...');
      if (client.rest.time && typeof client.rest.time.get === 'function') {
        const timeResult = await client.rest.time.get();
        console.log('✅ Time result:', timeResult);
      } else {
        console.log('❌ time.get method not found');
      }
    } catch (error) {
      console.log('❌ Time error:', error.message);
    }
    
    // Test products (public endpoint)
    try {
      console.log('\n📞 Testing client.rest.product methods...');
      if (client.rest.product) {
        const productMethods = Object.keys(client.rest.product).filter(key => 
          typeof client.rest.product[key] === 'function'
        );
        console.log('   Available product methods:', productMethods);
        
        if (typeof client.rest.product.get === 'function') {
          const productResult = await client.rest.product.get();
          console.log('✅ Products result:', productResult);
        }
      }
    } catch (error) {
      console.log('❌ Product error:', error.message);
    }
    
    // Test accounts (authenticated endpoint)
    try {
      console.log('\n📞 Testing client.rest.account methods...');
      if (client.rest.account) {
        const accountMethods = Object.keys(client.rest.account).filter(key => 
          typeof client.rest.account[key] === 'function'
        );
        console.log('   Available account methods:', accountMethods);
        
        if (typeof client.rest.account.get === 'function') {
          const accountResult = await client.rest.account.get();
          console.log('✅ Accounts result:', accountResult);
        }
      }
    } catch (error) {
      console.log('❌ Account error:', error.message);
    }
    
  } catch (error) {
    console.error('❌ General error:', error.message);
  }
}

exploreSDKMethods().catch(console.error);