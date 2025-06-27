import { LRUCache } from 'lru-cache';
import { createHash } from 'node:crypto';

import { findByThenUpsert } from './utils.ts';
import { BaseRepository } from '../repositories/index.ts';
import { getLogger, sortObject } from '../utils/index.ts';

import type { FilterObject, InsertObject, OperandValueExpression, Selectable, Simplify } from 'kysely';
import type { DB } from '../types/index.d.ts';

const log = getLogger(import.meta.filename);

// Create an LRU cache instance with a maximum size of 100 items and a TTL of 5 minutes
// Any value type is used here because it allows for proper type propagation in the cache.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const lruCache = new LRUCache<string, any>({ max: 100, ttl: 1000 * 60 * 5 });

/**
 * Performs a read operation to retrieve a single row by primary key and optionally cache the result.
 * @template TB - The table name type, which is a key of the database schema `DB`.
 * @template ID - Primary-key type (`number` or `string`).
 * @param repo - The repository instance where the read operation will be performed.
 * @param id - Primary-key value to read.
 * @param cacheEnabled - A boolean flag indicating whether caching optimization is enabled for this operation.
 * Defaults to `true`.
 * @returns A promise that resolves to the selectable result of the read operation.
 */
export async function cacheableRead<TB extends keyof DB, ID extends OperandValueExpression<DB, TB, DB[TB]>>(
  repo: BaseRepository<TB>,
  id: ID,
  cacheEnabled = true
): Promise<Simplify<Selectable<DB[TB]>>> {
  const reader = (pk: ID) => repo.read(pk).executeTakeFirstOrThrow();
  if (!cacheEnabled) return await reader(id);

  const hash = createHash('sha256').update(JSON.stringify(id)).digest('hex');
  return cacheWrapper(`${repo.tableName}:${hash}`, reader, id);
}

/**
 * Performs an upsert operation on the specified repository and optionally caches the result.
 * @template TB - The table name type, which is a key of the database schema `DB`.
 * @param repo - The repository instance where the upsert operation will be performed.
 * @param data - The data object containing both filter and insert properties for the upsert operation.
 * @param cacheEnabled - A boolean flag indicating whether caching optimization is enabled for this operation.
 * Defaults to `true`.
 * @returns A promise that resolves to the selectable result of the upsert operation.
 */
export function cacheableUpsert<TB extends keyof DB>(
  repo: BaseRepository<TB>,
  data: FilterObject<DB, TB> & InsertObject<DB, TB>,
  cacheEnabled = true
): Promise<Selectable<DB[TB]>> {
  if (!cacheEnabled) return findByThenUpsert(repo, data);

  const sortedData = sortObject(data);
  const hash = createHash('sha256').update(JSON.stringify(sortedData)).digest('hex');
  return cacheWrapper(`${repo.tableName}:${hash}`, findByThenUpsert, repo, data);
}

/**
 * Wraps an asynchronous function with caching logic.
 * Returns the cached result if available, otherwise executes the function,
 * caches its result, and returns it. Removes the cache entry if the function throws an error.
 * @template T - The return type of the function.
 * @param cacheKey - Unique cache key in the format `${keyof DB}:${string}`.
 * @param callback - The asynchronous callback function to execute if the cache miss occurs.
 * @param args - The arguments to pass to the callback function.
 * @returns A promise that resolves to the cached or freshly computed result.
 * @throws Propagates errors after clearing the cache entry.
 */
export async function cacheWrapper<T extends object, A extends unknown[]>(
  cacheKey: `${keyof DB}:${string}`,
  callback: (...args: A) => Promise<T>,
  ...args: A
): Promise<T> {
  const cachedValue = lruCache.get(cacheKey) as T | undefined;
  if (cachedValue) {
    log.debug(`Cache hit for key: ${cacheKey}`);
    return cachedValue;
  }

  try {
    log.debug(`Cache miss for key: ${cacheKey}`);

    const result = await callback(...args);
    lruCache.set(cacheKey, result);
    return result;
  } catch (error) {
    lruCache.delete(cacheKey);
    throw error;
  }
}
