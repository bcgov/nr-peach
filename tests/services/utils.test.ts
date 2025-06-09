import { BaseRepository } from '../../src/repositories/base.ts';
import { returnableUpsert } from '../../src/services/utils.ts';

import type { Kysely, Transaction } from 'kysely';
import type { DB } from '../../src/types/index.ts';

// Mocks
class MockRepo extends BaseRepository<'pies.version'> {
  constructor(db?: Kysely<DB> | Transaction<DB>) {
    super('pies.version', db);
  }

  upsert = vi.fn();
  find = vi.fn();
}
const mockData = { id: '0.1.0' };

// TODO: Fix these tests to work with the refactored implementation with LRU cache
describe.skip('returnableUpsert', () => {
  let repo: MockRepo;

  beforeEach(() => {
    repo = new MockRepo();
  });

  it('returns the upserted row if upsert returns a row', async () => {
    const upsertResult = { ...mockData, updated: true };
    repo.upsert.mockReturnValue({
      executeTakeFirst: vi.fn().mockResolvedValue(upsertResult)
    });

    // find should not be called
    repo.find.mockReturnValue({
      executeTakeFirstOrThrow: vi.fn()
    });

    const result = await returnableUpsert(repo, mockData);
    expect(result).toEqual(upsertResult);
    expect(repo.upsert).toHaveBeenCalledWith(mockData);
    expect(repo.find).not.toHaveBeenCalled();
  });

  it('calls find and returns the found row if upsert returns undefined', async () => {
    repo.upsert.mockReturnValue({
      executeTakeFirst: vi.fn().mockResolvedValue(undefined)
    });

    const foundRow = { ...mockData, found: true };
    repo.find.mockReturnValue({
      executeTakeFirstOrThrow: vi.fn().mockResolvedValue(foundRow)
    });

    const result = await returnableUpsert(repo, mockData);
    expect(result).toEqual(foundRow);
    expect(repo.upsert).toHaveBeenCalledWith(mockData);
    expect(repo.find).toHaveBeenCalledWith(mockData);
  });

  it('throws if both upsert and find fail', async () => {
    repo.upsert.mockReturnValue({
      executeTakeFirst: vi.fn().mockResolvedValue(undefined)
    });

    repo.find.mockReturnValue({
      executeTakeFirstOrThrow: vi.fn().mockRejectedValue(new Error('Not found'))
    });

    await expect(returnableUpsert(repo, mockData)).rejects.toThrow('Not found');
    expect(repo.upsert).toHaveBeenCalledWith(mockData);
    expect(repo.find).toHaveBeenCalledWith(mockData);
  });
});
