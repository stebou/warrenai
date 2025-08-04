#!/usr/bin/env tsx

import axios from 'axios';

async function testCoinbaseOAuthEndpoint() {
  console.log('🧪 Test de l\'endpoint OAuth Coinbase API\n');

  try {
    // Test l'endpoint d'initialisation OAuth
    console.log('📞 Appel GET /api/auth/coinbase...');
    
    const response = await axios.get('http://localhost:3000/api/auth/coinbase', {
      maxRedirects: 0, // Ne pas suivre les redirections automatiquement
      validateStatus: (status) => status < 400 // Accepter les codes 3xx comme succès
    });

    console.log(`✅ Réponse reçue - Status: ${response.status}`);
    
    if (response.status === 302) {
      const location = response.headers.location;
      console.log('🔄 Redirection détectée vers:', location);
      
      if (location && location.includes('login.coinbase.com')) {
        console.log('✅ Redirection vers Coinbase OAuth détectée!');
        console.log('🔗 URL de redirection:', location);
      } else {
        console.log('❌ Redirection vers une URL inattendue');
      }
    }

  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.log(`📊 Status: ${error.response?.status}`);
      console.log(`📊 Headers:`, error.response?.headers);
      
      if (error.response?.status === 302) {
        const location = error.response.headers.location;
        console.log('🔄 Redirection détectée vers:', location);
        
        if (location && location.includes('login.coinbase.com')) {
          console.log('✅ Test réussi! Redirection OAuth fonctionnelle');
          return;
        }
      } else if (error.response?.status === 401) {
        console.log('🔐 Erreur d\'authentification - utilisateur non connecté');
        console.log('💡 Ceci est normal pour un test sans session Clerk');
        return;
      }
    }
    
    console.error('❌ Erreur lors du test:', error.message);
  }
}

testCoinbaseOAuthEndpoint().catch(console.error);