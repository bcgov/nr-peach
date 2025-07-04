import { db } from '../../src/db/database.ts';
import { BaseRepository } from '../../src/repositories/base.ts';
import { findByThenUpsert, transactionWrapper } from '../../src/services/utils.ts';

import type { Kysely, Transaction } from 'kysely';
import type { Mock } from 'vitest';
import type { DB } from '../../src/types/index.d.ts';

class MockRepository extends BaseRepository<'pies.version'> {
  constructor(db?: Kysely<DB> | Transaction<DB>) {
    super('pies.version', db);
  }

  upsert = vi.fn();
  findBy = vi.fn();
}
const mockData = { id: '0.1.0' };

describe('findByThenUpsert', () => {
  const repo = new MockRepository();

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

describe('transactionWrapper', () => {
  const originalDb = db.transaction.bind(db);
  let mockExecute: Mock;
  let mockSetIsolationLevel: Mock;
  let mockTransaction: Mock;

  beforeEach(() => {
    mockExecute = vi.fn();
    mockSetIsolationLevel = vi.fn().mockReturnValue({ execute: mockExecute });
    mockTransaction = vi.fn().mockReturnValue({ setIsolationLevel: mockSetIsolationLevel });
    db.transaction = mockTransaction;
  });

  afterAll(() => {
    db.transaction = originalDb;
  });

  it('should execute a transaction with the default serializable isolation level', async () => {
    const callback = vi.fn().mockResolvedValue('result');
    mockExecute.mockResolvedValue('result');

    const result = await transactionWrapper(callback);

    expect(mockTransaction).toHaveBeenCalledTimes(1);
    expect(mockSetIsolationLevel).toHaveBeenCalledWith('serializable');
    expect(mockExecute).toHaveBeenCalledWith(callback);
    expect(result).toBe('result');
  });

  it('should execute a transaction with a specified isolation level', async () => {
    const callback = vi.fn().mockResolvedValue('custom');
    mockExecute.mockResolvedValue('custom');

    const result = await transactionWrapper(callback, 'repeatable read');

    expect(mockSetIsolationLevel).toHaveBeenCalledWith('repeatable read');
    expect(result).toBe('custom');
  });

  it('should throw an error if the transaction fails', async () => {
    const callback = vi.fn();
    mockExecute.mockRejectedValue(new Error('fail'));

    await expect(transactionWrapper(callback)).rejects.toThrow('fail');
    expect(mockExecute).toHaveBeenCalledWith(callback);
  });
});
