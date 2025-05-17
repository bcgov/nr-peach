/* eslint-disable max-len */
import { sql } from 'kysely';

import type { Kysely } from 'kysely';

import {
  createAuditLogTrigger,
  createIndex,
  createUpdatedAtTrigger,
  dropAuditLogTrigger,
  dropIndex,
  dropUpdatedAtTrigger,
  withTimestamps
} from '../index.ts';

/**
 *
 * @param db Database
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  // Create audit and pies schemas
  await db.schema.createSchema('audit').ifNotExists().execute();
  await db.schema.createSchema('pies').ifNotExists().execute();

  // Create schema functions
  await sql`CREATE OR REPLACE FUNCTION audit.if_modified_func() RETURNS trigger AS $body$
    DECLARE
      v_old_data json;
      v_new_data json;

    BEGIN
      if (TG_OP = 'UPDATE') then
        v_old_data := row_to_json(OLD);
        v_new_data := row_to_json(NEW);
        insert into audit.logged_actions ("schema_name", "table_name", "db_user", "updated_by_username", "action_timestamp", "action", "original_data", "new_data")
        values (TG_TABLE_SCHEMA::TEXT, TG_TABLE_NAME::TEXT, SESSION_USER::TEXT, NEW."updated_by", now(), TG_OP::TEXT, v_old_data, v_new_data);
        RETURN NEW;
      elsif (TG_OP = 'DELETE') then
        v_old_data := row_to_json(OLD);
        insert into audit.logged_actions ("schema_name", "table_name", "db_user", "action_timestamp", "action", "original_data")
        values (TG_TABLE_SCHEMA::TEXT, TG_TABLE_NAME::TEXT, SESSION_USER::TEXT, now(), TG_OP::TEXT, v_old_data);
        RETURN OLD;
      else
        RAISE WARNING '[AUDIT.IF_MODIFIED_FUNC] - Other action occurred: %, at %', TG_OP, now();
        RETURN NULL;
      end if;

    EXCEPTION
      WHEN data_exception THEN
        RAISE WARNING '[AUDIT.IF_MODIFIED_FUNC] - UDF ERROR [DATA EXCEPTION] - SQLSTATE: %, SQLERRM: %',SQLSTATE,SQLERRM;
        RETURN NULL;
      WHEN unique_violation THEN
        RAISE WARNING '[AUDIT.IF_MODIFIED_FUNC] - UDF ERROR [UNIQUE] - SQLSTATE: %, SQLERRM: %',SQLSTATE,SQLERRM;
        RETURN NULL;
      WHEN others THEN
        RAISE WARNING '[AUDIT.IF_MODIFIED_FUNC] - UDF ERROR [OTHER] - SQLSTATE: %, SQLERRM: %',SQLSTATE,SQLERRM;
        RETURN NULL;

    END;
    $body$
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog, audit;`.execute(db);

  await sql`CREATE OR REPLACE FUNCTION pies.set_updated_at_func()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    AS $$
    BEGIN
      new."updated_at" = now();
      RETURN new;
    END;
    $$`.execute(db);

  // Create audit tables
  await db.schema
    .withSchema('audit')
    .createTable('logged_actions')
    .addColumn('id', 'integer', (col) =>
      col.primaryKey().generatedAlwaysAsIdentity()
    )
    .addColumn('schema_name', 'text', (col) => col.notNull())
    .addColumn('table_name', 'text', (col) => col.notNull())
    .addColumn('db_user', 'text', (col) => col.notNull())
    .addColumn('updated_by_username', 'text')
    .addColumn('action_timestamp', 'timestamp', (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn('action', 'text', (col) => col.notNull())
    .addColumn('original_data', 'json')
    .addColumn('new_data', 'json')
    .execute();
  await createIndex(db, 'audit', 'logged_actions', ['schema_name']);
  await createIndex(db, 'audit', 'logged_actions', ['table_name']);
  await createIndex(db, 'audit', 'logged_actions', ['action_timestamp']);
  await createIndex(db, 'audit', 'logged_actions', ['action']);

  // Create PIES tables and triggers
  await db.schema
    .withSchema('pies')
    .createTable('coding')
    .addColumn('id', 'integer', (col) =>
      col.primaryKey().generatedAlwaysAsIdentity()
    )
    .addColumn('code', 'text', (col) => col.notNull())
    .addColumn('code_display', 'text')
    .addColumn('code_set', sql`_text`, (col) => col.notNull())
    .addColumn('code_system', 'text', (col) => col.notNull())
    .addColumn('version', 'text', (col) => col.notNull())
    .addUniqueConstraint('coding_code_code_set_code_system_version_unique', [
      'code',
      'code_set',
      'code_system',
      'version'
    ])
    .$call(withTimestamps)
    .execute();
  await createIndex(db, 'pies', 'coding', ['code']);
  await createIndex(db, 'pies', 'coding', ['code_set']);
  await createUpdatedAtTrigger(db, 'pies', 'coding');
  await createAuditLogTrigger(db, 'pies', 'coding');

  await db.schema
    .withSchema('pies')
    .createTable('process_event')
    .addColumn('id', 'integer', (col) =>
      col.primaryKey().generatedAlwaysAsIdentity()
    )
    .addColumn('tx_id', 'uuid', (col) => col.notNull().unique())
    .addColumn('system_record_id', 'integer', (col) => col.notNull())
    .addColumn('start_date', 'timestamp', (col) => col.notNull())
    .addColumn('end_date', 'timestamp')
    .addColumn('is_datetime', 'boolean', (col) =>
      col.notNull().defaultTo(false)
    )
    .addColumn('coding_id', 'integer', (col) =>
      col
        .notNull()
        .references('coding.id')
        .onUpdate('cascade')
        .onDelete('cascade')
    )
    .addColumn('status', 'text')
    .addColumn('status_code', 'text')
    .addColumn('description', 'text')
    .$call(withTimestamps)
    .execute();
  await db.schema
    .withSchema('pies')
    .createIndex('process_event_system_record_id_index')
    .on('process_event')
    .columns(['system_record_id'])
    .execute();
  await createUpdatedAtTrigger(db, 'pies', 'process_event');
  await createAuditLogTrigger(db, 'pies', 'process_event');

  await db.schema
    .withSchema('pies')
    .createTable('system')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .$call(withTimestamps)
    .execute();
  await createUpdatedAtTrigger(db, 'pies', 'system');
  await createAuditLogTrigger(db, 'pies', 'system');
}

/**
 *
 * @param db Database
 */
export async function down(db: Kysely<unknown>): Promise<void> {
  // Drop PIES tables and triggers
  await dropAuditLogTrigger(db, 'pies', 'system');
  await dropUpdatedAtTrigger(db, 'pies', 'system');
  await db.schema.withSchema('pies').dropTable('system').execute();

  await dropAuditLogTrigger(db, 'pies', 'process_event');
  await dropUpdatedAtTrigger(db, 'pies', 'process_event');
  await db.schema
    .withSchema('pies')
    .dropIndex('process_event_system_record_id_index')
    .execute();
  await db.schema.withSchema('pies').dropTable('process_event').execute();

  await dropAuditLogTrigger(db, 'pies', 'coding');
  await dropUpdatedAtTrigger(db, 'pies', 'coding');
  await dropIndex(db, 'pies', 'coding', ['code_set']);
  await dropIndex(db, 'pies', 'coding', ['code']);
  await db.schema.withSchema('pies').dropTable('coding').execute();

  // Drop audit tables
  await dropIndex(db, 'audit', 'logged_actions', ['action']);
  await dropIndex(db, 'audit', 'logged_actions', ['action_timestamp']);
  await dropIndex(db, 'audit', 'logged_actions', ['table_name']);
  await dropIndex(db, 'audit', 'logged_actions', ['schema_name']);
  await db.schema.withSchema('audit').dropTable('logged_actions').execute();

  // Drop schema functions
  await sql`DROP FUNCTION IF EXISTS pies.set_updated_at_func`.execute(db);
  await sql`DROP FUNCTION IF EXISTS audit.if_modified_func`.execute(db);

  // Drop audit and pies schemas
  await db.schema.dropSchema('pies').execute();
  await db.schema.dropSchema('audit').execute();
}
