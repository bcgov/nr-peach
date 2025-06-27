import { BaseRepository } from '../../src/repositories/base.ts';
import { ProcessEventRepository } from '../../src/repositories/processEvent.ts';

import type { Kysely } from 'kysely';
import type { DB } from '../../src/types/index.d.ts';

describe('ProcessEventRepository', () => {
  const OriginalRepository: unknown = Object.getPrototypeOf(ProcessEventRepository);
  let BaseRepositoryMock: unknown;

  beforeEach(() => {
    BaseRepositoryMock = vi.fn();
    Object.setPrototypeOf(ProcessEventRepository, BaseRepositoryMock as typeof BaseRepository);
  });

  afterEach(() => {
    Object.setPrototypeOf(ProcessEventRepository, OriginalRepository as typeof BaseRepository);
  });

  it('should extend BaseRepository', () => {
    const repo = new ProcessEventRepository();
    expect(repo).toBeInstanceOf(BaseRepository);
  });

  it('should call super with correct arguments', () => {
    new ProcessEventRepository();
    expect(BaseRepositoryMock).toHaveBeenCalledOnce();
    expect(BaseRepositoryMock).toHaveBeenCalledWith('pies.processEvent', undefined);
  });

  it('should call super with db argument if provided', () => {
    const fakeDb = {} as Kysely<DB>;
    new ProcessEventRepository(fakeDb);
    expect(BaseRepositoryMock).toHaveBeenCalledWith('pies.processEvent', fakeDb);
  });
});
