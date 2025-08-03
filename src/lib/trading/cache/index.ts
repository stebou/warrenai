type CacheEntry = {
  value: any;
  expiresAt: number; // timestamp ms
};

const CACHE: Map<string, CacheEntry> = new Map();

const DEFAULT_TTL_MS = 1000 * 60 * 5; // 5 minutes

export function getCached(key: string): any | undefined {
  const entry = CACHE.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    CACHE.delete(key);
    return undefined;
  }
  return entry.value;
}

export function setCached(key: string, value: any, ttl: number = DEFAULT_TTL_MS) {
  CACHE.set(key, {
    value,
    expiresAt: Date.now() + ttl,
  });
}

export function clearCache() {
  CACHE.clear();
}