import { sql } from 'kysely';

import type { CreateTableBuilder, Kysely } from 'kysely';

export function createAuditLogTrigger(
  qb: Kysely<unknown>,
  schema: string,
  table: string
) {
  return sql`CREATE TRIGGER ${sql.raw(table)}_audit_au_trigger
    AFTER UPDATE OR DELETE ON ${sql.id(schema, table)}
    FOR EACH ROW EXECUTE PROCEDURE audit.if_modified_func();`.execute(qb);
}

export function createIndex(
  qb: Kysely<unknown>,
  schema: string,
  table: string,
  columns: string[]
) {
  return qb.schema
    .withSchema(schema)
    .createIndex(`${table}_${columns.join('_')}_index`)
    .on(table)
    .columns(columns)
    .execute();
}

export function createUpdatedAtTrigger(
  qb: Kysely<unknown>,
  schema: string,
  table: string
) {
  return sql`CREATE TRIGGER ${sql.raw(table)}_bu_trigger
    BEFORE UPDATE ON ${sql.id(schema, table)}
    FOR EACH ROW EXECUTE PROCEDURE pies.set_updated_at_func();`.execute(qb);
}

export function dropAuditLogTrigger(
  qb: Kysely<unknown>,
  schema: string,
  table: string
) {
  return sql`DROP TRIGGER IF EXISTS ${sql.raw(table)}_bu_trigger ON ${sql.id(
    schema,
    table
  )}`.execute(qb);
}

export function dropIndex(
  qb: Kysely<unknown>,
  schema: string,
  table: string,
  columns: string[]
) {
  return qb.schema
    .withSchema(schema)
    .dropIndex(`${table}_${columns.join('_')}_index`)
    .execute();
}

export function dropUpdatedAtTrigger(
  qb: Kysely<unknown>,
  schema: string,
  table: string
) {
  return sql`DROP TRIGGER IF EXISTS ${sql.raw(table)}_bu_trigger ON ${sql.id(
    schema,
    table
  )}`.execute(qb);
}

/**
 * @function withTimestamps
 * @description Adds timestamps to a table builder.
 * @param {CreateIndexBuilder} qb The table builder to add timestamps to.
 * @returns {CreateTableBuilder} The table builder with timestamps added. Should be invoked within a $call.
 */
export function withTimestamps<TB extends string>(
  qb: CreateTableBuilder<TB>
): CreateTableBuilder<TB> {
  return qb
    .addColumn('created_at', 'timestamp', (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn('created_by', 'text', (col) => col.notNull())
    .addColumn('updated_at', 'timestamp')
    .addColumn('updated_by', 'text');
}
