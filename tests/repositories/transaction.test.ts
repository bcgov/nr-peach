import { BaseRepository } from '../../src/repositories/base.ts';
import { TransactionRepository } from '../../src/repositories/transaction.ts';

import type { Kysely } from 'kysely';
import type { DB } from '../../src/types/index.d.ts';

describe('TransactionRepository', () => {
  const OriginalRepository: unknown = Object.getPrototypeOf(TransactionRepository);
  let BaseRepositoryMock: unknown;

  beforeEach(() => {
    BaseRepositoryMock = vi.fn();
    Object.setPrototypeOf(TransactionRepository, BaseRepositoryMock as typeof BaseRepository);
  });

  afterEach(() => {
    Object.setPrototypeOf(TransactionRepository, OriginalRepository as typeof BaseRepository);
  });

  it('should extend BaseRepository', () => {
    const repo = new TransactionRepository();
    expect(repo).toBeInstanceOf(BaseRepository);
  });

  it('should call super with correct arguments', () => {
    new TransactionRepository();
    expect(BaseRepositoryMock).toHaveBeenCalledOnce();
    expect(BaseRepositoryMock).toHaveBeenCalledWith('pies.transaction', undefined);
  });

  it('should call super with db argument if provided', () => {
    const fakeDb = {} as Kysely<DB>;
    new TransactionRepository(fakeDb);
    expect(BaseRepositoryMock).toHaveBeenCalledWith('pies.transaction', fakeDb);
  });
});
