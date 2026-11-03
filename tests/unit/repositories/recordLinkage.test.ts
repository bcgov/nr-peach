import { mockDb } from './repository.helper.ts';
import { BaseRepository } from '#src/repositories/base';
import { LinkageRepository } from '#src/repositories/linkage';

describe('LinkageRepository', () => {
  describe('constructor', () => {
    const OriginalRepository = Object.getPrototypeOf(LinkageRepository) as typeof BaseRepository;
    const BaseRepositoryMock = vi.fn();

    beforeAll(() => {
      Object.setPrototypeOf(LinkageRepository, BaseRepositoryMock);
    });

    afterAll(() => {
      Object.setPrototypeOf(LinkageRepository, OriginalRepository);
    });

    it('should extend BaseRepository', () => {
      const repo = new LinkageRepository();
      expect(repo).toBeInstanceOf(BaseRepository);
    });

    it('should call super with correct arguments', () => {
      new LinkageRepository();
      expect(BaseRepositoryMock).toHaveBeenCalledTimes(1);
      expect(BaseRepositoryMock).toHaveBeenCalledWith('pies.linkage', undefined);
    });

    it('should call super with db argument if provided', () => {
      new LinkageRepository(mockDb);
      expect(BaseRepositoryMock).toHaveBeenCalledWith('pies.linkage', mockDb);
    });
  });
});
