import '../kysely.helper.ts'; // Must be imported before everything else
import { mockSqlExecuteReturn } from '../kysely.helper.ts';

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

import type { CreateTableBuilder, KyselyConfig } from 'kysely';
import type { Mock } from 'vitest';

describe('DB Utils', () => {
  let qb: Kysely<unknown>;

  beforeEach(() => {
    qb = new Kysely<unknown>({} as KyselyConfig);
    (sql as unknown as Mock).mockImplementation(mockSqlExecuteReturn(qb));
  });

  it('should create an audit log trigger', async () => {
    const execute = await createAuditLogTrigger(qb, 'public', 'test_table');

    expect(sql).toHaveBeenCalledWith(
      [
        'CREATE TRIGGER audit_',
        '_au_trigger\n    AFTER UPDATE OR DELETE ON ',
        '\n    FOR EACH ROW EXECUTE PROCEDURE audit.if_modified_func();'
      ],
      'test_table',
      ['public', 'test_table']
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(sql.raw).toHaveBeenCalledWith('test_table');
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(sql.id).toHaveBeenCalledWith('public', 'test_table');
    expect(execute).toEqual(qb);
  });

  it('should create an index', async () => {
    await createIndex(qb, 'public', 'test_table', ['column1', 'column2']);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(qb.schema.withSchema).toHaveBeenCalledWith('public');
    // eslint-disable-next-line @typescript-eslint/unbound-method
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

  it('should create an updated at trigger', async () => {
    const execute = await createUpdatedAtTrigger(qb, 'public', 'test_table');

    expect(sql).toHaveBeenCalledWith(
      [
        'CREATE TRIGGER pies_',
        '_bu_trigger\n    BEFORE UPDATE ON ',
        '\n    FOR EACH ROW EXECUTE PROCEDURE pies.set_updated_at_func();'
      ],
      'test_table',
      ['public', 'test_table']
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(sql.raw).toHaveBeenCalledWith('test_table');
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(sql.id).toHaveBeenCalledWith('public', 'test_table');
    expect(execute).toEqual(qb);
  });

  it('should drop an audit log trigger', async () => {
    const execute = await dropAuditLogTrigger(qb, 'public', 'test_table');

    expect(sql).toHaveBeenCalledWith(
      ['DROP TRIGGER IF EXISTS audit_', '_au_trigger ON ', ''],
      'test_table',
      ['public', 'test_table']
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(sql.raw).toHaveBeenCalledWith('test_table');
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(sql.id).toHaveBeenCalledWith('public', 'test_table');
    expect(execute).toEqual(qb);
  });

  it('should drop an index', async () => {
    await dropIndex(qb, 'public', 'test_table', ['column1', 'column2']);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(qb.schema.withSchema).toHaveBeenCalledWith('public');
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(qb.schema.dropIndex).toHaveBeenCalledWith(
      'test_table_column1_column2_index'
    );
    // @ts-expect-error ts2339
    expect(qb.schema.execute).toHaveBeenCalled();
  });

  it('should drop an updated at trigger', async () => {
    const execute = await dropUpdatedAtTrigger(qb, 'public', 'test_table');

    expect(sql).toHaveBeenCalledWith(
      ['DROP TRIGGER IF EXISTS pies_', '_bu_trigger ON ', ''],
      'test_table',
      ['public', 'test_table']
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(sql.raw).toHaveBeenCalledWith('test_table');
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(sql.id).toHaveBeenCalledWith('public', 'test_table');
    expect(execute).toEqual(qb);
  });

  it('should add timestamps to a table builder', () => {
    const tableBuilder = {
      addColumn: vi.fn().mockReturnThis()
    } as unknown as CreateTableBuilder<string>;
    const result = withTimestamps(tableBuilder);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(result.addColumn).toHaveBeenCalledWith(
      'created_at',
      'timestamp',
      expect.any(Function)
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(result.addColumn).toHaveBeenCalledWith(
      'created_by',
      'text',
      expect.any(Function)
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(result.addColumn).toHaveBeenCalledWith('updated_at', 'timestamp');
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(result.addColumn).toHaveBeenCalledWith('updated_by', 'text');
  });
});
