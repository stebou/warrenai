#!/usr/bin/env tsx

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

async function testCoinbaseProductionOAuth() {
  console.log('🚀 Test OAuth Coinbase Production\n');

  const baseUrl = 'https://warrenai-ckjeozoua-stebous-projects.vercel.app';
  
  try {
    console.log('📞 Test GET /api/auth/coinbase sur production...');
    
    const response = await axios.get(`${baseUrl}/api/auth/coinbase/callback?code=test&state=test`, {
      maxRedirects: 0,
      validateStatus: (status) => status < 400,
      timeout: 10000
    });

    console.log(`✅ Réponse: ${response.status}`);
    
    if (response.status === 302) {
      const location = response.headers.location;
      console.log('🔄 Redirection vers:', location);
      
      if (location && location.includes('login.coinbase.com')) {
        console.log('✅ OAuth fonctionnel en production!');
      }
    }

  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 302) {
        const location = error.response.headers.location;
        console.log('🔄 Redirection vers:', location);
        
        if (location && location.includes('login.coinbase.com')) {
          console.log('✅ OAuth fonctionnel - redirection détectée!');
          return;
        }
      } else if (error.response?.status === 401) {
        console.log('🔐 Non authentifié (normal sans session)');
        return;
      }
      
      console.log(`📊 Status: ${error.response?.status}`);
      console.log(`📊 Data:`, error.response?.data);
    } else {
      console.error('❌ Erreur réseau:', error.message);
    }
  }
}

testCoinbaseProductionOAuth().catch(console.error);