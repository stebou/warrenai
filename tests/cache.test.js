// tests/cache.test.js
import { strict as assert } from 'assert';
import { createHash } from 'crypto';

// Import du cache (nous devrons créer une version testable)
class TestableEnhancedCache {
  constructor(config = {}) {
    this.cache = new Map();
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0,
      totalEntries: 0
    };
    
    this.config = {
      defaultTtlMs: 1000 * 60 * 30, // 30 minutes
      maxEntries: 1000,
      cleanupIntervalMs: 1000 * 60 * 5, // 5 minutes
      enableDebugLogs: false,
      ...config
    };
  }

  generatePromptHash(prompt, model, params) {
    const normalizedPrompt = prompt.trim().toLowerCase();
    const hashInput = JSON.stringify({
      prompt: normalizedPrompt,
      model: model || 'default',
      params: params || {}
    });
    return createHash('sha256').update(hashInput).digest('hex').substring(0, 16);
  }

  generateCacheKey(promptHash, model) {
    return `prompt_${promptHash}_${model || 'default'}`;
  }

  get(prompt, model, params) {
    const promptHash = this.generatePromptHash(prompt, model, params);
    const cacheKey = this.generateCacheKey(promptHash, model);
    
    const entry = this.cache.get(cacheKey);
    
    if (!entry) {
      this.metrics.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(cacheKey);
      this.metrics.misses++;
      this.metrics.evictions++;
      return null;
    }

    entry.hits++;
    this.metrics.hits++;
    return entry.value;
  }

  set(prompt, value, model, params, customTtlMs) {
    const promptHash = this.generatePromptHash(prompt, model, params);
    const cacheKey = this.generateCacheKey(promptHash, model);
    const ttl = customTtlMs || this.config.defaultTtlMs;
    
    const entry = {
      value,
      createdAt: Date.now(),
      expiresAt: Date.now() + ttl,
      hits: 0,
      promptHash,
    };

    this.cache.set(cacheKey, entry);
    this.metrics.sets++;
    this.metrics.totalEntries = this.cache.size;
  }

  getMetrics() {
    const total = this.metrics.hits + this.metrics.misses;
    return {
      ...this.metrics,
      totalEntries: this.cache.size,
      hitRate: total > 0 ? (this.metrics.hits / total) * 100 : 0
    };
  }

  clear() {
    this.cache.clear();
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0,
      totalEntries: 0
    };
  }

  size() {
    return this.cache.size;
  }
}

// Tests
function runTests() {
  console.log('🧪 Début des tests du cache...\n');

  // Test 1: Cache miss initial
  test('Cache miss initial', () => {
    const cache = new TestableEnhancedCache();
    const result = cache.get('test prompt', 'gpt-4');
    
    assert.strictEqual(result, null, 'Le cache devrait retourner null pour un prompt non existant');
    
    const metrics = cache.getMetrics();
    assert.strictEqual(metrics.misses, 1, 'Le compteur de misses devrait être à 1');
    assert.strictEqual(metrics.hits, 0, 'Le compteur de hits devrait être à 0');
    assert.strictEqual(metrics.hitRate, 0, 'Le hit rate devrait être à 0%');
    
    console.log('✅ Test 1 réussi: Cache miss initial');
  });

  // Test 2: Cache set et hit
  test('Cache set et hit', () => {
    const cache = new TestableEnhancedCache();
    const prompt = 'Create a trading bot for BTC';
    const value = { name: 'BTC Bot', strategy: 'trend_following' };
    
    // Set
    cache.set(prompt, value, 'gpt-4');
    assert.strictEqual(cache.size(), 1, 'Le cache devrait contenir 1 entrée');
    
    // Get (hit)
    const result = cache.get(prompt, 'gpt-4');
    assert.deepStrictEqual(result, value, 'Le cache devrait retourner la valeur stockée');
    
    const metrics = cache.getMetrics();
    assert.strictEqual(metrics.hits, 1, 'Le compteur de hits devrait être à 1');
    assert.strictEqual(metrics.sets, 1, 'Le compteur de sets devrait être à 1');
    assert.strictEqual(metrics.hitRate, 100, 'Le hit rate devrait être à 100%');
    
    console.log('✅ Test 2 réussi: Cache set et hit');
  });

  // Test 3: Hash consistency
  test('Hash consistency pour prompts identiques', () => {
    const cache = new TestableEnhancedCache();
    
    const hash1 = cache.generatePromptHash('Create a bot', 'gpt-4', {});
    const hash2 = cache.generatePromptHash('Create a bot', 'gpt-4', {});
    const hash3 = cache.generatePromptHash('  CREATE A BOT  ', 'gpt-4', {}); // Différente casse et espaces
    
    assert.strictEqual(hash1, hash2, 'Les hash identiques devraient être égaux');
    assert.strictEqual(hash1, hash3, 'Les hash normalisés devraient être égaux');
    
    console.log('✅ Test 3 réussi: Hash consistency');
  });

  // Test 4: Hash différence pour prompts différents
  test('Hash différence pour prompts/modèles différents', () => {
    const cache = new TestableEnhancedCache();
    
    const hash1 = cache.generatePromptHash('Create a bot', 'gpt-4', {});
    const hash2 = cache.generatePromptHash('Create a robot', 'gpt-4', {});
    const hash3 = cache.generatePromptHash('Create a bot', 'gpt-3.5', {});
    
    assert.notStrictEqual(hash1, hash2, 'Les prompts différents devraient avoir des hash différents');
    assert.notStrictEqual(hash1, hash3, 'Les modèles différents devraient avoir des hash différents');
    
    console.log('✅ Test 4 réussi: Hash différence');
  });

  // Test 5: TTL et expiration
  test('TTL et expiration', async () => {
    const cache = new TestableEnhancedCache();
    const prompt = 'Test expiration';
    const value = { test: true };
    
    // Set avec TTL court (100ms)
    cache.set(prompt, value, 'gpt-4', {}, 100);
    
    // Get immédiat (devrait fonctionner)
    let result = cache.get(prompt, 'gpt-4');
    assert.deepStrictEqual(result, value, 'Le cache devrait retourner la valeur avant expiration');
    
    // Attendre expiration
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Get après expiration (devrait être null)
    result = cache.get(prompt, 'gpt-4');
    assert.strictEqual(result, null, 'Le cache devrait retourner null après expiration');
    
    const metrics = cache.getMetrics();
    assert.strictEqual(metrics.evictions, 1, 'Le compteur d\'évictions devrait être à 1');
    
    console.log('✅ Test 5 réussi: TTL et expiration');
  });

  // Test 6: Métriques complètes
  test('Métriques complètes', () => {
    const cache = new TestableEnhancedCache();
    
    // Scénario complexe
    cache.set('prompt1', 'value1', 'gpt-4');        // +1 set
    cache.set('prompt2', 'value2', 'gpt-4');        // +1 set
    
    cache.get('prompt1', 'gpt-4');                  // +1 hit
    cache.get('prompt1', 'gpt-4');                  // +1 hit (2 total)
    cache.get('prompt3', 'gpt-4');                  // +1 miss
    cache.get('prompt2', 'gpt-4');                  // +1 hit
    
    const metrics = cache.getMetrics();
    
    assert.strictEqual(metrics.sets, 2, 'Sets devrait être à 2');
    assert.strictEqual(metrics.hits, 3, 'Hits devrait être à 3');
    assert.strictEqual(metrics.misses, 1, 'Misses devrait être à 1');
    assert.strictEqual(metrics.totalEntries, 2, 'Total entries devrait être à 2');
    assert.strictEqual(metrics.hitRate, 75, 'Hit rate devrait être à 75%');
    
    console.log('✅ Test 6 réussi: Métriques complètes');
  });

  // Test 7: Clear cache
  test('Clear cache', () => {
    const cache = new TestableEnhancedCache();
    
    cache.set('prompt1', 'value1', 'gpt-4');
    cache.get('prompt1', 'gpt-4');
    
    assert.strictEqual(cache.size(), 1, 'Le cache devrait contenir 1 entrée');
    
    cache.clear();
    
    assert.strictEqual(cache.size(), 0, 'Le cache devrait être vide après clear');
    
    const metrics = cache.getMetrics();
    assert.strictEqual(metrics.hits, 0, 'Les métriques devraient être remises à zéro');
    assert.strictEqual(metrics.sets, 0, 'Les métriques devraient être remises à zéro');
    
    console.log('✅ Test 7 réussi: Clear cache');
  });

  console.log('\n🎉 Tous les tests sont passés avec succès !');
}

// Helper pour les tests
function test(name, fn) {
  try {
    fn();
  } catch (error) {
    console.error(`❌ Test échoué: ${name}`);
    console.error(error.message);
    process.exit(1);
  }
}

// Fonction pour simuler un délai
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Exécuter les tests
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export { TestableEnhancedCache, runTests };