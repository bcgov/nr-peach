import { mockSqlExecuteReturn } from './kysely.helper.ts'; // Must be imported before everything else

import { Kysely, sql } from 'kysely';

import {
  SYSTEM_USER,
  createAuditLogTrigger,
  createIndex,
  createUpdatedAtTrigger,
  dropAuditLogTrigger,
  dropIndex,
  dropUpdatedAtTrigger,
  renameConstraints,
  withTimestamps
} from '#src/db/utils';

import type { CreateTableBuilder, KyselyConfig, SchemaModule } from 'kysely';
import type { Mock } from 'vitest';

interface ExtendedKysely extends Kysely<unknown> {
  schema: SchemaModule & {
    alterTable: () => unknown;
    columns: () => unknown;
    execute: () => unknown;
    ifExists: () => unknown;
    on: () => unknown;
    renameConstraint: () => unknown;
  };
}

describe('DB Utils', () => {
  let qb: ExtendedKysely;

  beforeEach(() => {
    qb = new Kysely<unknown>({} as KyselyConfig) as ExtendedKysely;
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
    expect(qb.schema.createIndex).toHaveBeenCalledWith('test_table_column1_column2_index');
    expect(qb.schema.on).toHaveBeenCalledWith('test_table');
    expect(qb.schema.columns).toHaveBeenCalledWith(['column1', 'column2']);
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

    expect(sql).toHaveBeenCalledWith(['DROP TRIGGER IF EXISTS audit_', '_au_trigger ON ', ''], 'test_table', [
      'public',
      'test_table'
    ]);
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
    expect(qb.schema.dropIndex).toHaveBeenCalledWith('test_table_column1_column2_index');
    expect(qb.schema.ifExists).toHaveBeenCalled();
    expect(qb.schema.execute).toHaveBeenCalled();
  });

  it('should drop an updated at trigger', async () => {
    const execute = await dropUpdatedAtTrigger(qb, 'public', 'test_table');

    expect(sql).toHaveBeenCalledWith(['DROP TRIGGER IF EXISTS pies_', '_bu_trigger ON ', ''], 'test_table', [
      'public',
      'test_table'
    ]);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(sql.raw).toHaveBeenCalledWith('test_table');
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(sql.id).toHaveBeenCalledWith('public', 'test_table');
    expect(execute).toEqual(qb);
  });

  it('should rename a single constraint', async () => {
    await renameConstraints(qb, 'public', 'test_table', [['old_constraint', 'new_constraint']]);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(qb.schema.withSchema).toHaveBeenCalledWith('public');
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(qb.schema.alterTable).toHaveBeenCalledWith('test_table');

    expect(qb.schema.renameConstraint).toHaveBeenCalledWith('old_constraint', 'new_constraint');
    expect(qb.schema.execute).toHaveBeenCalled();
  });

  it('should rename multiple constraints', async () => {
    await renameConstraints(qb, 'public', 'test_table', [
      ['constraint_1_old', 'constraint_1_new'],
      ['constraint_2_old', 'constraint_2_new'],
      ['constraint_3_old', 'constraint_3_new']
    ]);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(qb.schema.withSchema).toHaveBeenCalledTimes(3);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(qb.schema.withSchema).toHaveBeenNthCalledWith(1, 'public');
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(qb.schema.withSchema).toHaveBeenNthCalledWith(2, 'public');
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(qb.schema.withSchema).toHaveBeenNthCalledWith(3, 'public');

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(qb.schema.alterTable).toHaveBeenCalledTimes(3);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(qb.schema.alterTable).toHaveBeenNthCalledWith(1, 'test_table');
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(qb.schema.alterTable).toHaveBeenNthCalledWith(2, 'test_table');
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(qb.schema.alterTable).toHaveBeenNthCalledWith(3, 'test_table');

    expect(qb.schema.renameConstraint).toHaveBeenCalledTimes(3);
    expect(qb.schema.renameConstraint).toHaveBeenNthCalledWith(1, 'constraint_1_old', 'constraint_1_new');
    expect(qb.schema.renameConstraint).toHaveBeenNthCalledWith(2, 'constraint_2_old', 'constraint_2_new');
    expect(qb.schema.renameConstraint).toHaveBeenNthCalledWith(3, 'constraint_3_old', 'constraint_3_new');

    expect(qb.schema.execute).toHaveBeenCalledTimes(3);
  });

  it('should handle empty renames array', async () => {
    await renameConstraints(qb, 'public', 'test_table', []);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(qb.schema.withSchema).not.toHaveBeenCalled();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(qb.schema.alterTable).not.toHaveBeenCalled();
    expect(qb.schema.renameConstraint).not.toHaveBeenCalled();
    expect(qb.schema.execute).not.toHaveBeenCalled();
  });

  it('should add timestamps to a table builder', () => {
    const colBuilder = {
      defaultTo: vi.fn().mockReturnThis(),
      notNull: vi.fn().mockReturnThis()
    };
    const tableBuilder = {
      addColumn: vi.fn().mockReturnThis()
    } as unknown as CreateTableBuilder<string>;
    const result = withTimestamps(tableBuilder);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(result.addColumn).toHaveBeenCalledWith('created_at', 'timestamptz', expect.any(Function));
    const createdAtFn = (tableBuilder.addColumn as Mock).mock.calls.find((call) => call[0] === 'created_at')?.[2] as (
      col: typeof colBuilder
    ) => void;
    createdAtFn(colBuilder);
    expect(colBuilder.notNull).toHaveBeenCalled();
    expect(colBuilder.defaultTo).toHaveBeenCalledWith(expect.objectContaining({ strings: ['CURRENT_TIMESTAMP'] }));

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(result.addColumn).toHaveBeenCalledWith('created_by', 'text', expect.any(Function));
    const createdByFn = (tableBuilder.addColumn as Mock).mock.calls.find((call) => call[0] === 'created_by')?.[2] as (
      col: typeof colBuilder
    ) => void;
    createdByFn(colBuilder);
    expect(colBuilder.notNull).toHaveBeenCalled();
    expect(colBuilder.defaultTo).toHaveBeenCalledWith(SYSTEM_USER);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(result.addColumn).toHaveBeenCalledWith('updated_at', 'timestamptz');
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(result.addColumn).toHaveBeenCalledWith('updated_by', 'text');
  });
});
