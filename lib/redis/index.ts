/**
 * Upstash Redis client for caching
 * Falls back to SQLite cache if Redis is unavailable
 */

import { Redis } from "@upstash/redis";
import { cacheDb } from "../db";

// Initialize Redis client (temporarily disabled)
const redis = null as unknown as Redis | null;

const DEFAULT_TTL = 60 * 60 * 24; // 24 hours in seconds

/**
 * Cache service with Redis primary and SQLite fallback
 */
export const cache = {
  /**
   * Check if Redis is available
   */
  isAvailable(): boolean {
    return redis !== null;
  },

  /**
   * Get cached data
   * @param key - Cache key
   * @returns Cached data or null
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      // Try Redis first
      if (redis) {
        const data = await redis.get<T>(key);
        if (data) {
          console.log(`📦 Redis cache hit: ${key}`);
          return data;
        }
      }

      // Fallback to SQLite
      const sqliteData = cacheDb.get(key) as T | null;
      if (sqliteData) {
        console.log(`💾 SQLite cache hit: ${key}`);
      }
      return sqliteData;
    } catch (error) {
      console.error("Cache get error:", error);
      // Fallback to SQLite on error
      return cacheDb.get(key) as T | null;
    }
  },

  /**
   * Set cached data
   * @param key - Cache key
   * @param data - Data to cache
   * @param ttl - Time to live in seconds (default: 24 hours)
   */
  async set<T>(key: string, data: T, ttl: number = DEFAULT_TTL): Promise<void> {
    try {
      // Try Redis first
      if (redis) {
        await redis.setex(key, ttl, data);
        console.log(`📦 Redis cache set: ${key} (TTL: ${ttl}s)`);
      }

      // Also save to SQLite as fallback
      const ttlHours = Math.ceil(ttl / 3600);
      cacheDb.set(key, data, ttlHours);
    } catch (error) {
      console.error("Cache set error:", error);
      // Fallback to SQLite on error
      const ttlHours = Math.ceil(ttl / 3600);
      cacheDb.set(key, data, ttlHours);
    }
  },

  /**
   * Delete cached data
   * @param key - Cache key
   */
  async delete(key: string): Promise<void> {
    try {
      if (redis) {
        await redis.del(key);
      }
      cacheDb.delete(key);
    } catch (error) {
      console.error("Cache delete error:", error);
      cacheDb.delete(key);
    }
  },

  /**
   * Check if key exists
   * @param key - Cache key
   */
  async exists(key: string): Promise<boolean> {
    try {
      if (redis) {
        const exists = await redis.exists(key);
        return exists === 1;
      }
      return cacheDb.get(key) !== null;
    } catch (error) {
      console.error("Cache exists error:", error);
      return cacheDb.get(key) !== null;
    }
  },

  /**
   * Generate cache key for repository analysis
   * @param owner - Repository owner
   * @param repo - Repository name
   */
  generateRepoKey(owner: string, repo: string): string {
    return `analysis:${owner.toLowerCase()}/${repo.toLowerCase()}`;
  },

  /**
   * Generate cache key for repository context
   * @param owner - Repository owner
   * @param repo - Repository name
   */
  generateContextKey(owner: string, repo: string): string {
    return `context:${owner.toLowerCase()}/${repo.toLowerCase()}`;
  },
};

/**
 * Cache wrapper for expensive operations
 * @param key - Cache key
 * @param operation - Operation to cache
 * @param ttl - Time to live in seconds
 */
export async function withCache<T>(
  key: string,
  operation: () => Promise<T>,
  ttl: number = DEFAULT_TTL
): Promise<T> {
  // Try to get from cache
  const cached = await cache.get<T>(key);
  if (cached) {
    return cached;
  }

  // Execute operation
  const result = await operation();

  // Store in cache
  await cache.set(key, result, ttl);

  return result;
}
