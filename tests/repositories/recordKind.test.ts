import { mockDb } from './repository.helper.ts';
import { BaseRepository } from '../../src/repositories/base.ts';
import { RecordKindRepository } from '../../src/repositories/recordKind.ts';

describe('RecordKindRepository', () => {
  describe('constructor', () => {
    const OriginalRepository = Object.getPrototypeOf(RecordKindRepository) as typeof BaseRepository;
    const BaseRepositoryMock = vi.fn();

    beforeAll(() => {
      Object.setPrototypeOf(RecordKindRepository, BaseRepositoryMock);
    });

    afterAll(() => {
      Object.setPrototypeOf(RecordKindRepository, OriginalRepository);
    });

    it('should extend BaseRepository', () => {
      const repo = new RecordKindRepository();
      expect(repo).toBeInstanceOf(BaseRepository);
    });

    it('should call super with correct arguments', () => {
      new RecordKindRepository();
      expect(BaseRepositoryMock).toHaveBeenCalledOnce();
      expect(BaseRepositoryMock).toHaveBeenCalledWith('pies.recordKind', undefined, [
        'record_kind_version_id_kind_unique'
      ]);
    });

    it('should call super with db argument if provided', () => {
      new RecordKindRepository(mockDb);
      expect(BaseRepositoryMock).toHaveBeenCalledWith('pies.recordKind', mockDb, [
        'record_kind_version_id_kind_unique'
      ]);
    });
  });
});
