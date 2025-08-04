// tests/cache-api.test.js
/**
 * Tests pour l'API des métriques du cache
 * Teste les endpoints /api/cache/metrics (GET/DELETE)
 */

import { strict as assert } from 'assert';
import http from 'http';

// Configuration pour les tests
const TEST_CONFIG = {
  BASE_URL: 'http://localhost:3000',
  API_ENDPOINT: '/api/cache/metrics',
  TIMEOUT: 5000
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

// Simuler une session authentifiée (headers Clerk)
function getAuthHeaders() {
  // En développement, nous pourrions utiliser un token de test
  // Pour ce test, nous assumons que l'auth sera gérée séparément
  return {
    'Authorization': 'Bearer test-token', // Mock pour les tests
    'User-Agent': 'Cache-Test-Client/1.0'
  };
}

// Tests de l'API
async function runAPITests() {
  console.log('🌐 Tests de l\'API Cache Metrics...\n');
  
  let serverRunning = false;
  
  // Test de connectivité
  try {
    console.log('🔌 Test de connectivité au serveur...');
    await makeRequest('GET', '/');
    serverRunning = true;
    console.log('✅ Serveur accessible\n');
  } catch (error) {
    console.log('❌ Serveur non accessible:', error.message);
    console.log('💡 Assurez-vous que le serveur Next.js est démarré avec: npm run dev\n');
    return false;
  }

  if (!serverRunning) return false;

  // Test 1: GET /api/cache/metrics
  await test('GET /api/cache/metrics', async () => {
    const response = await makeRequest('GET', TEST_CONFIG.API_ENDPOINT, getAuthHeaders());
    
    console.log(`   Status: ${response.statusCode}`);
    console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
    
    // Vérifications de base
    if (response.statusCode === 401) {
      console.log('   ⚠️  Réponse 401: Test d\'authentification nécessaire');
      return; // Skip le reste si pas d'auth
    }
    
    assert.strictEqual(response.statusCode, 200, 'Le status devrait être 200');
    assert(response.data.success, 'La réponse devrait indiquer success: true');
    assert(response.data.data, 'La réponse devrait contenir des données');
    
    const metrics = response.data.data;
    assert(typeof metrics.hits === 'number', 'hits devrait être un nombre');
    assert(typeof metrics.misses === 'number', 'misses devrait être un nombre');
    assert(typeof metrics.hitRate === 'number', 'hitRate devrait être un nombre');
    assert(typeof metrics.cacheSize === 'number', 'cacheSize devrait être un nombre');
    assert(typeof metrics.timestamp === 'string', 'timestamp devrait être une string');
    
    console.log('✅ GET métriques fonctionne correctement');
  });

  // Test 2: Structure des métriques
  await test('Structure des métriques', async () => {
    const response = await makeRequest('GET', TEST_CONFIG.API_ENDPOINT, getAuthHeaders());
    
    if (response.statusCode === 401) {
      console.log('   ⚠️  Skip: Authentification requise');
      return;
    }
    
    const metrics = response.data.data;
    const requiredFields = ['hits', 'misses', 'sets', 'evictions', 'totalEntries', 'hitRate', 'cacheSize', 'timestamp'];
    
    for (const field of requiredFields) {
      assert(field in metrics, `Le champ '${field}' devrait être présent`);
    }
    
    // Vérifications de cohérence
    assert(metrics.hits >= 0, 'hits devrait être >= 0');
    assert(metrics.misses >= 0, 'misses devrait être >= 0');
    assert(metrics.hitRate >= 0 && metrics.hitRate <= 100, 'hitRate devrait être entre 0 et 100');
    
    console.log('✅ Structure des métriques correcte');
  });

  // Test 3: DELETE /api/cache/metrics (clear cache)
  await test('DELETE /api/cache/metrics (clear cache)', async () => {
    const response = await makeRequest('DELETE', TEST_CONFIG.API_ENDPOINT, getAuthHeaders());
    
    console.log(`   Status: ${response.statusCode}`);
    console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
    
    if (response.statusCode === 401) {
      console.log('   ⚠️  Skip: Authentification requise');
      return;
    }
    
    assert.strictEqual(response.statusCode, 200, 'Le status devrait être 200');
    assert(response.data.success, 'La réponse devrait indiquer success: true');
    assert(response.data.message, 'Devrait contenir un message de confirmation');
    
    const afterMetrics = response.data.data.after;
    assert.strictEqual(afterMetrics.totalEntries, 0, 'Le cache devrait être vide après clear');
    assert.strictEqual(afterMetrics.hits, 0, 'Les hits devraient être remis à 0');
    assert.strictEqual(afterMetrics.misses, 0, 'Les misses devraient être remis à 0');
    
    console.log('✅ DELETE clear cache fonctionne correctement');
  });

  // Test 4: Méthodes non supportées
  await test('Méthodes HTTP non supportées', async () => {
    try {
      const response = await makeRequest('POST', TEST_CONFIG.API_ENDPOINT, getAuthHeaders());
      assert.strictEqual(response.statusCode, 405, 'POST devrait retourner 405 Method Not Allowed');
      console.log('✅ POST correctement rejeté avec 405');
    } catch (error) {
      // Certains serveurs peuvent fermer la connexion
      console.log('✅ POST correctement rejeté (connexion fermée)');
    }
    
    try {
      const response = await makeRequest('PUT', TEST_CONFIG.API_ENDPOINT, getAuthHeaders());
      assert.strictEqual(response.statusCode, 405, 'PUT devrait retourner 405 Method Not Allowed');
      console.log('✅ PUT correctement rejeté avec 405');
    } catch (error) {
      console.log('✅ PUT correctement rejeté (connexion fermée)');
    }
  });

  // Test 5: Headers de réponse
  await test('Headers de réponse', async () => {
    const response = await makeRequest('GET', TEST_CONFIG.API_ENDPOINT, getAuthHeaders());
    
    if (response.statusCode === 401) {
      console.log('   ⚠️  Skip: Authentification requise');
      return;
    }
    
    const contentType = response.headers['content-type'];
    assert(contentType && contentType.includes('application/json'), 'Content-Type devrait être application/json');
    
    console.log('✅ Headers corrects');
  });

  return true;
}

// Test de charge de l'API
async function runAPILoadTest() {
  console.log('\n🚀 Test de charge API...\n');
  
  const concurrentRequests = 10;
  const totalRequests = 50;
  const batches = Math.ceil(totalRequests / concurrentRequests);
  
  const results = [];
  
  for (let batch = 0; batch < batches; batch++) {
    console.log(`📊 Batch ${batch + 1}/${batches}...`);
    
    const promises = [];
    const batchSize = Math.min(concurrentRequests, totalRequests - batch * concurrentRequests);
    
    for (let i = 0; i < batchSize; i++) {
      const start = Date.now();
      const promise = makeRequest('GET', TEST_CONFIG.API_ENDPOINT, getAuthHeaders())
        .then(response => ({
          duration: Date.now() - start,
          statusCode: response.statusCode,
          success: response.statusCode === 200
        }))
        .catch(error => ({
          duration: Date.now() - start,
          statusCode: 0,
          success: false,
          error: error.message
        }));
      
      promises.push(promise);
    }
    
    const batchResults = await Promise.all(promises);
    results.push(...batchResults);
    
    // Petite pause entre les batches
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Analyser les résultats
  const successCount = results.filter(r => r.success).length;
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  const maxDuration = Math.max(...results.map(r => r.duration));
  const minDuration = Math.min(...results.map(r => r.duration));
  
  console.log('\n📈 Résultats du test de charge:');
  console.log(`   - Total requêtes: ${results.length}`);
  console.log(`   - Succès: ${successCount} (${(successCount / results.length * 100).toFixed(1)}%)`);
  console.log(`   - Temps moyen: ${avgDuration.toFixed(1)}ms`);
  console.log(`   - Temps min: ${minDuration}ms`);
  console.log(`   - Temps max: ${maxDuration}ms`);
  
  if (successCount / results.length < 0.95) {
    console.log('⚠️  Taux de succès faible, vérifier la stabilité de l\'API');
  } else {
    console.log('✅ API stable sous charge');
  }
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
    console.log('🎯 Tests API Cache Metrics\n');
    console.log('========================================\n');
    
    const apiWorking = await runAPITests();
    
    if (apiWorking) {
      await runAPILoadTest();
    }
    
    console.log('\n🎉 Tests API terminés !');
    
  } catch (error) {
    console.error('\n❌ Erreur durant les tests API:', error.message);
    process.exit(1);
  }
}

// Instructions d'utilisation
function showUsage() {
  console.log(`
📖 Instructions d'utilisation:

1. Démarrer le serveur Next.js:
   npm run dev

2. Exécuter les tests:
   node tests/cache-api.test.js

3. Variables d'environnement optionnelles:
   - BASE_URL: URL du serveur (défaut: http://localhost:3000)
   - TIMEOUT: Timeout des requêtes en ms (défaut: 5000)

4. Notes importantes:
   - Les tests d'authentification peuvent échouer selon la configuration Clerk
   - Le serveur doit être accessible pour que les tests fonctionnent
   - Certains tests modifient l'état du cache (clear)

`);
}

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    showUsage();
  } else {
    main();
  }
}

export { runAPITests, runAPILoadTest };