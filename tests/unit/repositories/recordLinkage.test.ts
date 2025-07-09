import { mockDb } from './repository.helper.ts';
import { BaseRepository } from '../../../src/repositories/base.ts';
import { RecordLinkageRepository } from '../../../src/repositories/recordLinkage.ts';

describe('RecordLinkageRepository', () => {
  describe('constructor', () => {
    const OriginalRepository = Object.getPrototypeOf(RecordLinkageRepository) as typeof BaseRepository;
    const BaseRepositoryMock = vi.fn();

    beforeAll(() => {
      Object.setPrototypeOf(RecordLinkageRepository, BaseRepositoryMock);
    });

    afterAll(() => {
      Object.setPrototypeOf(RecordLinkageRepository, OriginalRepository);
    });

    it('should extend BaseRepository', () => {
      const repo = new RecordLinkageRepository();
      expect(repo).toBeInstanceOf(BaseRepository);
    });

    it('should call super with correct arguments', () => {
      new RecordLinkageRepository();
      expect(BaseRepositoryMock).toHaveBeenCalledTimes(1);
      expect(BaseRepositoryMock).toHaveBeenCalledWith('pies.recordLinkage', undefined, [
        'record_linkage_forward_unique',
        'record_linkage_reverse_unique'
      ]);
    });

    it('should call super with db argument if provided', () => {
      new RecordLinkageRepository(mockDb);
      expect(BaseRepositoryMock).toHaveBeenCalledWith('pies.recordLinkage', mockDb, [
        'record_linkage_forward_unique',
        'record_linkage_reverse_unique'
      ]);
    });
  });
});
