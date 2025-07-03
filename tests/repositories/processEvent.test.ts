import { getDefinedOperations, mockDb } from './repository.helper.ts';
import { BaseRepository } from '../../src/repositories/base.ts';
import { ProcessEventRepository } from '../../src/repositories/processEvent.ts';

describe('ProcessEventRepository', () => {
  describe('constructor', () => {
    const OriginalRepository = Object.getPrototypeOf(ProcessEventRepository) as typeof BaseRepository;
    const BaseRepositoryMock = vi.fn();

    beforeAll(() => {
      Object.setPrototypeOf(ProcessEventRepository, BaseRepositoryMock);
    });

    afterAll(() => {
      Object.setPrototypeOf(ProcessEventRepository, OriginalRepository);
    });

    it('should extend BaseRepository', () => {
      const repo = new ProcessEventRepository();
      expect(repo).toBeInstanceOf(BaseRepository);
    });

    it('should call super with correct arguments', () => {
      new ProcessEventRepository();
      expect(BaseRepositoryMock).toHaveBeenCalledOnce();
      expect(BaseRepositoryMock).toHaveBeenCalledWith('pies.processEvent', undefined);
    });

    it('should call super with db argument if provided', () => {
      new ProcessEventRepository(mockDb);
      expect(BaseRepositoryMock).toHaveBeenCalledWith('pies.processEvent', mockDb);
    });
  });

  describe('prune', () => {
    it('should build a delete query for the given systemRecordId', () => {
      const systemRecordId = 42;
      const compiled = new ProcessEventRepository(mockDb).prune(systemRecordId).compile();

      expect(getDefinedOperations(compiled.query)).toEqual(['kind', 'from', 'where']);
      expect(compiled.query.kind).toBe('DeleteQueryNode');
      expect(compiled.sql).toBe('delete from "pies"."process_event" where "system_record_id" = $1');
      expect(compiled.parameters).toEqual([systemRecordId]);
    });
  });
});
