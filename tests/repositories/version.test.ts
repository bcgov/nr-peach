import { mockDb } from '../database.helper.ts';
import { BaseRepository } from '../../src/repositories/base.ts';
import { VersionRepository } from '../../src/repositories/version.ts';

describe('VersionRepository', () => {
  describe('constructor', () => {
    const OriginalRepository = Object.getPrototypeOf(VersionRepository) as typeof BaseRepository;
    const BaseRepositoryMock = vi.fn();

    beforeAll(() => {
      Object.setPrototypeOf(VersionRepository, BaseRepositoryMock);
    });

    afterAll(() => {
      Object.setPrototypeOf(VersionRepository, OriginalRepository);
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
      new VersionRepository(mockDb);
      expect(BaseRepositoryMock).toHaveBeenCalledWith('pies.version', mockDb);
    });
  });
});
