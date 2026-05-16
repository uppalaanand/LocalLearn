import NodeCache from 'node-cache';

/**
 * In-memory cache manager using node-cache
 * Falls back gracefully when Redis is not available
 */
class CacheManager {
  constructor() {
    this.cache = new NodeCache({
      stdTTL: 300, // Default TTL: 5 minutes
      checkperiod: 60, // Check for expired keys every 60 seconds
      useClones: true,
    });

    console.log('✅ In-memory cache initialized');
  }

  /**
   * Get cached value by key
   */
  get(key) {
    return this.cache.get(key);
  }

  /**
   * Set cache value with optional TTL
   * @param {string} key
   * @param {any} value
   * @param {number} ttl - Time to live in seconds (default 300 = 5 min)
   */
  set(key, value, ttl = 300) {
    return this.cache.set(key, value, ttl);
  }

  /**
   * Delete a cached key
   */
  del(key) {
    return this.cache.del(key);
  }

  /**
   * Delete multiple keys matching a pattern prefix
   */
  delByPrefix(prefix) {
    const keys = this.cache.keys().filter((k) => k.startsWith(prefix));
    if (keys.length > 0) {
      this.cache.del(keys);
    }
    return keys.length;
  }

  /**
   * Flush all cached data
   */
  flush() {
    this.cache.flushAll();
  }

  /**
   * Get cache stats
   */
  stats() {
    return this.cache.getStats();
  }
}

// Singleton instance
const cacheManager = new CacheManager();
export default cacheManager;
