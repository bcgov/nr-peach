import { mockDb } from './repository.helper.ts';
import { AssetKindRepository } from '#src/repositories/assetKind';
import { BaseRepository } from '#src/repositories/base';

describe('AssetKindRepository', () => {
  describe('constructor', () => {
    const OriginalRepository = Object.getPrototypeOf(AssetKindRepository) as typeof BaseRepository;
    const BaseRepositoryMock = vi.fn();

    beforeAll(() => {
      Object.setPrototypeOf(AssetKindRepository, BaseRepositoryMock);
    });

    afterAll(() => {
      Object.setPrototypeOf(AssetKindRepository, OriginalRepository);
    });

    it('should extend BaseRepository', () => {
      const repo = new AssetKindRepository();
      expect(repo).toBeInstanceOf(BaseRepository);
    });

    it('should call super with correct arguments', () => {
      new AssetKindRepository();
      expect(BaseRepositoryMock).toHaveBeenCalledTimes(1);
      expect(BaseRepositoryMock).toHaveBeenCalledWith('pies.assetKind', undefined, [
        'asset_kind_version_id_kind_unique'
      ]);
    });

    it('should call super with db argument if provided', () => {
      new AssetKindRepository(mockDb);
      expect(BaseRepositoryMock).toHaveBeenCalledWith('pies.assetKind', mockDb, ['asset_kind_version_id_kind_unique']);
    });
  });
});
