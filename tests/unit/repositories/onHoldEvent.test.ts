import { getDefinedOperations, mockDb } from './repository.helper.ts';
import { BaseRepository } from '../../../src/repositories/base.ts';
import { OnHoldEventRepository } from '../../../src/repositories/onHoldEvent.ts';

describe('OnHoldEventRepository', () => {
  describe('constructor', () => {
    const OriginalRepository = Object.getPrototypeOf(OnHoldEventRepository) as typeof BaseRepository;
    const BaseRepositoryMock = vi.fn();

    beforeAll(() => {
      Object.setPrototypeOf(OnHoldEventRepository, BaseRepositoryMock);
    });

    afterAll(() => {
      Object.setPrototypeOf(OnHoldEventRepository, OriginalRepository);
    });

    it('should extend BaseRepository', () => {
      const repo = new OnHoldEventRepository();
      expect(repo).toBeInstanceOf(BaseRepository);
    });

    it('should call super with correct arguments', () => {
      new OnHoldEventRepository();
      expect(BaseRepositoryMock).toHaveBeenCalledTimes(1);
      expect(BaseRepositoryMock).toHaveBeenCalledWith('pies.onHoldEvent', undefined);
    });

    it('should call super with db argument if provided', () => {
      new OnHoldEventRepository(mockDb);
      expect(BaseRepositoryMock).toHaveBeenCalledWith('pies.onHoldEvent', mockDb);
    });
  });

  describe('prune', () => {
    it('should build a delete query for the given systemRecordId', () => {
      const systemRecordId = 42;
      const compiled = new OnHoldEventRepository(mockDb).prune(systemRecordId).compile();

      expect(getDefinedOperations(compiled.query)).toEqual(['kind', 'from', 'where']);
      expect(compiled.query.kind).toBe('DeleteQueryNode');
      expect(compiled.sql).toBe('delete from "pies"."on_hold_event" where "system_record_id" = $1');
      expect(compiled.parameters).toEqual([systemRecordId]);
    });
  });
});
