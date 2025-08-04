const dotenv = require('dotenv');

dotenv.config({ path: '.env' });

console.log('🔍 Debug Private Key Processing\n');

const rawSecret = process.env.COINBASE_ADVANCED_API_SECRET;
console.log('Raw secret from env:');
console.log(rawSecret);
console.log('Length:', rawSecret?.length);
console.log('');

if (rawSecret) {
  // Tester le remplacement comme dans notre client
  const processedSecret = rawSecret.replace(/\\n/g, '\n');
  console.log('Processed secret (\\\\n -> \\n):');
  console.log(processedSecret);
  console.log('Length:', processedSecret.length);
  console.log('');
  
  // Vérifier si ça commence bien par BEGIN
  console.log('Starts with BEGIN:', processedSecret.startsWith('-----BEGIN'));
  console.log('Ends with END:', processedSecret.endsWith('-----'));
  console.log('');
  
  // Tester avec jsonwebtoken
  try {
    const jwt = require('jsonwebtoken');
    const testPayload = { iss: 'test', exp: Math.floor(Date.now() / 1000) + 60 };
    const testToken = jwt.sign(testPayload, processedSecret, { algorithm: 'ES256' });
    console.log('✅ JWT Test successful!');
    console.log('Token preview:', testToken.substring(0, 50) + '...');
  } catch (error) {
    console.log('❌ JWT Test failed:', error.message);
  }
}

console.log('\n🔍 Environment Variables:');
console.log('API Key:', process.env.COINBASE_ADVANCED_API_KEY);
console.log('API Secret exists:', !!process.env.COINBASE_ADVANCED_API_SECRET);
console.log('API Secret preview:', process.env.COINBASE_ADVANCED_API_SECRET?.substring(0, 30) + '...');