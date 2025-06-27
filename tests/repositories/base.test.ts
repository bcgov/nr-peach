import { sql } from 'kysely';

import { BaseRepository } from '../../src/repositories/base.ts';

import type { Kysely, Transaction } from 'kysely';
import type { DB } from '../../src/types/index.d.ts';

declare module '../../src/types/index.d.ts' {
  interface DB {
    test_table: { id: number; name: string };
  }
}

class TestRepository extends BaseRepository<'test_table'> {
  constructor(db: Kysely<DB> | Transaction<DB>) {
    super('test_table', db);
  }
}

describe('BaseRepository', () => {
  let mockDb: Kysely<DB>;
  let repository: TestRepository;

  beforeEach(() => {
    mockDb = {
      $castTo: vi.fn().mockReturnThis(),
      deleteFrom: vi.fn().mockReturnThis(),
      insertInto: vi.fn().mockReturnThis(),
      onConflict: vi.fn().mockReturnThis(),
      returningAll: vi.fn().mockReturnThis(),
      selectAll: vi.fn().mockReturnThis(),
      selectFrom: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis()
    } as Partial<Kysely<DB>> as Kysely<DB>;
    repository = new TestRepository(mockDb);
  });

  it('should create a new entity', () => {
    const data = { id: 1, name: 'Test' };
    repository.create(data);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockDb.insertInto).toHaveBeenCalledWith('test_table');
    // @ts-expect-error ts(2339)
    expect(mockDb.values).toHaveBeenCalledWith(data);
    // @ts-expect-error ts(2339)
    expect(mockDb.returningAll).toHaveBeenCalled();
  });

  it('should create multiple entities', () => {
    const data = [
      { id: 1, name: 'Test1' },
      { id: 2, name: 'Test2' }
    ];
    repository.createMany(data);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockDb.insertInto).toHaveBeenCalledWith('test_table');
    // @ts-expect-error ts(2339)
    expect(mockDb.values).toHaveBeenCalledWith(data);
    // @ts-expect-error ts(2339)
    expect(mockDb.returningAll).toHaveBeenCalled();
  });

  it('should delete an entity by ID', () => {
    const id = 1;
    repository.delete(id);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockDb.deleteFrom).toHaveBeenCalledWith('test_table');
    // @ts-expect-error ts(2339)
    expect(mockDb.where).toHaveBeenCalledWith(sql.ref('id'), '=', id);
  });

  it('should find entities by filter', () => {
    const filter = { name: 'Test' };
    repository.findBy(filter);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockDb.selectFrom).toHaveBeenCalledWith('test_table');
    // @ts-expect-error ts(2339)
    expect(mockDb.selectAll).toHaveBeenCalled();
    // @ts-expect-error ts(2339)
    expect(mockDb.where).toHaveBeenCalled();
  });

  it('should read an entity by ID', () => {
    const id = 1;
    repository.read(id);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockDb.selectFrom).toHaveBeenCalledWith('test_table');
    // @ts-expect-error ts(2339)
    expect(mockDb.selectAll).toHaveBeenCalled();
    // @ts-expect-error ts(2339)
    expect(mockDb.where).toHaveBeenCalledWith(sql.ref('id'), '=', id);
  });

  it('should upsert an entity', () => {
    const data = { id: 1, name: 'Test' };
    repository.upsert(data);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockDb.insertInto).toHaveBeenCalledWith('test_table');
    // @ts-expect-error ts(2339)
    expect(mockDb.values).toHaveBeenCalledWith(data);
    // @ts-expect-error ts(2339)
    expect(mockDb.onConflict).toHaveBeenCalled();
    // @ts-expect-error ts(2339)
    expect(mockDb.returningAll).toHaveBeenCalled();
  });

  it('should upsert multiple entities', () => {
    const data = [
      { id: 1, name: 'Test1' },
      { id: 2, name: 'Test2' }
    ];
    repository.upsertMany(data);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockDb.insertInto).toHaveBeenCalledWith('test_table');
    // @ts-expect-error ts(2339)
    expect(mockDb.values).toHaveBeenCalledWith(data);
    // @ts-expect-error ts(2339)
    expect(mockDb.onConflict).toHaveBeenCalled();
    // @ts-expect-error ts(2339)
    expect(mockDb.returningAll).toHaveBeenCalled();
  });
});
