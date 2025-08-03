import { log } from '@/lib/logger';

const cache = new Map<string, { value: any; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 heure

/**
 * Stocke une valeur dans le cache avec une clé.
 * La fonction est générique pour accepter n'importe quel type de valeur.
 */
export function setCached<T>(key: string, value: T): void {
  log.info('[Cache] Storing value in cache.', { key });
  cache.set(key, { value, timestamp: Date.now() });
}

/**
 * Récupère une valeur du cache. Retourne null si la clé n'est pas trouvée ou si elle a expiré.
 * La fonction est générique pour retourner le bon type.
 */
export function getCached<T>(key:string): T | null {
  const entry = cache.get(key);
  if (!entry) {
    return null;
  }
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    log.info('[Cache] Cache entry expired.', { key });
    cache.delete(key);
    return null;
  }
  log.info('[Cache] Cache hit.', { key });
  return entry.value as T;
}