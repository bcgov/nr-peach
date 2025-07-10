import { DatabaseError } from 'pg';

import { db } from '../../../../src/db/database.ts';
import { BaseRepository } from '../../../../src/repositories/base.ts';
import { findByThenUpsert, transactionWrapper } from '../../../../src/services/helpers/repository.ts';

import type { Kysely, Transaction } from 'kysely';
import type { Mock } from 'vitest';
import type { DB } from '../../../../src/types/index.js';

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
  let mockExecute: Mock;
  let mockSetAccessMode: Mock;
  let mockSetIsolationLevel: Mock;
  let mockTransaction: Mock;
  let transactionSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockExecute = vi.fn();
    mockSetIsolationLevel = vi.fn().mockReturnValue({ execute: mockExecute });
    mockSetAccessMode = vi.fn().mockReturnValue({ setIsolationLevel: mockSetIsolationLevel });
    mockTransaction = vi.fn().mockReturnValue({ setAccessMode: mockSetAccessMode });
    transactionSpy = vi.spyOn(db, 'transaction').mockImplementation(mockTransaction);
  });

  afterEach(() => {
    transactionSpy.mockRestore();
  });

  it('calls execute with the operation and returns the result with default options', async () => {
    const expected = { foo: 'bar' };
    const op = vi.fn().mockResolvedValue(expected);
    mockExecute.mockImplementation(op);

    const result = await transactionWrapper(op);
    expect(result).toBe(expected);
    expect(mockTransaction).toHaveBeenCalled();
    expect(mockSetAccessMode).toHaveBeenCalledWith('read write');
    expect(mockSetIsolationLevel).toHaveBeenCalledWith('repeatable read');
    expect(mockExecute).toHaveBeenCalledWith(op);
    expect(mockExecute).toHaveBeenCalledTimes(1);
  });

  it('calls execute with the operation and returns the result with options defined', async () => {
    const expected = { foo: 'bar' };
    const op = vi.fn().mockResolvedValue(expected);
    mockExecute.mockImplementation(op);

    const result = await transactionWrapper(op, {
      accessMode: 'read only',
      initialDelay: 200,
      isolationLevel: 'repeatable read',
      maxRetries: 1
    });
    expect(result).toBe(expected);
    expect(mockTransaction).toHaveBeenCalled();
    expect(mockSetAccessMode).toHaveBeenCalledWith('read only');
    expect(mockSetIsolationLevel).toHaveBeenCalledWith('repeatable read');
    expect(mockExecute).toHaveBeenCalledWith(op);
    expect(mockExecute).toHaveBeenCalledTimes(1);
  });

  it('retries on serialization failure and eventually succeeds', async () => {
    const op = vi
      .fn()
      .mockImplementationOnce(() => {
        throw Object.assign(new DatabaseError('serialization', 0, 'error'), { code: '40001' });
      })
      .mockResolvedValue('success');
    mockExecute.mockImplementation(op);

    const result = await transactionWrapper(op, { initialDelay: 1, maxRetries: 2 });
    expect(result).toBe('success');
    expect(mockExecute).toHaveBeenCalledTimes(2);
  });

  it('retries on deadlock detected and eventually succeeds', async () => {
    const op = vi
      .fn()
      .mockImplementationOnce(() => {
        throw Object.assign(new DatabaseError('deadlock', 0, 'error'), { code: '40P01' });
      })
      .mockResolvedValue('ok');
    mockExecute.mockImplementation(op);

    const result = await transactionWrapper(op, { initialDelay: 1, maxRetries: 2 });
    expect(result).toBe('ok');
    expect(mockExecute).toHaveBeenCalledTimes(2);
  });

  it('throws if all retries are exhausted', async () => {
    const op = vi.fn().mockImplementation(() => {
      throw Object.assign(new DatabaseError('serialization', 0, 'error'), { code: '40P01' });
    });
    mockExecute.mockImplementation(op);

    await expect(transactionWrapper(op, { initialDelay: 1, maxRetries: 2 })).rejects.toThrow('serialization');
    expect(mockExecute).toHaveBeenCalledTimes(2);
  });

  it('throws immediately for non-retryable errors', async () => {
    const op = vi.fn().mockImplementation(() => {
      throw new Error('other');
    });
    mockExecute.mockImplementation(op);

    await expect(transactionWrapper(op)).rejects.toThrow('other');
    expect(mockExecute).toHaveBeenCalledTimes(1);
  });
});
