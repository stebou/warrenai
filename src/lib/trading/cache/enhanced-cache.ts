// src/lib/trading/cache/enhanced-cache.ts
import { createHash } from 'crypto';
import { log } from '@/lib/logger';

/**
 * Structure d'une entrée de cache
 */
interface CacheEntry<T> {
  value: T;
  createdAt: number;
  expiresAt: number;
  hits: number;
  promptHash: string;
  originalPrompt?: string; // Pour debugging (optionnel en prod)
}

/**
 * Métriques du cache pour monitoring
 */
interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  evictions: number;
  totalEntries: number;
}

/**
 * Configuration du cache
 */
interface CacheConfig {
  defaultTtlMs: number;
  maxEntries: number;
  cleanupIntervalMs: number;
  enableDebugLogs: boolean;
}

/**
 * Cache amélioré avec hash des prompts et TTL flexible
 */
class EnhancedCache {
  private cache = new Map<string, CacheEntry<any>>();
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    sets: 0,
    evictions: 0,
    totalEntries: 0
  };
  
  private config: CacheConfig = {
    defaultTtlMs: 1000 * 60 * 30, // 30 minutes par défaut
    maxEntries: 1000,
    cleanupIntervalMs: 1000 * 60 * 5, // Nettoyage toutes les 5 minutes
    enableDebugLogs: process.env.NODE_ENV !== 'production'
  };

  private cleanupInterval: NodeJS.Timeout;

  constructor(config?: Partial<CacheConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    
    // Démarrer le nettoyage automatique
    this.startPeriodicCleanup();
  }

  /**
   * Génère un hash SHA-256 du prompt normalisé
   */
  private generatePromptHash(prompt: string, model?: string, params?: Record<string, any>): string {
    // Normaliser le prompt : trim + casse uniforme
    const normalizedPrompt = prompt.trim().toLowerCase();
    
    // Inclure le modèle et paramètres dans le hash pour plus de précision
    const hashInput = JSON.stringify({
      prompt: normalizedPrompt,
      model: model || 'default',
      params: params || {}
    });
    
    return createHash('sha256').update(hashInput).digest('hex').substring(0, 16);
  }

  /**
   * Génère une clé de cache complète
   */
  private generateCacheKey(promptHash: string, model?: string): string {
    return `prompt_${promptHash}_${model || 'default'}`;
  }

  /**
   * Récupère une valeur du cache
   */
  get<T>(prompt: string, model?: string, params?: Record<string, any>): T | null {
    const promptHash = this.generatePromptHash(prompt, model, params);
    const cacheKey = this.generateCacheKey(promptHash, model);
    
    const entry = this.cache.get(cacheKey);
    
    if (!entry) {
      this.metrics.misses++;
      if (this.config.enableDebugLogs) {
        log.info('[CACHE:MISS] Key not found', { 
          cacheKey, 
          promptHash,
          reason: 'not_found'
        });
      }
      return null;
    }

    // Vérifier l'expiration
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(cacheKey);
      this.metrics.misses++;
      this.metrics.evictions++;
      if (this.config.enableDebugLogs) {
        log.info('[CACHE:MISS] Entry expired', { 
          cacheKey, 
          promptHash,
          reason: 'expired',
          age: Date.now() - entry.createdAt
        });
      }
      return null;
    }

    // Cache hit - incrémenter le compteur et logger
    entry.hits++;
    this.metrics.hits++;
    
    if (this.config.enableDebugLogs) {
      log.info('[CACHE:HIT] Retrieved from cache', {
        cacheKey,
        promptHash,
        hits: entry.hits,
        age: Date.now() - entry.createdAt
      });
    }

    return entry.value;
  }

  /**
   * Stocke une valeur dans le cache
   */
  set<T>(
    prompt: string, 
    value: T, 
    model?: string, 
    params?: Record<string, any>,
    customTtlMs?: number
  ): void {
    const promptHash = this.generatePromptHash(prompt, model, params);
    const cacheKey = this.generateCacheKey(promptHash, model);
    const ttl = customTtlMs || this.config.defaultTtlMs;
    
    // Vérifier la limite d'entrées et nettoyer si nécessaire
    if (this.cache.size >= this.config.maxEntries) {
      this.evictOldestEntries(Math.floor(this.config.maxEntries * 0.1)); // Éviction de 10%
    }

    const entry: CacheEntry<T> = {
      value,
      createdAt: Date.now(),
      expiresAt: Date.now() + ttl,
      hits: 0,
      promptHash,
      originalPrompt: this.config.enableDebugLogs ? prompt.substring(0, 100) + '...' : undefined
    };

    this.cache.set(cacheKey, entry);
    this.metrics.sets++;
    this.metrics.totalEntries = this.cache.size;

    if (this.config.enableDebugLogs) {
      log.info('[CACHE:SET] Stored in cache', {
        cacheKey,
        promptHash,
        ttl,
        valueSize: JSON.stringify(value).length,
        totalEntries: this.cache.size
      });
    }
  }

  /**
   * Éviction des entrées les plus anciennes
   */
  private evictOldestEntries(count: number): void {
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.createdAt - b.createdAt)
      .slice(0, count);

    for (const [key] of entries) {
      this.cache.delete(key);
      this.metrics.evictions++;
    }

    if (this.config.enableDebugLogs) {
      log.info('[CACHE:EVICT] Evicted oldest entries', { 
        evicted: count, 
        remaining: this.cache.size 
      });
    }
  }

  /**
   * Nettoyage périodique des entrées expirées
   */
  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleanedCount++;
        this.metrics.evictions++;
      }
    }

    this.metrics.totalEntries = this.cache.size;

    if (cleanedCount > 0 && this.config.enableDebugLogs) {
      log.info('[CACHE:CLEANUP] Cleaned expired entries', { 
        cleaned: cleanedCount, 
        remaining: this.cache.size 
      });
    }
  }

  /**
   * Démarre le nettoyage périodique
   */
  private startPeriodicCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupIntervalMs);
  }

  /**
   * Arrête le nettoyage périodique (pour les tests)
   */
  stopPeriodicCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  /**
   * Obtient les métriques actuelles du cache
   */
  getMetrics(): CacheMetrics & { hitRate: number } {
    const total = this.metrics.hits + this.metrics.misses;
    return {
      ...this.metrics,
      totalEntries: this.cache.size,
      hitRate: total > 0 ? (this.metrics.hits / total) * 100 : 0
    };
  }

  /**
   * Vide complètement le cache
   */
  clear(): void {
    this.cache.clear();
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0,
      totalEntries: 0
    };
    
    if (this.config.enableDebugLogs) {
      log.info('[CACHE:CLEAR] Cache cleared');
    }
  }

  /**
   * Obtient la taille actuelle du cache
   */
  size(): number {
    return this.cache.size;
  }
}

// Instance singleton du cache
export const enhancedCache = new EnhancedCache();

// Export des types pour utilisation externe
export type { CacheConfig, CacheMetrics };