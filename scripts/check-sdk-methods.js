const { Coinbase } = require('coinbase-advanced-node');

try {
  const client = new Coinbase({
    cloudApiKeyName: 'test',
    cloudApiSecret: 'test'
  });
  
  console.log('Propriétés client:', Object.keys(client));
  
  if (client.rest) {
    console.log('\nMéthodes REST disponibles:');
    for (let key in client.rest) {
      if (typeof client.rest[key] === 'function') {
        console.log(`- rest.${key}`);
      }
    }
  }
  
  if (client.ws) {
    console.log('\nPropriétés WebSocket:');
    console.log('- ws:', Object.keys(client.ws));
  }
  
} catch (error) {
  console.error('Erreur:', error.message);
}