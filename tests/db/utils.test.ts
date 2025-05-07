/* eslint-disable @typescript-eslint/unbound-method */
// TODO: Figure out how to mock and test the sql interface from kysely

import { Kysely, sql } from 'kysely';
import {
  createAuditLogTrigger,
  createIndex,
  createUpdatedAtTrigger,
  dropAuditLogTrigger,
  dropIndex,
  dropUpdatedAtTrigger,
  withTimestamps
} from '../../src/db/utils.ts';

import type { CreateTableBuilder } from 'kysely';

vi.mock('kysely', () => ({
  sql: {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    raw: vi.fn((value) => value),
    id: vi.fn((schema, table) => `${schema}.${table}`)
  }
}));

describe('DB Utils', () => {
  let qb: Kysely<unknown>;

  beforeEach(() => {
    qb = {
      schema: {
        withSchema: vi.fn().mockReturnThis(),
        createIndex: vi.fn().mockReturnThis(),
        dropIndex: vi.fn().mockReturnThis(),
        on: vi.fn().mockReturnThis(),
        columns: vi.fn().mockReturnThis(),
        execute: vi.fn()
      }
    } as unknown as Kysely<unknown>;
  });

  it.skip('should create an audit log trigger', async () => {
    await createAuditLogTrigger(qb, 'public', 'test_table');
    expect(sql.raw).toHaveBeenCalledWith('test_table_audit_au_trigger');
    expect(sql.id).toHaveBeenCalledWith('public', 'test_table');
    expect(qb.schema).toHaveBeenCalled();
  });

  it('should create an index', async () => {
    await createIndex(qb, 'public', 'test_table', ['column1', 'column2']);
    expect(qb.schema.withSchema).toHaveBeenCalledWith('public');
    expect(qb.schema.createIndex).toHaveBeenCalledWith(
      'test_table_column1_column2_index'
    );
    // @ts-expect-error ts2339
    expect(qb.schema.on).toHaveBeenCalledWith('test_table');
    // @ts-expect-error ts2339
    expect(qb.schema.columns).toHaveBeenCalledWith(['column1', 'column2']);
    // @ts-expect-error ts2339
    expect(qb.schema.execute).toHaveBeenCalled();
  });

  it.skip('should create an updated at trigger', async () => {
    await createUpdatedAtTrigger(qb, 'public', 'test_table');
    expect(sql.raw).toHaveBeenCalledWith('test_table_bu_trigger');
    expect(sql.id).toHaveBeenCalledWith('public', 'test_table');
    // @ts-expect-error ts2339
    expect(qb.schema.execute).toHaveBeenCalled();
  });

  it.skip('should drop an audit log trigger', async () => {
    await dropAuditLogTrigger(qb, 'public', 'test_table');
    expect(sql.raw).toHaveBeenCalledWith('test_table_bu_trigger');
    expect(sql.id).toHaveBeenCalledWith('public', 'test_table');
    // @ts-expect-error ts2339
    expect(qb.schema.execute).toHaveBeenCalled();
  });

  it('should drop an index', async () => {
    await dropIndex(qb, 'public', 'test_table', ['column1', 'column2']);
    expect(qb.schema.withSchema).toHaveBeenCalledWith('public');
    expect(qb.schema.dropIndex).toHaveBeenCalledWith(
      'test_table_column1_column2_index'
    );
    // @ts-expect-error ts2339
    expect(qb.schema.execute).toHaveBeenCalled();
  });

  it.skip('should drop an updated at trigger', async () => {
    await dropUpdatedAtTrigger(qb, 'public', 'test_table');
    expect(sql.raw).toHaveBeenCalledWith('test_table_bu_trigger');
    expect(sql.id).toHaveBeenCalledWith('public', 'test_table');
    // @ts-expect-error ts2339
    expect(qb.schema.execute).toHaveBeenCalled();
  });

  it('should add timestamps to a table builder', () => {
    const tableBuilder = {
      addColumn: vi.fn().mockReturnThis()
    } as unknown as CreateTableBuilder<string>;

    const result = withTimestamps(tableBuilder);

    expect(result.addColumn).toHaveBeenCalledWith(
      'created_at',
      'timestamp',
      expect.any(Function)
    );
    expect(result.addColumn).toHaveBeenCalledWith(
      'created_by',
      'text',
      expect.any(Function)
    );
    expect(result.addColumn).toHaveBeenCalledWith('updated_at', 'timestamp');
    expect(result.addColumn).toHaveBeenCalledWith('updated_by', 'text');
  });
});
