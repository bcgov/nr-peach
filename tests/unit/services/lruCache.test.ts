import { createHash } from 'node:crypto';

import { BaseRepository } from '../../../src/repositories/base.ts';
import { cacheableRead, cacheableUpsert, cacheWrapper, lruCache } from '../../../src/services/lruCache.ts';

import type { Kysely, Transaction } from 'kysely';
import type { DB } from '../../../src/types/index.js';

// Mocks
class MockRepo extends BaseRepository<'pies.version'> {
  constructor(db?: Kysely<DB> | Transaction<DB>) {
    super('pies.version', db);
  }

  findBy = vi.fn();
  read = vi.fn();
  upsert = vi.fn();
}
const mockData = { id: '0.1.0' };

describe('cacheableRead', () => {
  let repo: MockRepo;

  beforeEach(() => {
    repo = new MockRepo();
    lruCache.clear();
  });

  it('performs a read operation without caching when cache is disabled', async () => {
    const readResult = { id: '1.0.0' };
    repo.read.mockReturnValue({
      executeTakeFirstOrThrow: vi.fn().mockResolvedValue(readResult)
    });

    const result = await cacheableRead(repo, '1.0.0', false);
    expect(result).toEqual(readResult);
    expect(repo.read).toHaveBeenCalledWith('1.0.0');
    expect(lruCache.has('pies.version:1.0.0')).toBe(false);
  });

  it('caches the result when cache is enabled', async () => {
    const readResult = { id: '2.0.0' };
    repo.read.mockReturnValue({
      executeTakeFirstOrThrow: vi.fn().mockResolvedValue(readResult)
    });

    const result = await cacheableRead(repo, '2.0.0', true);
    expect(result).toEqual(readResult);
    expect(repo.read).toHaveBeenCalledWith('2.0.0');

    const cacheKey = `pies.version:${createHash('sha256').update(JSON.stringify('2.0.0')).digest('hex')}`;
    expect(lruCache.get(cacheKey)).toEqual(readResult);
  });

  it('returns cached result if available', async () => {
    const cachedResult = { id: '3.0.0' };
    const cacheKey = `pies.version:${createHash('sha256').update(JSON.stringify('3.0.0')).digest('hex')}`;
    lruCache.set(cacheKey, cachedResult);

    const result = await cacheableRead(repo, '3.0.0', true);
    expect(result).toEqual(cachedResult);
    expect(repo.read).not.toHaveBeenCalled();
  });
});

describe('cacheableUpsert', () => {
  let repo: MockRepo;

  beforeEach(() => {
    repo = new MockRepo();
  });

  it('calls findThenUpsert when cache is disabled', async () => {
    const upsertResult = { ...mockData, updated: true };
    repo.findBy.mockReturnValue({
      executeTakeFirst: vi.fn().mockResolvedValue(upsertResult)
    });

    // find should not be called
    repo.upsert.mockReturnValue({
      executeTakeFirstOrThrow: vi.fn()
    });

    const result = await cacheableUpsert(repo, mockData, false);
    expect(result).toEqual(upsertResult);
    expect(repo.findBy).toHaveBeenCalledWith(mockData);
    expect(repo.upsert).not.toHaveBeenCalled();
  });

  it('caches the result when cache is enabled', async () => {
    const upsertResult = { ...mockData, cached: true };
    repo.findBy.mockReturnValue({
      executeTakeFirst: vi.fn().mockResolvedValue(undefined)
    });
    repo.upsert.mockReturnValue({
      executeTakeFirstOrThrow: vi.fn().mockResolvedValue(upsertResult)
    });

    const result = await cacheableUpsert(repo, mockData, true);
    expect(result).toEqual(upsertResult);
    expect(repo.findBy).toHaveBeenCalledWith(mockData);
    expect(repo.upsert).toHaveBeenCalledWith(mockData);

    // Check cache
    const cacheKey = `pies.version:${createHash('sha256').update(JSON.stringify(mockData)).digest('hex')}`;
    expect(lruCache.get(cacheKey)).toEqual(upsertResult);
  });
});

describe('cacheWrapper', () => {
  const cacheKey = 'pies.version:key';
  const mockCallback = vi.fn();

  beforeEach(() => {
    lruCache.clear();
  });

  it('returns cached result if available', async () => {
    const cachedResult = { id: 1, name: 'cached' };
    lruCache.set(cacheKey, cachedResult);

    const result = await cacheWrapper(cacheKey, mockCallback);

    expect(result).toEqual(cachedResult);
    expect(mockCallback).not.toHaveBeenCalled();
  });

  it('executes callback and caches result on cache miss', async () => {
    const callbackResult = { id: 2, name: 'new' };
    mockCallback.mockResolvedValue(callbackResult);

    const result = await cacheWrapper(cacheKey, mockCallback);

    expect(result).toEqual(callbackResult);
    expect(mockCallback).toHaveBeenCalled();
    expect(lruCache.get(cacheKey)).toEqual(callbackResult);
  });

  it('removes cache entry if callback throws an error', async () => {
    mockCallback.mockRejectedValue(new Error('Callback error'));

    await expect(cacheWrapper(cacheKey, mockCallback)).rejects.toThrow('Callback error');
    expect(lruCache.has(cacheKey)).toBe(false);
  });

  it('supports passing arguments to the callback', async () => {
    const callbackResult = { id: 3, name: 'with args' };
    mockCallback.mockResolvedValue(callbackResult);

    const result = await cacheWrapper(cacheKey, mockCallback, 'arg1', 'arg2');

    expect(result).toEqual(callbackResult);
    expect(mockCallback).toHaveBeenCalledWith('arg1', 'arg2');
  });
});
