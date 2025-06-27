import { BaseRepository } from '../../src/repositories/base.ts';
import { SystemRepository } from '../../src/repositories/system.ts';

import type { Kysely } from 'kysely';
import type { DB } from '../../src/types/index.d.ts';

describe('SystemRepository', () => {
  const OriginalRepository: unknown = Object.getPrototypeOf(SystemRepository);
  let BaseRepositoryMock: unknown;

  beforeEach(() => {
    BaseRepositoryMock = vi.fn();
    Object.setPrototypeOf(SystemRepository, BaseRepositoryMock as typeof BaseRepository);
  });

  afterEach(() => {
    Object.setPrototypeOf(SystemRepository, OriginalRepository as typeof BaseRepository);
  });

  it('should extend BaseRepository', () => {
    const repo = new SystemRepository();
    expect(repo).toBeInstanceOf(BaseRepository);
  });

  it('should call super with correct arguments', () => {
    new SystemRepository();
    expect(BaseRepositoryMock).toHaveBeenCalledOnce();
    expect(BaseRepositoryMock).toHaveBeenCalledWith('pies.system', undefined);
  });

  it('should call super with db argument if provided', () => {
    const fakeDb = {} as Kysely<DB>;
    new SystemRepository(fakeDb);
    expect(BaseRepositoryMock).toHaveBeenCalledWith('pies.system', fakeDb);
  });
});
