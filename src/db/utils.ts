import { sql } from 'kysely';

import type { CreateTableBuilder, Kysely, QueryResult } from 'kysely';

/**
 * Create Audit Log Trigger for a given table.
 * @param qb Query Builder
 * @param schema Schema
 * @param table Table
 * @returns Query Builder Result
 */
export function createAuditLogTrigger(
  qb: Kysely<unknown>,
  schema: string,
  table: string
): Promise<QueryResult<unknown>> {
  return sql`CREATE TRIGGER audit_${sql.raw(table)}_au_trigger
    AFTER UPDATE OR DELETE ON ${sql.id(schema, table)}
    FOR EACH ROW EXECUTE PROCEDURE audit.if_modified_func();`.execute(qb);
}

/**
 * Create an index on a given table and columns.
 * @param qb Query Builder
 * @param schema Schema
 * @param table Table
 * @param columns Columns
 * @returns Query Builder Promise
 */
export function createIndex(
  qb: Kysely<unknown>,
  schema: string,
  table: string,
  columns: string[]
): Promise<void> {
  return qb.schema
    .withSchema(schema)
    .createIndex(`${table}_${columns.join('_')}_index`)
    .on(table)
    .columns(columns)
    .execute();
}

/**
 * Create an updated at trigger for a given table.
 * @param qb Query Builder
 * @param schema Schema
 * @param table Table
 * @returns Query Builder Result
 */
export function createUpdatedAtTrigger(
  qb: Kysely<unknown>,
  schema: string,
  table: string
): Promise<QueryResult<unknown>> {
  return sql`CREATE TRIGGER pies_${sql.raw(table)}_bu_trigger
    BEFORE UPDATE ON ${sql.id(schema, table)}
    FOR EACH ROW EXECUTE PROCEDURE pies.set_updated_at_func();`.execute(qb);
}

/**
 * Drop Audit Log Trigger for a given table.
 * @param qb Query Builder
 * @param schema Schema
 * @param table Table
 * @returns Query Builder Promise
 */
export function dropAuditLogTrigger(
  qb: Kysely<unknown>,
  schema: string,
  table: string
): Promise<QueryResult<unknown>> {
  return sql`DROP TRIGGER IF EXISTS audit_${sql.raw(table)}_au_trigger ON ${sql.id(
    schema,
    table
  )}`.execute(qb);
}

/**
 * Drop an index on a given table and columns.
 * @param qb Query Builder
 * @param schema Schema
 * @param table Table
 * @param columns Columns
 * @returns Query Builder Promise
 */
export function dropIndex(
  qb: Kysely<unknown>,
  schema: string,
  table: string,
  columns: string[]
): Promise<void> {
  return qb.schema
    .withSchema(schema)
    .dropIndex(`${table}_${columns.join('_')}_index`)
    .execute();
}

/**
 * Drop an updated at trigger for a given table.
 * @param qb Query Builder
 * @param schema Schema
 * @param table Table
 * @returns Query Builder Result
 */
export function dropUpdatedAtTrigger(
  qb: Kysely<unknown>,
  schema: string,
  table: string
): Promise<QueryResult<unknown>> {
  return sql`DROP TRIGGER IF EXISTS pies_${sql.raw(table)}_bu_trigger ON ${sql.id(
    schema,
    table
  )}`.execute(qb);
}

/**
 * Adds timestamps to a table builder.
 * @param qb The table builder to add timestamps to.
 * @returns The table builder with timestamps added. Should be invoked within a $call.
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
