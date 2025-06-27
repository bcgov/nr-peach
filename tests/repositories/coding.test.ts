import { BaseRepository } from '../../src/repositories/base.ts';
import { CodingRepository } from '../../src/repositories/coding.ts';

describe('CodingRepository', () => {
  const OriginalRepository: unknown = Object.getPrototypeOf(CodingRepository);
  let BaseRepositoryMock: unknown;

  beforeEach(() => {
    BaseRepositoryMock = vi.fn();
    Object.setPrototypeOf(CodingRepository, BaseRepositoryMock as typeof BaseRepository);
  });

  afterEach(() => {
    Object.setPrototypeOf(CodingRepository, OriginalRepository as typeof BaseRepository);
  });

  it('should extend BaseRepository and call super with correct arguments', () => {
    const repo = new CodingRepository();
    expect(repo).toBeInstanceOf(BaseRepository);
    expect(BaseRepositoryMock).toHaveBeenCalledOnce();
    expect(BaseRepositoryMock).toHaveBeenCalledWith(
      'pies.coding',
      undefined,
      expect.arrayContaining(['coding_code_code_system_version_id_unique'])
    );
  });
});
