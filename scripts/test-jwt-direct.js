const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

dotenv.config({ path: '.env' });

console.log('🔍 Test JWT Direct\n');

const apiKey = process.env.COINBASE_ADVANCED_API_KEY;
const apiSecret = process.env.COINBASE_ADVANCED_API_SECRET;

console.log('API Key:', apiKey);
console.log('API Secret exists:', !!apiSecret);
console.log('API Secret preview:', apiSecret?.substring(0, 30) + '...');
console.log('');

// Test avec les mêmes paramètres que le SDK
const timestamp = Math.floor(Date.now() / 1000);
const payload = {
  iss: 'cdp',
  nbf: timestamp,
  exp: timestamp + 120,
  sub: apiKey,
  aud: ['retail_rest_api_proxy']
};

const header = {
  kid: apiKey,
  nonce: Math.random().toString(36)
};

console.log('Payload:', payload);
console.log('Header:', header);
console.log('');

try {
  const token = jwt.sign(payload, apiSecret, { algorithm: 'ES256', header: header });
  console.log('✅ JWT created successfully!');
  console.log('Token preview:', token.substring(0, 100) + '...');
  
  // Vérifier le token
  try {
    const decoded = jwt.decode(token, { complete: true });
    console.log('✅ JWT decoded successfully');
    console.log('Decoded header:', decoded.header);
    console.log('Decoded payload:', decoded.payload);
  } catch (decodeError) {
    console.log('❌ JWT decode failed:', decodeError.message);
  }
  
} catch (error) {
  console.log('❌ JWT creation failed:', error.message);
  console.log('Error details:', error);
  
  // Diagnostics supplémentaires
  console.log('\n🔍 Diagnostics:');
  console.log('API Secret type:', typeof apiSecret);
  console.log('API Secret starts with BEGIN:', apiSecret?.startsWith('-----BEGIN'));
  console.log('API Secret contains EC PRIVATE KEY:', apiSecret?.includes('EC PRIVATE KEY'));
  console.log('API Secret ends with END:', apiSecret?.endsWith('-----\n'));
  
  // Essayer de nettoyer la clé
  const cleanedSecret = apiSecret?.trim();
  console.log('Cleaned secret different:', cleanedSecret !== apiSecret);
  
  if (cleanedSecret !== apiSecret) {
    try {
      const tokenCleaned = jwt.sign(payload, cleanedSecret, { algorithm: 'ES256', header: header });
      console.log('✅ JWT with cleaned key successful!');
    } catch (cleanError) {
      console.log('❌ JWT with cleaned key also failed:', cleanError.message);
    }
  }
}