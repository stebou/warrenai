const dotenv = require('dotenv');

dotenv.config({ path: '.env' });

const secret = process.env.COINBASE_ADVANCED_API_SECRET;
console.log('Secret ending characters:');
console.log('Last 50 chars:', JSON.stringify(secret.slice(-50)));
console.log('');

// Vérifier chaque caractère à la fin
const lastChars = secret.slice(-10);
for (let i = 0; i < lastChars.length; i++) {
  const char = lastChars[i];
  const code = char.charCodeAt(0);
  console.log(`Char ${i}: "${char}" (code: ${code})`);
}

console.log('');
console.log('Expected ending: "-----\\n"');
console.log('Actual ending:', JSON.stringify(secret.slice(-10)));
console.log('Ends with "-----":', secret.endsWith('-----'));
console.log('Ends with "-----\\n":', secret.endsWith('-----\n'));