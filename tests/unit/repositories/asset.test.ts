import { mockDb } from './repository.helper.ts';
import { AssetRepository } from '#src/repositories/asset';
import { BaseRepository } from '#src/repositories/base';

describe('AssetRepository', () => {
  describe('constructor', () => {
    const OriginalRepository = Object.getPrototypeOf(AssetRepository) as typeof BaseRepository;
    const BaseRepositoryMock = vi.fn();

    beforeAll(() => {
      Object.setPrototypeOf(AssetRepository, BaseRepositoryMock);
    });

    afterAll(() => {
      Object.setPrototypeOf(AssetRepository, OriginalRepository);
    });

    it('should extend BaseRepository', () => {
      const repo = new AssetRepository();
      expect(repo).toBeInstanceOf(BaseRepository);
    });

    it('should call super with correct arguments', () => {
      new AssetRepository();
      expect(BaseRepositoryMock).toHaveBeenCalledTimes(1);
      expect(BaseRepositoryMock).toHaveBeenCalledWith('pies.asset', undefined, ['asset_system_id_record_id_unique']);
    });

    it('should call super with db argument if provided', () => {
      new AssetRepository(mockDb);
      expect(BaseRepositoryMock).toHaveBeenCalledWith('pies.asset', mockDb, ['asset_system_id_record_id_unique']);
    });
  });
});
