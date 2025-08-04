#!/usr/bin/env tsx

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

async function testCoinbaseAuthUrl() {
  console.log('🔗 Test de l\'URL d\'autorisation Coinbase\n');

  const clientId = process.env.COINBASE_CLIENT_ID;
  const redirectUri = process.env.COINBASE_REDIRECT_URI;
  const state = 'test-state-' + Date.now();

  const authUrl = `https://login.coinbase.com/oauth2/auth?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri!)}&state=${state}&scope=wallet:user:read,wallet:accounts:read,wallet:transactions:read`;

  console.log('🔧 Configuration:');
  console.log(`  Client ID: ${clientId}`);
  console.log(`  Redirect URI: ${redirectUri}`);
  console.log(`  State: ${state}`);
  console.log('');
  console.log('🔗 URL d\'autorisation:');
  console.log(`  ${authUrl}`);
  console.log('');

  try {
    console.log('📞 Test de l\'accessibilité de l\'URL...');
    
    const response = await axios.get(authUrl, {
      maxRedirects: 0,
      validateStatus: (status) => status < 500,
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });

    console.log(`✅ Status: ${response.status}`);
    
    if (response.status === 200) {
      console.log('✅ URL d\'autorisation accessible!');
      if (response.data.includes('Coinbase')) {
        console.log('✅ Page Coinbase détectée!');
      }
    } else if (response.status >= 400) {
      console.log('❌ Erreur client - vérifier les credentials');
    }

  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.log(`📊 Status: ${error.response?.status}`);
      
      if (error.response?.status === 400) {
        console.log('❌ Mauvaise requête - Client ID ou paramètres invalides');
      } else if (error.response?.status === 401) {
        console.log('❌ Non autorisé - Client ID invalide');
      } else if (error.response?.status === 302) {
        console.log('🔄 Redirection détectée');
      }
    } else {
      console.error('❌ Erreur réseau:', error.message);
    }
  }

  console.log('\n📝 Pour tester manuellement:');
  console.log('1. Ouvrir l\'URL dans un navigateur');
  console.log('2. Se connecter à Coinbase');
  console.log('3. Autoriser l\'application');
  console.log('4. Vérifier la redirection vers le callback');
}

testCoinbaseAuthUrl().catch(console.error);