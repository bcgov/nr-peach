import { LRUCache } from 'lru-cache';
import { createHash } from 'node:crypto';

import { BaseRepository } from '../repositories/index.ts';
import { getLogger } from '../utils/index.ts';

import type { FilterObject, InsertObject, Selectable } from 'kysely';
import type { DB } from '../types/index.ts';

const log = getLogger(import.meta.filename);

// Create an LRU cache instance with a maximum size of 100 items and a TTL of 5 minutes
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cache = new LRUCache<string, any>({ max: 100, ttl: 1000 * 60 * 5 });

/**
 * Wraps an asynchronous function with caching logic.
 * Returns the cached result if available, otherwise executes the function,
 * caches its result, and returns it. Removes the cache entry if the function throws an error.
 * @template T - The return type of the function.
 * @param cacheKey - Unique cache key in the format `${keyof DB}:${string}`.
 * @param fn - The asynchronous function to execute and cache.
 * @returns The cached or freshly computed result.
 * @throws Propagates errors after clearing the cache entry.
 */
export async function cacheWrapper<T>(cacheKey: `${keyof DB}:${string}`, fn: () => Promise<T>): Promise<T> {
  if (cache.has(cacheKey)) {
    log.debug(`Cache hit for key: ${cacheKey}`);
    return Promise.resolve(cache.get(cacheKey) as T);
  }

  try {
    log.debug(`Cache miss for key: ${cacheKey}`);

    const result = await fn();
    cache.set(cacheKey, result);
    return result;
  } catch (error) {
    cache.delete(cacheKey);
    throw error;
  }
}

/**
 * Performs an upsert (insert or update) operation on the specified repository.
 * If the upsert operation does not return a row, retrieves the row by its ID.
 * Uses an LRU cache to store and retrieve values for performance optimization.
 * @template TB - The table name, constrained to keys of the database schema `DB`.
 * @param repo - The repository instance for the target table.
 * @param data - The data object to insert or update.
 * @returns A promise that resolves to the upserted or retrieved row.
 */
export async function returnableUpsert<TB extends keyof DB>(
  repo: BaseRepository<TB>,
  data: FilterObject<DB, TB> & InsertObject<DB, TB>
): Promise<Selectable<DB[TB]>> {
  const hash = createHash('sha256').update(JSON.stringify(data)).digest('hex');
  return cacheWrapper(`${repo.tableName}:${hash}`, async () => {
    const findRow = await repo.find(data).executeTakeFirst();
    return findRow ?? (await repo.upsert(data).executeTakeFirstOrThrow());
  });
}
