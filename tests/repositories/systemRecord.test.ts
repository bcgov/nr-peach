import { mockDb } from './repository.helper.ts';
import { BaseRepository } from '../../src/repositories/base.ts';
import { SystemRecordRepository } from '../../src/repositories/systemRecord.ts';

describe('SystemRecordRepository', () => {
  describe('constructor', () => {
    const OriginalRepository = Object.getPrototypeOf(SystemRecordRepository) as typeof BaseRepository;
    const BaseRepositoryMock = vi.fn();

    beforeAll(() => {
      Object.setPrototypeOf(SystemRecordRepository, BaseRepositoryMock);
    });

    afterAll(() => {
      Object.setPrototypeOf(SystemRecordRepository, OriginalRepository);
    });

    it('should extend BaseRepository', () => {
      const repo = new SystemRecordRepository();
      expect(repo).toBeInstanceOf(BaseRepository);
    });

    it('should call super with correct arguments', () => {
      new SystemRecordRepository();
      expect(BaseRepositoryMock).toHaveBeenCalledTimes(1);
      expect(BaseRepositoryMock).toHaveBeenCalledWith('pies.systemRecord', undefined, [
        'system_record_system_id_record_id_unique'
      ]);
    });

    it('should call super with db argument if provided', () => {
      new SystemRecordRepository(mockDb);
      expect(BaseRepositoryMock).toHaveBeenCalledWith('pies.systemRecord', mockDb, [
        'system_record_system_id_record_id_unique'
      ]);
    });
  });
});
