import { mockDb } from './repository.helper.ts';
import { BaseRepository } from '../../../src/repositories/base.ts';
import { SystemRepository } from '../../../src/repositories/system.ts';

describe('SystemRepository', () => {
  describe('constructor', () => {
    const OriginalRepository = Object.getPrototypeOf(SystemRepository) as typeof BaseRepository;
    const BaseRepositoryMock = vi.fn();

    beforeAll(() => {
      Object.setPrototypeOf(SystemRepository, BaseRepositoryMock);
    });

    afterAll(() => {
      Object.setPrototypeOf(SystemRepository, OriginalRepository);
    });

    it('should extend BaseRepository', () => {
      const repo = new SystemRepository();
      expect(repo).toBeInstanceOf(BaseRepository);
    });

    it('should call super with correct arguments', () => {
      new SystemRepository();
      expect(BaseRepositoryMock).toHaveBeenCalledTimes(1);
      expect(BaseRepositoryMock).toHaveBeenCalledWith('pies.system', undefined);
    });

    it('should call super with db argument if provided', () => {
      new SystemRepository(mockDb);
      expect(BaseRepositoryMock).toHaveBeenCalledWith('pies.system', mockDb);
    });
  });
});
