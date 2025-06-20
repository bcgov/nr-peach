import { createHash } from 'node:crypto';

import { BaseRepository } from '../../src/repositories/base.ts';
import { cacheableUpsert, cacheWrapper, findByThenUpsert, lruCache } from '../../src/services/utils.ts';

import type { Kysely, Transaction } from 'kysely';
import type { DB } from '../../src/types/index.d.ts';

// Mocks
class MockRepo extends BaseRepository<'pies.version'> {
  constructor(db?: Kysely<DB> | Transaction<DB>) {
    super('pies.version', db);
  }

  upsert = vi.fn();
  findBy = vi.fn();
}
const mockData = { id: '0.1.0' };

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

describe('findThenUpsert', () => {
  let repo: MockRepo;

  beforeEach(() => {
    repo = new MockRepo();
  });

  it('returns the found row if find returns a row', async () => {
    const upsertResult = { ...mockData, updated: true };
    repo.findBy.mockReturnValue({
      executeTakeFirst: vi.fn().mockResolvedValue(upsertResult)
    });

    // find should not be called
    repo.upsert.mockReturnValue({
      executeTakeFirstOrThrow: vi.fn()
    });

    const result = await findByThenUpsert(repo, mockData);
    expect(result).toEqual(upsertResult);
    expect(repo.findBy).toHaveBeenCalledWith(mockData);
    expect(repo.upsert).not.toHaveBeenCalled();
  });

  it('calls upsert and returns the found row if find returns undefined', async () => {
    repo.findBy.mockReturnValue({
      executeTakeFirst: vi.fn().mockResolvedValue(undefined)
    });

    const foundRow = { ...mockData, found: true };
    repo.upsert.mockReturnValue({
      executeTakeFirstOrThrow: vi.fn().mockResolvedValue(foundRow)
    });

    const result = await findByThenUpsert(repo, mockData);
    expect(result).toEqual(foundRow);
    expect(repo.findBy).toHaveBeenCalledWith(mockData);
    expect(repo.upsert).toHaveBeenCalledWith(mockData);
  });

  it('throws if both upsert and find fail', async () => {
    repo.findBy.mockReturnValue({
      executeTakeFirst: vi.fn().mockResolvedValue(undefined)
    });

    repo.upsert.mockReturnValue({
      executeTakeFirstOrThrow: vi.fn().mockRejectedValue(new Error('Not found'))
    });

    await expect(findByThenUpsert(repo, mockData)).rejects.toThrow('Not found');
    expect(repo.findBy).toHaveBeenCalledWith(mockData);
    expect(repo.upsert).toHaveBeenCalledWith(mockData);
  });
});

describe('returnableUpsert', () => {
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
