const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

dotenv.config({ path: '.env' });

console.log('🔍 Test JWT avec crypto.createPrivateKey\n');

const apiKey = process.env.COINBASE_ADVANCED_API_KEY;
const apiSecretString = process.env.COINBASE_ADVANCED_API_SECRET;

console.log('API Key:', apiKey);
console.log('API Secret exists:', !!apiSecretString);
console.log('API Secret preview:', apiSecretString?.substring(0, 30) + '...');
console.log('');

// Test avec crypto.createPrivateKey - SOLUTION pour jsonwebtoken 9+
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
  // SOLUTION: Utiliser crypto.createPrivateKey pour convertir la clé PEM
  const privateKeyObject = crypto.createPrivateKey({
    key: apiSecretString,
    format: 'pem',
    type: 'sec1' // Pour les clés EC
  });
  
  console.log('✅ Private key object created successfully');
  console.log('Key type:', privateKeyObject.asymmetricKeyType);
  console.log('Key size:', privateKeyObject.asymmetricKeySize);
  console.log('');
  
  // Maintenant signer avec l'objet clé
  const token = jwt.sign(payload, privateKeyObject, { algorithm: 'ES256', header: header });
  console.log('✅ JWT created successfully with crypto.createPrivateKey!');
  console.log('Token preview:', token.substring(0, 100) + '...');
  
  // Vérifier le token
  try {
    const decoded = jwt.decode(token, { complete: true });
    console.log('✅ JWT decoded successfully');
    console.log('Algorithm used:', decoded.header.alg);
    console.log('Key ID:', decoded.header.kid);
  } catch (decodeError) {
    console.log('❌ JWT decode failed:', decodeError.message);
  }
  
} catch (error) {
  console.log('❌ JWT creation failed:', error.message);
  console.log('Error details:', error);
  
  // Essayer avec différents types de clé
  console.log('\n🔍 Trying different key types...');
  
  try {
    const privateKeyObject2 = crypto.createPrivateKey({
      key: apiSecretString,
      format: 'pem'
      // Pas de type spécifié - laisser crypto deviner
    });
    
    const token2 = jwt.sign(payload, privateKeyObject2, { algorithm: 'ES256', header: header });
    console.log('✅ JWT created with auto-detected key type!');
    console.log('Token preview:', token2.substring(0, 100) + '...');
    
  } catch (error2) {
    console.log('❌ Auto-detection also failed:', error2.message);
  }
}