#!/usr/bin/env tsx

import { CoinbaseOAuthClient } from '../src/lib/trading/exchanges/coinbase_oauth_client';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config({ path: '.env' });

async function testCoinbaseOAuth() {
  console.log('🧪 Test de la configuration OAuth Coinbase\n');

  // Vérifier les variables d'environnement requises
  const requiredEnvVars = [
    'COINBASE_CLIENT_ID',
    'COINBASE_CLIENT_SECRET', 
    'COINBASE_REDIRECT_URI'
  ];

  console.log('📋 Vérification des variables d\'environnement:');
  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    console.log(`  ${envVar}: ${value ? '✅ Définie' : '❌ Manquante'}`);
    if (!value) {
      console.error(`\n❌ Variable d'environnement manquante: ${envVar}`);
      process.exit(1);
    }
  }

  try {
    // Créer le client OAuth
    const client = new CoinbaseOAuthClient({
      clientId: process.env.COINBASE_CLIENT_ID!,
      clientSecret: process.env.COINBASE_CLIENT_SECRET!,
      redirectUri: process.env.COINBASE_REDIRECT_URI!,
      sandbox: true
    });

    console.log('\n🔧 Configuration du client OAuth:');
    console.log(`  Mode: Sandbox`);
    console.log(`  Client ID: ${process.env.COINBASE_CLIENT_ID}`);
    console.log(`  Redirect URI: ${process.env.COINBASE_REDIRECT_URI}`);

    // Générer une URL d'autorisation de test
    const testState = 'test-state-' + Date.now();
    const authUrl = client.getAuthorizationUrl(testState);

    console.log('\n🔗 URL d\'autorisation générée:');
    console.log(`  ${authUrl}`);

    console.log('\n✅ Test de configuration OAuth réussi!');
    console.log('\n📝 Pour tester complètement:');
    console.log('1. Copier l\'URL ci-dessus dans un navigateur');
    console.log('2. Se connecter à Coinbase');
    console.log('3. Autoriser l\'application');
    console.log('4. Vérifier que le callback fonctionne');

  } catch (error) {
    console.error('\n❌ Erreur lors du test OAuth:', error);
    process.exit(1);
  }
}

// Exécuter le test
testCoinbaseOAuth().catch(console.error);