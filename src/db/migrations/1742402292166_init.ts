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
  //
  // Create audit and pies schemas
  //
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

  //
  // Create audit tables
  //

  // audit.logged_actions
  await db.schema
    .withSchema('audit')
    .createTable('logged_actions')
    .addColumn('id', 'integer', (col) => col.primaryKey().generatedAlwaysAsIdentity())
    .addColumn('schema_name', 'text', (col) => col.notNull())
    .addColumn('table_name', 'text', (col) => col.notNull())
    .addColumn('db_user', 'text', (col) => col.notNull())
    .addColumn('updated_by_username', 'text')
    .addColumn('action_timestamp', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('action', 'text', (col) => col.notNull())
    .addColumn('original_data', 'json')
    .addColumn('new_data', 'json')
    .execute();
  await createIndex(db, 'audit', 'logged_actions', ['schema_name']);
  await createIndex(db, 'audit', 'logged_actions', ['table_name']);
  await createIndex(db, 'audit', 'logged_actions', ['action_timestamp']);
  await createIndex(db, 'audit', 'logged_actions', ['action']);

  //
  // Create PIES tables and triggers
  //

  // pies.system
  await db.schema
    .withSchema('pies')
    .createTable('system')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .$call(withTimestamps)
    .execute();
  await createUpdatedAtTrigger(db, 'pies', 'system');
  await createAuditLogTrigger(db, 'pies', 'system');

  // pies.transaction
  await db.schema
    .withSchema('pies')
    .createTable('transaction')
    .addColumn('id', 'uuid', (col) => col.primaryKey())
    .$call(withTimestamps)
    .execute();
  await createUpdatedAtTrigger(db, 'pies', 'transaction');
  await createAuditLogTrigger(db, 'pies', 'transaction');

  // pies.version
  await db.schema
    .withSchema('pies')
    .createTable('version')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .$call(withTimestamps)
    .execute();
  await createUpdatedAtTrigger(db, 'pies', 'version');
  await createAuditLogTrigger(db, 'pies', 'version');

  // pies.coding
  await db.schema
    .withSchema('pies')
    .createTable('coding')
    .addColumn('id', 'integer', (col) => col.primaryKey().generatedAlwaysAsIdentity())
    .addColumn('code', 'text', (col) => col.notNull())
    .addColumn('code_system', 'text', (col) => col.notNull())
    .addColumn('version_id', 'text', (col) =>
      col.notNull().references('version.id').onUpdate('cascade').onDelete('cascade')
    )
    .addUniqueConstraint('coding_code_code_system_version_id_unique', ['code', 'code_system', 'version_id'])
    .$call(withTimestamps)
    .execute();
  await createIndex(db, 'pies', 'coding', ['code']);
  await createUpdatedAtTrigger(db, 'pies', 'coding');
  await createAuditLogTrigger(db, 'pies', 'coding');

  // pies.record_kind
  await db.schema
    .withSchema('pies')
    .createTable('record_kind')
    .addColumn('id', 'integer', (col) => col.primaryKey().generatedAlwaysAsIdentity())
    .addColumn('kind', 'text', (col) => col.notNull())
    .addColumn('version_id', 'text', (col) =>
      col.notNull().references('version.id').onUpdate('cascade').onDelete('cascade')
    )
    .addUniqueConstraint('record_kind_version_id_kind_unique', ['version_id', 'kind'])
    .$call(withTimestamps)
    .execute();
  await createUpdatedAtTrigger(db, 'pies', 'record_kind');
  await createAuditLogTrigger(db, 'pies', 'record_kind');

  // pies.system_record
  await db.schema
    .withSchema('pies')
    .createTable('system_record')
    .addColumn('id', 'integer', (col) => col.primaryKey().generatedAlwaysAsIdentity())
    .addColumn('system_id', 'text', (col) =>
      col.notNull().references('system.id').onUpdate('cascade').onDelete('cascade')
    )
    .addColumn('record_id', 'text', (col) => col.notNull())
    .addColumn('record_kind_id', 'integer', (col) =>
      col.notNull().references('record_kind.id').onUpdate('cascade').onDelete('cascade')
    )
    .addUniqueConstraint('system_record_system_id_record_id_unique', ['system_id', 'record_id'])
    .$call(withTimestamps)
    .execute();
  await createIndex(db, 'pies', 'system_record', ['record_id']);
  await createIndex(db, 'pies', 'system_record', ['system_id']);
  await createUpdatedAtTrigger(db, 'pies', 'system_record');
  await createAuditLogTrigger(db, 'pies', 'system_record');

  // pies.on_hold_event
  await db.schema
    .withSchema('pies')
    .createTable('on_hold_event')
    .addColumn('id', 'integer', (col) => col.primaryKey().generatedAlwaysAsIdentity())
    .addColumn('transaction_id', 'uuid', (col) =>
      col.notNull().references('transaction.id').onUpdate('cascade').onDelete('cascade')
    )
    .addColumn('system_record_id', 'integer', (col) =>
      col.notNull().references('system_record.id').onUpdate('cascade').onDelete('cascade')
    )
    .addColumn('start_date', 'date', (col) => col.notNull())
    .addColumn('start_time', 'timetz')
    .addColumn('end_date', 'date')
    .addColumn('end_time', 'timetz')
    .addColumn('coding_id', 'integer', (col) =>
      col.notNull().references('coding.id').onUpdate('cascade').onDelete('cascade')
    )
    .$call(withTimestamps)
    .execute();
  await createIndex(db, 'pies', 'on_hold_event', ['system_record_id']);
  await createUpdatedAtTrigger(db, 'pies', 'on_hold_event');
  await createAuditLogTrigger(db, 'pies', 'on_hold_event');

  // pies.process_event
  await db.schema
    .withSchema('pies')
    .createTable('process_event')
    .addColumn('id', 'integer', (col) => col.primaryKey().generatedAlwaysAsIdentity())
    .addColumn('transaction_id', 'uuid', (col) =>
      col.notNull().references('transaction.id').onUpdate('cascade').onDelete('cascade')
    )
    .addColumn('system_record_id', 'integer', (col) =>
      col.notNull().references('system_record.id').onUpdate('cascade').onDelete('cascade')
    )
    .addColumn('start_date', 'date', (col) => col.notNull())
    .addColumn('start_time', 'timetz')
    .addColumn('end_date', 'date')
    .addColumn('end_time', 'timetz')
    .addColumn('coding_id', 'integer', (col) =>
      col.notNull().references('coding.id').onUpdate('cascade').onDelete('cascade')
    )
    .addColumn('status', 'text')
    .addColumn('status_code', 'text')
    .addColumn('status_description', 'text')
    .$call(withTimestamps)
    .execute();
  await createIndex(db, 'pies', 'process_event', ['system_record_id']);
  await createUpdatedAtTrigger(db, 'pies', 'process_event');
  await createAuditLogTrigger(db, 'pies', 'process_event');

  // pies.record_linkage
  await db.schema
    .withSchema('pies')
    .createTable('record_linkage')
    .addColumn('id', 'integer', (col) => col.primaryKey().generatedAlwaysAsIdentity())
    .addColumn('transaction_id', 'uuid', (col) =>
      col.notNull().unique().references('transaction.id').onUpdate('cascade').onDelete('cascade')
    )
    .addColumn('system_record_id', 'integer', (col) =>
      col.notNull().references('system_record.id').onUpdate('cascade').onDelete('cascade')
    )
    .addColumn('linked_system_record_id', 'integer', (col) =>
      col.notNull().references('system_record.id').onUpdate('cascade').onDelete('cascade')
    )
    .addUniqueConstraint('record_linkage_forward_unique', ['system_record_id', 'linked_system_record_id'])
    .addUniqueConstraint('record_linkage_reverse_unique', ['linked_system_record_id', 'system_record_id'])
    .$call(withTimestamps)
    .execute();
  await createIndex(db, 'pies', 'record_linkage', ['system_record_id']);
  await createIndex(db, 'pies', 'record_linkage', ['linked_system_record_id']);
  await createUpdatedAtTrigger(db, 'pies', 'record_linkage');
  await createAuditLogTrigger(db, 'pies', 'record_linkage');
}

/**
 *
 * @param db Database
 */
export async function down(db: Kysely<unknown>): Promise<void> {
  //
  // Drop PIES tables and triggers
  //

  // pies.record_linkage
  await dropAuditLogTrigger(db, 'pies', 'record_linkage');
  await dropUpdatedAtTrigger(db, 'pies', 'record_linkage');
  await dropIndex(db, 'pies', 'record_linkage', ['linked_system_record_id']);
  await dropIndex(db, 'pies', 'record_linkage', ['system_record_id']);
  await db.schema.withSchema('pies').dropTable('record_linkage').execute();

  // pies.process_event
  await dropAuditLogTrigger(db, 'pies', 'process_event');
  await dropUpdatedAtTrigger(db, 'pies', 'process_event');
  await dropIndex(db, 'pies', 'process_event', ['system_record_id']);
  await db.schema.withSchema('pies').dropTable('process_event').execute();

  // pies.on_hold_event
  await dropAuditLogTrigger(db, 'pies', 'on_hold_event');
  await dropUpdatedAtTrigger(db, 'pies', 'on_hold_event');
  await dropIndex(db, 'pies', 'on_hold_event', ['system_record_id']);
  await db.schema.withSchema('pies').dropTable('on_hold_event').execute();

  // pies.system_record
  await dropAuditLogTrigger(db, 'pies', 'system_record');
  await dropUpdatedAtTrigger(db, 'pies', 'system_record');
  await db.schema.withSchema('pies').dropTable('system_record').execute();

  // pies.record_kind
  await dropAuditLogTrigger(db, 'pies', 'record_kind');
  await dropUpdatedAtTrigger(db, 'pies', 'record_kind');
  await db.schema.withSchema('pies').dropTable('record_kind').execute();

  // pies.coding
  await dropAuditLogTrigger(db, 'pies', 'coding');
  await dropUpdatedAtTrigger(db, 'pies', 'coding');
  await dropIndex(db, 'pies', 'coding', ['code']);
  await db.schema.withSchema('pies').dropTable('coding').execute();

  // pies.version
  await dropAuditLogTrigger(db, 'pies', 'version');
  await dropUpdatedAtTrigger(db, 'pies', 'version');
  await db.schema.withSchema('pies').dropTable('version').execute();

  // pies.transaction
  await dropAuditLogTrigger(db, 'pies', 'transaction');
  await dropUpdatedAtTrigger(db, 'pies', 'transaction');
  await db.schema.withSchema('pies').dropTable('transaction').execute();

  // pies.system
  await dropAuditLogTrigger(db, 'pies', 'system');
  await dropUpdatedAtTrigger(db, 'pies', 'system');
  await db.schema.withSchema('pies').dropTable('system').execute();

  //
  // Drop audit tables
  //

  // audit.logged_actions
  await dropIndex(db, 'audit', 'logged_actions', ['action']);
  await dropIndex(db, 'audit', 'logged_actions', ['action_timestamp']);
  await dropIndex(db, 'audit', 'logged_actions', ['table_name']);
  await dropIndex(db, 'audit', 'logged_actions', ['schema_name']);
  await db.schema.withSchema('audit').dropTable('logged_actions').execute();

  // Drop schema functions
  await sql`DROP FUNCTION IF EXISTS pies.set_updated_at_func`.execute(db);
  await sql`DROP FUNCTION IF EXISTS audit.if_modified_func`.execute(db);

  //
  // Drop audit and pies schemas
  //
  await db.schema.dropSchema('pies').execute();
  await db.schema.dropSchema('audit').execute();
}
