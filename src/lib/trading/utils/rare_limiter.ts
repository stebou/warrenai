const buckets = new Map<string, number>();
export function allow(key: string, limit: number) {
  const count = buckets.get(key) || 0;
  if (count >= limit) return false;
  buckets.set(key, count + 1);
  return true;
}