import { BaseRepository } from '../../src/repositories/base.ts';
import { RecordLinkageRepository } from '../../src/repositories/recordLinkage.ts';

import type { Kysely } from 'kysely';
import type { DB } from '../../src/types/index.d.ts';

describe('RecordLinkageRepository', () => {
  const OriginalRepository: unknown = Object.getPrototypeOf(RecordLinkageRepository);
  let BaseRepositoryMock: unknown;

  beforeEach(() => {
    BaseRepositoryMock = vi.fn();
    Object.setPrototypeOf(RecordLinkageRepository, BaseRepositoryMock as typeof BaseRepository);
  });

  afterEach(() => {
    Object.setPrototypeOf(RecordLinkageRepository, OriginalRepository as typeof BaseRepository);
  });

  it('should extend BaseRepository', () => {
    const repo = new RecordLinkageRepository();
    expect(repo).toBeInstanceOf(BaseRepository);
  });

  it('should call super with correct arguments', () => {
    new RecordLinkageRepository();
    expect(BaseRepositoryMock).toHaveBeenCalledOnce();
    expect(BaseRepositoryMock).toHaveBeenCalledWith(
      'pies.recordLinkage',
      undefined,
      expect.arrayContaining(['record_linkage_forward_unique', 'record_linkage_reverse_unique'])
    );
  });

  it('should call super with db argument if provided', () => {
    const fakeDb = {} as Kysely<DB>;
    new RecordLinkageRepository(fakeDb);
    expect(BaseRepositoryMock).toHaveBeenCalledWith(
      'pies.recordLinkage',
      fakeDb,
      expect.arrayContaining(['record_linkage_forward_unique', 'record_linkage_reverse_unique'])
    );
  });
});
