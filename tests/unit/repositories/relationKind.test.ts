import { mockDb } from './repository.helper.ts';
import { BaseRepository } from '#src/repositories/base';
import { RelationKindRepository } from '#src/repositories/relationKind';

describe('RelationKindRepository', () => {
  describe('constructor', () => {
    const OriginalRepository = Object.getPrototypeOf(RelationKindRepository) as typeof BaseRepository;
    const BaseRepositoryMock = vi.fn();

    beforeAll(() => {
      Object.setPrototypeOf(RelationKindRepository, BaseRepositoryMock);
    });

    afterAll(() => {
      Object.setPrototypeOf(RelationKindRepository, OriginalRepository);
    });

    it('should extend BaseRepository', () => {
      const repo = new RelationKindRepository();
      expect(repo).toBeInstanceOf(BaseRepository);
    });

    it('should call super with correct arguments', () => {
      new RelationKindRepository();
      expect(BaseRepositoryMock).toHaveBeenCalledTimes(1);
      expect(BaseRepositoryMock).toHaveBeenCalledWith('pies.relationKind', undefined, [
        'relation_kind_version_id_kind_unique'
      ]);
    });

    it('should call super with db argument if provided', () => {
      new RelationKindRepository(mockDb);
      expect(BaseRepositoryMock).toHaveBeenCalledWith('pies.relationKind', mockDb, [
        'relation_kind_version_id_kind_unique'
      ]);
    });
  });
});
