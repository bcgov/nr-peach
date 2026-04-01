import { mockDb } from './repository.helper.ts';
import { BaseRepository } from '#src/repositories/base';
import { TransactionRepository } from '#src/repositories/transaction';

describe('TransactionRepository', () => {
  describe('constructor', () => {
    const OriginalRepository = Object.getPrototypeOf(TransactionRepository) as typeof BaseRepository;
    const BaseRepositoryMock = vi.fn();

    beforeAll(() => {
      Object.setPrototypeOf(TransactionRepository, BaseRepositoryMock);
    });

    afterAll(() => {
      Object.setPrototypeOf(TransactionRepository, OriginalRepository);
    });

    it('should extend BaseRepository', () => {
      const repo = new TransactionRepository();
      expect(repo).toBeInstanceOf(BaseRepository);
    });

    it('should call super with correct arguments', () => {
      new TransactionRepository();
      expect(BaseRepositoryMock).toHaveBeenCalledTimes(1);
      expect(BaseRepositoryMock).toHaveBeenCalledWith('pies.transaction', undefined);
    });

    it('should call super with db argument if provided', () => {
      new TransactionRepository(mockDb);
      expect(BaseRepositoryMock).toHaveBeenCalledWith('pies.transaction', mockDb);
    });
  });
});
