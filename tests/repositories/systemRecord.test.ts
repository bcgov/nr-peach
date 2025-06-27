import { BaseRepository } from '../../src/repositories/base.ts';
import { SystemRecordRepository } from '../../src/repositories/systemRecord.ts';

import type { Kysely } from 'kysely';
import type { DB } from '../../src/types/index.d.ts';

describe('SystemRecordRepository', () => {
  const OriginalRepository: unknown = Object.getPrototypeOf(SystemRecordRepository);
  let BaseRepositoryMock: unknown;

  beforeEach(() => {
    BaseRepositoryMock = vi.fn();
    Object.setPrototypeOf(SystemRecordRepository, BaseRepositoryMock as typeof BaseRepository);
  });

  afterEach(() => {
    Object.setPrototypeOf(SystemRecordRepository, OriginalRepository as typeof BaseRepository);
  });

  it('should extend BaseRepository', () => {
    const repo = new SystemRecordRepository();
    expect(repo).toBeInstanceOf(BaseRepository);
  });

  it('should call super with correct arguments', () => {
    new SystemRecordRepository();
    expect(BaseRepositoryMock).toHaveBeenCalledOnce();
    expect(BaseRepositoryMock).toHaveBeenCalledWith(
      'pies.systemRecord',
      undefined,
      expect.arrayContaining(['system_record_system_id_record_id_unique'])
    );
  });

  it('should call super with db argument if provided', () => {
    const fakeDb = {} as Kysely<DB>;
    new SystemRecordRepository(fakeDb);
    expect(BaseRepositoryMock).toHaveBeenCalledWith(
      'pies.systemRecord',
      fakeDb,
      expect.arrayContaining(['system_record_system_id_record_id_unique'])
    );
  });
});
