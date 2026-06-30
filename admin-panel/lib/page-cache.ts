/**
 * Simple in-memory page data cache.
 * Persists data across client-side navigations so pages
 * can show cached content instantly instead of a skeleton loader.
 * Data is refreshed in the background after mount.
 */

const cache = new Map<string, unknown>();

export function getCache<T>(key: string): T | undefined {
  return cache.get(key) as T | undefined;
}

export function setCache<T>(key: string, data: T): void {
  cache.set(key, data);
}

export function clearCache(prefix?: string): void {
  if (prefix) {
    for (const key of cache.keys()) {
      if (key.startsWith(prefix)) cache.delete(key);
    }
  } else {
    cache.clear();
  }
}
