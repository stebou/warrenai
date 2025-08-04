// tests/bot-creation-api.test.js
/**
 * Tests d'intégration pour l'API de création de bot étendue
 * Teste l'API avec les nouveaux champs et la validation Zod
 */

import { strict as assert } from 'assert';
import http from 'http';

// Configuration pour les tests
const TEST_CONFIG = {
  BASE_URL: 'http://localhost:3000',
  API_ENDPOINT: '/api/bots/create',
  TIMEOUT: 10000
};

// Helper pour faire des requêtes HTTP
function makeRequest(method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, TEST_CONFIG.BASE_URL);
    
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      timeout: TEST_CONFIG.TIMEOUT
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = data ? JSON.parse(data) : null;
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timeout after ${TEST_CONFIG.TIMEOUT}ms`));
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

// Configurations de test
const validBotConfig = {
  name: 'Test Bot API',
  description: 'Bot de test pour l\'API étendue avec validation Zod complète',
  initialAllocation: {
    initialAmount: 5000,
    baseCurrency: 'USD',
    autoRebalance: true,
    rebalanceFrequency: 24
  },
  strategyHints: ['momentum', 'trend_following'],
  riskLimits: {
    maxAllocation: 0.15,
    maxDailyLoss: 0.03,
    maxPositionSize: 0.10,
    stopLoss: 0.025,
    takeProfit: 0.06,
    maxDrawdown: 0.12
  },
  riskLevel: 'medium',
  targetPairs: ['BTC/USD', 'ETH/USD', 'ADA/USD'],
  preferredIndicators: ['RSI', 'MACD', 'EMA', 'BB'],
  enableBacktest: true,
  advancedConfig: {
    aiOptimization: true,
    tradingFrequency: 30,
    notifications: true
  }
};

const minimalBotConfig = {
  name: 'Minimal Bot',
  description: 'Configuration minimale valide pour test',
  initialAllocation: {
    initialAmount: 1000,
    baseCurrency: 'USD',
    autoRebalance: false
  },
  strategyHints: ['dca'],
  riskLimits: {
    maxAllocation: 0.08,
    maxDailyLoss: 0.02,
    maxPositionSize: 0.06,
    stopLoss: 0.015,
    maxDrawdown: 0.10
  }
};

const highFreqBotConfig = {
  name: 'Scalping Bot',
  description: 'Bot de scalping haute fréquence avec limites strictes',
  initialAllocation: {
    initialAmount: 2000,
    baseCurrency: 'USD',
    autoRebalance: false
  },
  strategyHints: ['scalping'],
  riskLimits: {
    maxAllocation: 0.08,
    maxDailyLoss: 0.03,
    maxPositionSize: 0.05,
    stopLoss: 0.01,
    maxDrawdown: 0.08
  },
  targetPairs: ['BTC/USD'],
  preferredIndicators: ['VOLUME', 'ATR'],
  advancedConfig: {
    aiOptimization: false,
    tradingFrequency: 1,
    notifications: true
  }
};

function getAuthHeaders() {
  // Mock headers d'authentification pour les tests
  return {
    'Authorization': 'Bearer test-token',
    'User-Agent': 'Bot-Creation-Test-Client/1.0'
  };
}

// Tests de l'API
async function runAPITests() {
  console.log('🤖 Tests API de création de bot étendue...\n');
  
  let serverRunning = false;
  
  // Test de connectivité
  try {
    console.log('🔌 Test de connectivité au serveur...');
    await makeRequest('GET', '/');
    serverRunning = true;
    console.log('✅ Serveur accessible\n');
  } catch (error) {
    console.log('❌ Serveur non accessible:', error.message);
    console.log('💡 Démarrez le serveur avec: npm run dev\n');
    return false;
  }

  if (!serverRunning) return false;

  // Test 1: Création avec configuration complète
  await test('Création avec configuration complète', async () => {
    const response = await makeRequest('POST', TEST_CONFIG.API_ENDPOINT, getAuthHeaders(), validBotConfig);
    
    console.log(`   Status: ${response.statusCode}`);
    
    if (response.statusCode === 401) {
      console.log('   ⚠️  Authentification requise - skip test');
      return;
    }
    
    if (response.statusCode !== 201) {
      console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
    }
    
    assert.strictEqual(response.statusCode, 201, 'Création devrait retourner 201');
    assert(response.data.id, 'Réponse devrait contenir un ID');
    assert(response.data.validationInfo, 'Réponse devrait contenir validationInfo');
    assert.strictEqual(response.data.name, validBotConfig.name, 'Nom devrait correspondre');
    assert.strictEqual(response.data.description, validBotConfig.description, 'Description devrait correspondre');
    
    // Vérifier les informations de validation
    assert(response.data.validationInfo.riskLevel, 'Niveau de risque devrait être calculé');
    assert(response.data.validationInfo.strategiesApplied, 'Stratégies appliquées devraient être listées');
    assert(response.data.validationInfo.configCompliance === 'valid', 'Configuration devrait être valide');
    
    console.log(`   ✅ Bot créé: ${response.data.id}`);
    console.log(`   📊 Niveau de risque: ${response.data.validationInfo.riskLevel}`);
    console.log(`   🎯 Stratégies: ${response.data.validationInfo.strategiesApplied.join(', ')}`);
  });

  // Test 2: Création avec configuration minimale
  await test('Création avec configuration minimale', async () => {
    const response = await makeRequest('POST', TEST_CONFIG.API_ENDPOINT, getAuthHeaders(), minimalBotConfig);
    
    if (response.statusCode === 401) {
      console.log('   ⚠️  Authentification requise - skip test');
      return;
    }
    
    assert.strictEqual(response.statusCode, 201, 'Configuration minimale devrait être acceptée');
    assert(response.data.validationInfo.riskLevel, 'Niveau de risque devrait être auto-calculé');
    
    console.log(`   ✅ Bot minimal créé avec niveau de risque: ${response.data.validationInfo.riskLevel}`);
  });

  // Test 3: Configuration haute fréquence
  await test('Création bot haute fréquence', async () => {
    const response = await makeRequest('POST', TEST_CONFIG.API_ENDPOINT, getAuthHeaders(), highFreqBotConfig);
    
    if (response.statusCode === 401) {
      console.log('   ⚠️  Authentification requise - skip test');
      return;
    }
    
    assert.strictEqual(response.statusCode, 201, 'Bot haute fréquence avec limites strictes devrait être accepté');
    
    console.log(`   ✅ Bot scalping créé avec fréquence: ${highFreqBotConfig.advancedConfig.tradingFrequency}min`);
  });

  // Test 4: Validation - Nom invalide
  await test('Validation - Nom trop court', async () => {
    const invalidConfig = { ...minimalBotConfig, name: 'AB' };
    const response = await makeRequest('POST', TEST_CONFIG.API_ENDPOINT, getAuthHeaders(), invalidConfig);
    
    if (response.statusCode === 401) {
      console.log('   ⚠️  Authentification requise - skip test');
      return;
    }
    
    assert.strictEqual(response.statusCode, 400, 'Nom invalide devrait retourner 400');
    assert(response.data.error, 'Erreur devrait être présente');
    assert(response.data.details, 'Détails de validation devraient être présents');
    
    console.log(`   ✅ Validation du nom rejetée correctement`);
  });

  // Test 5: Validation - Description manquante
  await test('Validation - Description manquante', async () => {
    const invalidConfig = { ...minimalBotConfig };
    delete invalidConfig.description;
    
    const response = await makeRequest('POST', TEST_CONFIG.API_ENDPOINT, getAuthHeaders(), invalidConfig);
    
    if (response.statusCode === 401) {
      console.log('   ⚠️  Authentification requise - skip test');
      return;
    }
    
    assert.strictEqual(response.statusCode, 400, 'Description manquante devrait retourner 400');
    
    console.log(`   ✅ Validation description rejetée correctement`);
  });

  // Test 6: Validation - Allocation excessive
  await test('Validation - Allocation excessive', async () => {
    const invalidConfig = {
      ...minimalBotConfig,
      riskLimits: {
        ...minimalBotConfig.riskLimits,
        maxAllocation: 0.8 // 80% - trop élevé
      }
    };
    
    const response = await makeRequest('POST', TEST_CONFIG.API_ENDPOINT, getAuthHeaders(), invalidConfig);
    
    if (response.statusCode === 401) {
      console.log('   ⚠️  Authentification requise - skip test');
      return;
    }
    
    assert.strictEqual(response.statusCode, 400, 'Allocation excessive devrait retourner 400');
    
    console.log(`   ✅ Validation allocation excessive rejetée`);
  });

  // Test 7: Validation - Stratégie haute fréquence avec limites inadéquates
  await test('Validation - Scalping avec limites trop élevées', async () => {
    const invalidConfig = {
      ...minimalBotConfig,
      strategyHints: ['scalping'],
      riskLimits: {
        ...minimalBotConfig.riskLimits,
        maxPositionSize: 0.15, // 15% - trop pour scalping
        maxDailyLoss: 0.08     // 8% - trop pour scalping
      }
    };
    
    const response = await makeRequest('POST', TEST_CONFIG.API_ENDPOINT, getAuthHeaders(), invalidConfig);
    
    if (response.statusCode === 401) {
      console.log('   ⚠️  Authentification requise - skip test');
      return;
    }
    
    assert.strictEqual(response.statusCode, 400, 'Scalping avec limites élevées devrait retourner 400');
    
    console.log(`   ✅ Validation contraintes haute fréquence rejetée`);
  });

  // Test 8: Validation - Auto-rebalance sans fréquence
  await test('Validation - Auto-rebalance sans fréquence', async () => {
    const invalidConfig = {
      ...minimalBotConfig,
      initialAllocation: {
        ...minimalBotConfig.initialAllocation,
        autoRebalance: true
        // rebalanceFrequency manquant
      }
    };
    
    const response = await makeRequest('POST', TEST_CONFIG.API_ENDPOINT, getAuthHeaders(), invalidConfig);
    
    if (response.statusCode === 401) {
      console.log('   ⚠️  Authentification requise - skip test');
      return;
    }
    
    assert.strictEqual(response.statusCode, 400, 'Auto-rebalance sans fréquence devrait retourner 400');
    
    console.log(`   ✅ Validation auto-rebalance rejetée`);
  });

  // Test 9: Validation - Trop de stratégies
  await test('Validation - Trop de stratégies', async () => {
    const invalidConfig = {
      ...minimalBotConfig,
      strategyHints: ['momentum', 'scalping', 'grid', 'arbitrage', 'dca', 'swing'] // 6 stratégies - max 5
    };
    
    const response = await makeRequest('POST', TEST_CONFIG.API_ENDPOINT, getAuthHeaders(), invalidConfig);
    
    if (response.statusCode === 401) {
      console.log('   ⚠️  Authentification requise - skip test');
      return;
    }
    
    assert.strictEqual(response.statusCode, 400, 'Trop de stratégies devrait retourner 400');
    
    console.log(`   ✅ Validation nombre de stratégies rejetée`);
  });

  // Test 10: Structure de réponse enrichie
  await test('Structure de réponse enrichie', async () => {
    const response = await makeRequest('POST', TEST_CONFIG.API_ENDPOINT, getAuthHeaders(), validBotConfig);
    
    if (response.statusCode === 401) {
      console.log('   ⚠️  Authentification requise - skip test');
      return;
    }
    
    if (response.statusCode === 201) {
      // Vérifier la structure enrichie
      const requiredFields = ['id', 'name', 'description', 'strategy', 'aiConfig', 'validationInfo'];
      for (const field of requiredFields) {
        assert(field in response.data, `Le champ '${field}' devrait être présent`);
      }
      
      // Vérifier validationInfo
      const validationInfo = response.data.validationInfo;
      assert(validationInfo.riskLevel, 'riskLevel devrait être présent');
      assert(validationInfo.configCompliance, 'configCompliance devrait être présent');
      assert(Array.isArray(validationInfo.strategiesApplied), 'strategiesApplied devrait être un array');
      assert(validationInfo.riskScore, 'riskScore devrait être présent');
      
      console.log(`   ✅ Structure de réponse complète et enrichie`);
    }
  });

  return true;
}

// Helper pour les tests
async function test(name, fn) {
  try {
    console.log(`🧪 ${name}...`);
    await fn();
  } catch (error) {
    console.error(`❌ Test échoué: ${name}`);
    console.error(`   Erreur: ${error.message}`);
    throw error;
  }
}

// Fonction principale
async function main() {
  try {
    console.log('🎯 Tests API Bot Creation Extended\n');
    console.log('========================================\n');
    
    const apiWorking = await runAPITests();
    
    if (apiWorking) {
      console.log('\n🎉 Tests API terminés avec succès !');
    }
    
  } catch (error) {
    console.error('\n❌ Erreur durant les tests API:', error.message);
    process.exit(1);
  }
}

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { runAPITests };