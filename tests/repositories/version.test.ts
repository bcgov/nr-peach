import { BaseRepository } from '../../src/repositories/base.ts';
import { VersionRepository } from '../../src/repositories/version.ts';

import type { Kysely } from 'kysely';
import type { DB } from '../../src/types/index.d.ts';

describe('VersionRepository', () => {
  const OriginalRepository: unknown = Object.getPrototypeOf(VersionRepository);
  let BaseRepositoryMock: unknown;

  beforeEach(() => {
    BaseRepositoryMock = vi.fn();
    Object.setPrototypeOf(VersionRepository, BaseRepositoryMock as typeof BaseRepository);
  });

  afterEach(() => {
    Object.setPrototypeOf(VersionRepository, OriginalRepository as typeof BaseRepository);
  });

  it('should extend BaseRepository', () => {
    const repo = new VersionRepository();
    expect(repo).toBeInstanceOf(BaseRepository);
  });

  it('should call super with correct arguments', () => {
    new VersionRepository();
    expect(BaseRepositoryMock).toHaveBeenCalledOnce();
    expect(BaseRepositoryMock).toHaveBeenCalledWith('pies.version', undefined);
  });

  it('should call super with db argument if provided', () => {
    const fakeDb = {} as Kysely<DB>;
    new VersionRepository(fakeDb);
    expect(BaseRepositoryMock).toHaveBeenCalledWith('pies.version', fakeDb);
  });
});
