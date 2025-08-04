// tests/openai-cache-integration.test.js
import { strict as assert } from 'assert';

// Mock de l'OpenAI client pour les tests
class MockOpenAIClient {
  constructor() {
    this.callCount = 0;
    this.responses = new Map();
  }

  setMockResponse(prompt, response) {
    this.responses.set(prompt, response);
  }

  async createCompletion(params) {
    this.callCount++;
    const prompt = params.messages[0].content;
    const mockResponse = this.responses.get(prompt);
    
    if (mockResponse) {
      return {
        choices: [{ message: { content: JSON.stringify(mockResponse) } }],
        model: params.model
      };
    }
    
    // Réponse par défaut
    return {
      choices: [{ 
        message: { 
          content: JSON.stringify({
            strategy: 'mock_strategy',
            description: 'Mock trading bot',
            aiConfig: { riskLevel: 'medium' }
          })
        }
      }],
      model: params.model
    };
  }

  getCallCount() {
    return this.callCount;
  }

  resetCallCount() {
    this.callCount = 0;
  }
}

// Version testable de l'OpenAI client avec cache
class TestableOpenAIClientWithCache {
  constructor(mockOpenAI, cache) {
    this.openai = mockOpenAI;
    this.cache = cache;
  }

  async generateBotSpec(prompt) {
    const model = 'gpt-4-turbo';
    const requestParams = { response_format: { type: 'json_object' } };
    
    // 1. Vérifier le cache d'abord
    const cachedResult = this.cache.get(prompt, model, requestParams);
    if (cachedResult) {
      console.log('[TEST] Cache hit, skipping OpenAI call');
      return cachedResult;
    }

    console.log('[TEST] Cache miss, calling OpenAI API...');
    
    try {
      const response = await this.openai.createCompletion({
        model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('OpenAI response content is empty.');
      }

      const parsedSpec = JSON.parse(content);
      
      const result = {
        name: 'ai-generated-bot',
        ...parsedSpec,
        aiConfig: {
          ...parsedSpec.aiConfig,
          prompt,
          source: 'openai',
          model: response.model,
          generatedAt: new Date().toISOString(),
        },
      };

      // 2. Stocker le résultat dans le cache (TTL: 2 heures)
      this.cache.set(prompt, result, model, requestParams, 1000 * 60 * 120);
      
      return result;
    } catch (error) {
      const fallbackResult = {
        name: 'fallback-bot',
        strategy: 'default_fallback',
        description: 'A fallback strategy created due to an AI generation error.',
        aiConfig: {
          prompt,
          fallback: true,
          source: 'openai-fallback',
          error: error.message,
          generatedAt: new Date().toISOString(),
        },
      };
      
      // Mettre en cache même les fallbacks (TTL court: 5 minutes)
      this.cache.set(prompt, fallbackResult, model + '_fallback', requestParams, 1000 * 60 * 5);
      
      return fallbackResult;
    }
  }
}

// Import du cache testable
import { TestableEnhancedCache } from './cache.test.js';

// Tests d'intégration
async function runIntegrationTests() {
  console.log('🔗 Début des tests d\'intégration OpenAI + Cache...\n');

  // Test 1: Premier appel sans cache
  await test('Premier appel sans cache', async () => {
    const mockOpenAI = new MockOpenAIClient();
    const cache = new TestableEnhancedCache();
    const client = new TestableOpenAIClientWithCache(mockOpenAI, cache);
    
    const prompt = 'Create a Bitcoin trading bot';
    const mockResponse = {
      strategy: 'btc_scalping',
      description: 'Bitcoin scalping bot',
      aiConfig: { riskLevel: 'high' }
    };
    
    mockOpenAI.setMockResponse(prompt, mockResponse);
    
    const result = await client.generateBotSpec(prompt);
    
    assert.strictEqual(mockOpenAI.getCallCount(), 1, 'OpenAI devrait être appelé une fois');
    assert.strictEqual(result.strategy, 'btc_scalping', 'La stratégie devrait correspondre');
    assert.strictEqual(cache.size(), 1, 'Le cache devrait contenir 1 entrée');
    
    const metrics = cache.getMetrics();
    assert.strictEqual(metrics.misses, 1, 'Il devrait y avoir 1 miss');
    assert.strictEqual(metrics.sets, 1, 'Il devrait y avoir 1 set');
    
    console.log('✅ Test 1 réussi: Premier appel sans cache');
  });

  // Test 2: Deuxième appel avec cache hit
  await test('Deuxième appel avec cache hit', async () => {
    const mockOpenAI = new MockOpenAIClient();
    const cache = new TestableEnhancedCache();
    const client = new TestableOpenAIClientWithCache(mockOpenAI, cache);
    
    const prompt = 'Create an Ethereum trading bot';
    const mockResponse = {
      strategy: 'eth_momentum',
      description: 'Ethereum momentum bot',
      aiConfig: { riskLevel: 'medium' }
    };
    
    mockOpenAI.setMockResponse(prompt, mockResponse);
    
    // Premier appel
    const result1 = await client.generateBotSpec(prompt);
    assert.strictEqual(mockOpenAI.getCallCount(), 1, 'Premier appel: OpenAI appelé');
    
    // Deuxième appel (devrait utiliser le cache)
    const result2 = await client.generateBotSpec(prompt);
    assert.strictEqual(mockOpenAI.getCallCount(), 1, 'Deuxième appel: OpenAI ne devrait pas être rappelé');
    
    // Les résultats devraient être identiques
    assert.deepStrictEqual(result1, result2, 'Les résultats devraient être identiques');
    
    const metrics = cache.getMetrics();
    assert.strictEqual(metrics.hits, 1, 'Il devrait y avoir 1 hit');
    assert.strictEqual(metrics.misses, 1, 'Il devrait y avoir 1 miss');
    assert.strictEqual(metrics.hitRate, 50, 'Le hit rate devrait être à 50%');
    
    console.log('✅ Test 2 réussi: Deuxième appel avec cache hit');
  });

  // Test 3: Prompts similaires mais différents
  await test('Prompts similaires mais différents', async () => {
    const mockOpenAI = new MockOpenAIClient();
    const cache = new TestableEnhancedCache();
    const client = new TestableOpenAIClientWithCache(mockOpenAI, cache);
    
    const prompt1 = 'Create a Bitcoin trading bot';
    const prompt2 = 'Create a Bitcoin trading robot'; // Différent
    
    mockOpenAI.setMockResponse(prompt1, { strategy: 'btc_bot' });
    mockOpenAI.setMockResponse(prompt2, { strategy: 'btc_robot' });
    
    await client.generateBotSpec(prompt1);
    await client.generateBotSpec(prompt2);
    
    assert.strictEqual(mockOpenAI.getCallCount(), 2, 'Les deux prompts devraient déclencher des appels OpenAI');
    assert.strictEqual(cache.size(), 2, 'Le cache devrait contenir 2 entrées distinctes');
    
    console.log('✅ Test 3 réussi: Prompts similaires mais différents');
  });

  // Test 4: Différents modèles
  await test('Différents modèles', async () => {
    const mockOpenAI = new MockOpenAIClient();
    const cache = new TestableEnhancedCache();
    
    // Créer deux clients avec des modèles différents
    const client1 = new TestableOpenAIClientWithCache(mockOpenAI, cache);
    
    // Pour simuler un modèle différent, nous modifierons temporairement le client
    const originalGenerateBotSpec = client1.generateBotSpec;
    const client2 = {
      generateBotSpec: async function(prompt) {
        const model = 'gpt-3.5-turbo'; // Modèle différent
        const requestParams = { response_format: { type: 'json_object' } };
        
        const cachedResult = cache.get(prompt, model, requestParams);
        if (cachedResult) {
          return cachedResult;
        }
        
        // Simulation d'appel avec modèle différent
        const result = {
          name: 'ai-generated-bot',
          strategy: 'gpt35_strategy',
          description: 'Bot from GPT-3.5',
          aiConfig: {
            prompt,
            source: 'openai',
            model: 'gpt-3.5-turbo',
            generatedAt: new Date().toISOString(),
          },
        };
        
        cache.set(prompt, result, model, requestParams, 1000 * 60 * 120);
        return result;
      }
    };
    
    const prompt = 'Create a trading bot';
    
    // Appel avec gpt-4
    await client1.generateBotSpec(prompt);
    
    // Appel avec gpt-3.5 (même prompt)
    await client2.generateBotSpec(prompt);
    
    assert.strictEqual(cache.size(), 2, 'Le cache devrait contenir 2 entrées (une par modèle)');
    
    console.log('✅ Test 4 réussi: Différents modèles');
  });

  // Test 5: Gestion des erreurs et fallback
  await test('Gestion des erreurs et fallback', async () => {
    const mockOpenAI = new MockOpenAIClient();
    const cache = new TestableEnhancedCache();
    const client = new TestableOpenAIClientWithCache(mockOpenAI, cache);
    
    // Forcer une erreur
    const originalCreate = mockOpenAI.createCompletion;
    mockOpenAI.createCompletion = async () => {
      throw new Error('API Error');
    };
    
    const prompt = 'Create a bot that will fail';
    const result = await client.generateBotSpec(prompt);
    
    assert.strictEqual(result.name, 'fallback-bot', 'Devrait retourner un bot fallback');
    assert.strictEqual(result.aiConfig.fallback, true, 'Devrait être marqué comme fallback');
    assert.strictEqual(cache.size(), 1, 'Le fallback devrait être mis en cache');
    
    // Restaurer pour les autres tests
    mockOpenAI.createCompletion = originalCreate;
    
    console.log('✅ Test 5 réussi: Gestion des erreurs et fallback');
  });

  // Test 6: Performance avec cache
  await test('Performance avec cache', async () => {
    const mockOpenAI = new MockOpenAIClient();
    const cache = new TestableEnhancedCache();
    const client = new TestableOpenAIClientWithCache(mockOpenAI, cache);
    
    const prompt = 'Performance test prompt';
    mockOpenAI.setMockResponse(prompt, { strategy: 'performance_test' });
    
    // Ajouter une latence simulée pour rendre la mesure plus précise
    const originalCreate = mockOpenAI.createCompletion;
    mockOpenAI.createCompletion = async (params) => {
      await new Promise(resolve => setTimeout(resolve, 10)); // 10ms de latence
      return originalCreate.call(mockOpenAI, params);
    };
    
    // Mesurer le temps sans cache (utiliser performance.now() pour plus de précision)
    const start1 = performance.now();
    await client.generateBotSpec(prompt);
    const timeWithoutCache = performance.now() - start1;
    
    // Mesurer le temps avec cache
    const start2 = performance.now();
    await client.generateBotSpec(prompt);
    const timeWithCache = performance.now() - start2;
    
    console.log(`   📊 Temps sans cache: ${timeWithoutCache.toFixed(2)}ms`);
    console.log(`   📊 Temps avec cache: ${timeWithCache.toFixed(2)}ms`);
    
    if (timeWithoutCache > 0) {
      const improvement = ((timeWithoutCache - timeWithCache) / timeWithoutCache * 100);
      console.log(`   📊 Amélioration: ${improvement.toFixed(1)}%`);
    }
    
    // Test plus flexible - le cache doit juste être plus rapide OU avoir le même temps si très rapide
    assert(timeWithCache <= timeWithoutCache, 'Le cache ne devrait pas être plus lent');
    
    console.log('✅ Test 6 réussi: Performance avec cache');
  });

  console.log('\n🎉 Tous les tests d\'intégration sont passés avec succès !');
}

// Helper pour les tests async
async function test(name, fn) {
  try {
    await fn();
  } catch (error) {
    console.error(`❌ Test échoué: ${name}`);
    console.error(error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Exécuter les tests
if (import.meta.url === `file://${process.argv[1]}`) {
  runIntegrationTests();
}

export { runIntegrationTests };