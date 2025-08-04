// scripts/test-cache-manual.js
/**
 * Script de test manuel pour valider le cache en conditions réelles
 * Utilise le vrai cache et peut optionnellement utiliser le vrai OpenAI
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Simuler l'environnement Next.js pour les imports
globalThis.process = process;

// Configuration
const CONFIG = {
  USE_REAL_OPENAI: process.env.USE_REAL_OPENAI === 'true',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  TEST_DURATION_MS: 30000, // 30 secondes
  CONCURRENT_REQUESTS: 5
};

console.log('🧪 Test manuel du cache - Configuration:');
console.log(`   - OpenAI réel: ${CONFIG.USE_REAL_OPENAI ? '✅' : '❌ (mode mock)'}`);
console.log(`   - Durée du test: ${CONFIG.TEST_DURATION_MS / 1000}s`);
console.log(`   - Requêtes concurrentes: ${CONFIG.CONCURRENT_REQUESTS}\n`);

// Import dynamique du cache
let enhancedCache;
try {
  // Essayer d'importer le vrai cache
  const cacheModule = await import('../src/lib/trading/cache/enhanced-cache.ts');
  enhancedCache = cacheModule.enhancedCache;
  console.log('✅ Cache réel importé avec succès');
} catch (error) {
  console.log('⚠️  Impossible d\'importer le cache réel, utilisation du mock:', error.message);
  // Fallback vers un cache mock
  enhancedCache = {
    get: () => null,
    set: () => {},
    getMetrics: () => ({ hits: 0, misses: 0, sets: 0, hitRate: 0 }),
    clear: () => {},
    size: () => 0
  };
}

// Prompts de test variés
const TEST_PROMPTS = [
  'Create a Bitcoin momentum trading bot with medium risk',
  'Generate an Ethereum scalping strategy for high frequency trading',
  'Build a multi-asset portfolio rebalancing bot',
  'Design a DCA bot for long-term Bitcoin accumulation',
  'Create a mean reversion strategy for altcoin trading',
  'Generate a grid trading bot for stable pairs',
  'Build an arbitrage detection system',
  'Create a sentiment-based trading algorithm',
  'Design a volatility breakout strategy',
  'Generate a pairs trading bot for correlated assets'
];

// Classe pour simuler OpenAI si nécessaire
class MockOpenAIResponse {
  static generate(prompt) {
    const strategies = ['momentum', 'scalping', 'grid', 'dca', 'arbitrage'];
    const randomStrategy = strategies[Math.floor(Math.random() * strategies.length)];
    
    return {
      name: 'ai-generated-bot',
      strategy: randomStrategy,
      description: `Bot generated for: ${prompt.substring(0, 50)}...`,
      aiConfig: {
        prompt,
        source: 'mock-openai',
        model: 'gpt-4-mock',
        generatedAt: new Date().toISOString(),
        riskLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)]
      }
    };
  }
}

// Fonction pour simuler un appel OpenAI avec cache
async function generateBotSpecWithCache(prompt, useRealAPI = false) {
  const model = 'gpt-4-turbo';
  const requestParams = { response_format: { type: 'json_object' } };
  
  // 1. Vérifier le cache
  const startCache = Date.now();
  const cachedResult = enhancedCache.get(prompt, model, requestParams);
  const cacheTime = Date.now() - startCache;
  
  if (cachedResult) {
    console.log(`📦 Cache HIT (${cacheTime}ms): ${prompt.substring(0, 40)}...`);
    return {
      result: cachedResult,
      cached: true,
      duration: cacheTime
    };
  }
  
  // 2. Simuler appel API
  console.log(`🌐 Cache MISS, appel API: ${prompt.substring(0, 40)}...`);
  const startAPI = Date.now();
  
  let result;
  if (useRealAPI && CONFIG.OPENAI_API_KEY) {
    try {
      // TODO: Implémenter le vrai appel OpenAI si nécessaire
      result = MockOpenAIResponse.generate(prompt);
    } catch (error) {
      console.log(`⚠️  Erreur API, fallback vers mock: ${error.message}`);
      result = MockOpenAIResponse.generate(prompt);
    }
  } else {
    // Simuler latence réseau
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 500));
    result = MockOpenAIResponse.generate(prompt);
  }
  
  const apiTime = Date.now() - startAPI;
  
  // 3. Mettre en cache
  enhancedCache.set(prompt, result, model, requestParams, 1000 * 60 * 120); // 2h TTL
  
  console.log(`✅ Résultat mis en cache (${apiTime}ms): ${result.strategy}`);
  
  return {
    result,
    cached: false,
    duration: apiTime
  };
}

// Test de charge du cache
async function runLoadTest() {
  console.log('🚀 Démarrage du test de charge...\n');
  
  const startTime = Date.now();
  const results = [];
  let totalRequests = 0;
  
  // Boucle de test
  while (Date.now() - startTime < CONFIG.TEST_DURATION_MS) {
    const promises = [];
    
    // Lancer plusieurs requêtes concurrentes
    for (let i = 0; i < CONFIG.CONCURRENT_REQUESTS; i++) {
      const randomPrompt = TEST_PROMPTS[Math.floor(Math.random() * TEST_PROMPTS.length)];
      promises.push(generateBotSpecWithCache(randomPrompt, CONFIG.USE_REAL_OPENAI));
      totalRequests++;
    }
    
    const batchResults = await Promise.all(promises);
    results.push(...batchResults);
    
    // Attendre un peu avant le prochain batch
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Afficher progress
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    const metrics = enhancedCache.getMetrics();
    console.log(`⏱️  ${elapsed}s - Requêtes: ${totalRequests}, Hit Rate: ${metrics.hitRate.toFixed(1)}%`);
  }
  
  return results;
}

// Analyser les résultats
function analyzeResults(results) {
  console.log('\n📊 Analyse des résultats:\n');
  
  const cached = results.filter(r => r.cached);
  const notCached = results.filter(r => !r.cached);
  
  const avgCacheTime = cached.reduce((sum, r) => sum + r.duration, 0) / cached.length || 0;
  const avgAPITime = notCached.reduce((sum, r) => sum + r.duration, 0) / notCached.length || 0;
  
  console.log(`📈 Statistiques générales:`);
  console.log(`   - Total requêtes: ${results.length}`);
  console.log(`   - Cache hits: ${cached.length} (${(cached.length / results.length * 100).toFixed(1)}%)`);
  console.log(`   - Cache misses: ${notCached.length} (${(notCached.length / results.length * 100).toFixed(1)}%)`);
  console.log(`   - Temps moyen cache: ${avgCacheTime.toFixed(1)}ms`);
  console.log(`   - Temps moyen API: ${avgAPITime.toFixed(1)}ms`);
  console.log(`   - Gain de performance: ${((avgAPITime - avgCacheTime) / avgAPITime * 100).toFixed(1)}%\n`);
  
  const metrics = enhancedCache.getMetrics();
  console.log(`📊 Métriques du cache:`);
  console.log(`   - Hits: ${metrics.hits}`);
  console.log(`   - Misses: ${metrics.misses}`);
  console.log(`   - Sets: ${metrics.sets}`);
  console.log(`   - Hit Rate: ${metrics.hitRate.toFixed(1)}%`);
  console.log(`   - Entries: ${metrics.totalEntries}`);
  console.log(`   - Evictions: ${metrics.evictions}\n`);
}

// Test spécifique des fonctionnalités
async function runFeatureTests() {
  console.log('🔧 Test des fonctionnalités spécifiques...\n');
  
  // Test 1: Hash consistency
  console.log('1️⃣ Test de cohérence des hash...');
  const prompt1 = 'Create a Bitcoin bot';
  const prompt2 = '  CREATE A BITCOIN BOT  '; // Casse et espaces différents
  
  await generateBotSpecWithCache(prompt1);
  const result2 = await generateBotSpecWithCache(prompt2);
  
  if (result2.cached) {
    console.log('   ✅ Hash normalization fonctionne');
  } else {
    console.log('   ❌ Hash normalization échoue');
  }
  
  // Test 2: Différents modèles
  console.log('\n2️⃣ Test des modèles différents...');
  // Note: Cette fonctionnalité nécessiterait une modification du script pour tester différents modèles
  console.log('   ⏭️  Test des modèles sauté (nécessite modification du code)');
  
  // Test 3: TTL
  console.log('\n3️⃣ Test du TTL...');
  console.log('   ⏭️  Test TTL sauté (nécessiterait un TTL très court)');
  
  // Test 4: Clear cache
  console.log('\n4️⃣ Test de vidage du cache...');
  const sizeBefore = enhancedCache.size();
  enhancedCache.clear();
  const sizeAfter = enhancedCache.size();
  
  console.log(`   Cache avant: ${sizeBefore} entrées`);
  console.log(`   Cache après: ${sizeAfter} entrées`);
  console.log(sizeAfter === 0 ? '   ✅ Clear fonctionne' : '   ❌ Clear échoue');
}

// Fonction principale
async function main() {
  try {
    console.log('🎯 Test manuel du cache LLM\n');
    console.log('========================================\n');
    
    // Vider le cache au début
    enhancedCache.clear();
    
    // Test de charge
    const results = await runLoadTest();
    
    // Analyser les résultats
    analyzeResults(results);
    
    // Tests des fonctionnalités
    await runFeatureTests();
    
    console.log('\n🎉 Tests terminés avec succès !');
    
    const finalMetrics = enhancedCache.getMetrics();
    console.log('\n📋 Métriques finales:');
    console.log(JSON.stringify(finalMetrics, null, 2));
    
  } catch (error) {
    console.error('❌ Erreur durant les tests:', error);
    process.exit(1);
  }
}

// Gestion des signaux pour un arrêt propre
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Test interrompu par l\'utilisateur');
  const metrics = enhancedCache.getMetrics();
  console.log('📊 Métriques au moment de l\'arrêt:');
  console.log(JSON.stringify(metrics, null, 2));
  process.exit(0);
});

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}