import { BaseRepository } from '../../src/repositories/base.ts';
import { findByThenUpsert } from '../../src/services/utils.ts';

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

describe('findByThenUpsert', () => {
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
