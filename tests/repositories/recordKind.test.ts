import { BaseRepository } from '../../src/repositories/base.ts';
import { RecordKindRepository } from '../../src/repositories/recordKind.ts';

import type { Kysely } from 'kysely';
import type { DB } from '../../src/types/index.d.ts';

describe('RecordKindRepository', () => {
  const OriginalRepository: unknown = Object.getPrototypeOf(RecordKindRepository);
  let BaseRepositoryMock: unknown;

  beforeEach(() => {
    BaseRepositoryMock = vi.fn();
    Object.setPrototypeOf(RecordKindRepository, BaseRepositoryMock as typeof BaseRepository);
  });

  afterEach(() => {
    Object.setPrototypeOf(RecordKindRepository, OriginalRepository as typeof BaseRepository);
  });

  it('should extend BaseRepository', () => {
    const repo = new RecordKindRepository();
    expect(repo).toBeInstanceOf(BaseRepository);
  });

  it('should call super with correct arguments', () => {
    new RecordKindRepository();
    expect(BaseRepositoryMock).toHaveBeenCalledOnce();
    expect(BaseRepositoryMock).toHaveBeenCalledWith(
      'pies.recordKind',
      undefined,
      expect.arrayContaining(['record_kind_version_id_kind_unique'])
    );
  });

  it('should call super with db argument if provided', () => {
    const fakeDb = {} as Kysely<DB>;
    new RecordKindRepository(fakeDb);
    expect(BaseRepositoryMock).toHaveBeenCalledWith(
      'pies.recordKind',
      fakeDb,
      expect.arrayContaining(['record_kind_version_id_kind_unique'])
    );
  });
});
