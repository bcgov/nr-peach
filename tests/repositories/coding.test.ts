import { mockDb } from './repository.helper.ts';
import { BaseRepository } from '../../src/repositories/base.ts';
import { CodingRepository } from '../../src/repositories/coding.ts';

describe('CodingRepository', () => {
  describe('constructor', () => {
    const OriginalRepository = Object.getPrototypeOf(CodingRepository) as typeof BaseRepository;
    const BaseRepositoryMock = vi.fn();

    beforeAll(() => {
      Object.setPrototypeOf(CodingRepository, BaseRepositoryMock);
    });

    afterAll(() => {
      Object.setPrototypeOf(CodingRepository, OriginalRepository);
    });

    it('should extend BaseRepository', () => {
      const repo = new CodingRepository();
      expect(repo).toBeInstanceOf(BaseRepository);
    });

    it('should call super with correct arguments', () => {
      new CodingRepository();
      expect(BaseRepositoryMock).toHaveBeenCalledOnce();
      expect(BaseRepositoryMock).toHaveBeenCalledWith('pies.coding', undefined, [
        'coding_code_code_system_version_id_unique'
      ]);
    });

    it('should call super with db argument if provided', () => {
      new CodingRepository(mockDb);
      expect(BaseRepositoryMock).toHaveBeenCalledWith('pies.coding', mockDb, [
        'coding_code_code_system_version_id_unique'
      ]);
    });
  });
});
