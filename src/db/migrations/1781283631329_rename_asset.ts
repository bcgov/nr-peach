import { sql } from 'kysely';

import type { Kysely } from 'kysely';

import {
  createAuditLogTrigger,
  createIndex,
  createUpdatedAtTrigger,
  dropAuditLogTrigger,
  dropIndex,
  dropUpdatedAtTrigger
} from '#src/db/index';

/**
 * @param db - Database
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  // Drop asset triggers and indexes before renaming
  await dropAuditLogTrigger(db, 'pies', 'system_record');
  await dropUpdatedAtTrigger(db, 'pies', 'system_record');
  await dropIndex(db, 'pies', 'system_record', ['record_id']);
  await dropIndex(db, 'pies', 'system_record', ['system_id']);

  // Rename the main table and its unique constraint
  await db.schema.withSchema('pies').alterTable('system_record').renameTo('asset').execute();
  await db.schema
    .withSchema('pies')
    .alterTable('asset')
    .renameConstraint('system_record_system_id_record_id_unique', 'asset_system_id_record_id_unique')
    .execute();

  // Recreate asset triggers and indexes
  await createUpdatedAtTrigger(db, 'pies', 'asset');
  await createAuditLogTrigger(db, 'pies', 'asset');
  await createIndex(db, 'pies', 'asset', ['record_id']);
  await createIndex(db, 'pies', 'asset', ['system_id']);

  // Drop dependent index that uses old column names
  await db.schema.withSchema('pies').dropIndex('record_linkage_undirected').ifExists().execute();

  // Rename foreign key columns in dependent tables
  await db.schema.withSchema('pies').alterTable('on_hold_event').renameColumn('system_record_id', 'asset_id').execute();
  await db.schema.withSchema('pies').alterTable('process_event').renameColumn('system_record_id', 'asset_id').execute();
  await db.schema
    .withSchema('pies')
    .alterTable('record_linkage')
    .renameColumn('system_record_id', 'asset_id')
    .execute();
  await db.schema
    .withSchema('pies')
    .alterTable('record_linkage')
    .renameColumn('linked_system_record_id', 'linked_asset_id')
    .execute();

  // Recreate the unique undirected index with new column names
  await sql`
    CREATE UNIQUE INDEX record_linkage_undirected
    ON pies.record_linkage (
      LEAST(asset_id, linked_asset_id),
      GREATEST(asset_id, linked_asset_id)
    );
  `.execute(db);

  // Update on_hold_event constraints from CASCADE to RESTRICT
  await db.schema
    .withSchema('pies')
    .alterTable('on_hold_event')
    .dropConstraint('on_hold_event_coding_id_fkey')
    .execute();
  await db.schema
    .withSchema('pies')
    .alterTable('on_hold_event')
    .addForeignKeyConstraint('on_hold_event_coding_id_fkey', ['coding_id'], 'coding', ['id'], (cb) =>
      cb.onUpdate('cascade').onDelete('restrict')
    )
    .execute();

  await db.schema
    .withSchema('pies')
    .alterTable('on_hold_event')
    .dropConstraint('on_hold_event_transaction_id_fkey')
    .execute();
  await db.schema
    .withSchema('pies')
    .alterTable('on_hold_event')
    .addForeignKeyConstraint('on_hold_event_transaction_id_fkey', ['transaction_id'], 'transaction', ['id'], (cb) =>
      cb.onUpdate('cascade').onDelete('restrict')
    )
    .execute();

  // Update process_event constraints from CASCADE to RESTRICT
  await db.schema
    .withSchema('pies')
    .alterTable('process_event')
    .dropConstraint('process_event_coding_id_fkey')
    .execute();
  await db.schema
    .withSchema('pies')
    .alterTable('process_event')
    .addForeignKeyConstraint('process_event_coding_id_fkey', ['coding_id'], 'coding', ['id'], (cb) =>
      cb.onUpdate('cascade').onDelete('restrict')
    )
    .execute();

  await db.schema
    .withSchema('pies')
    .alterTable('process_event')
    .dropConstraint('process_event_transaction_id_fkey')
    .execute();
  await db.schema
    .withSchema('pies')
    .alterTable('process_event')
    .addForeignKeyConstraint('process_event_transaction_id_fkey', ['transaction_id'], 'transaction', ['id'], (cb) =>
      cb.onUpdate('cascade').onDelete('restrict')
    )
    .execute();
}

/**
 * @param db - Database
 */
export async function down(db: Kysely<unknown>): Promise<void> {
  // Restore process_event constraints to CASCADE on delete
  await db.schema
    .withSchema('pies')
    .alterTable('process_event')
    .dropConstraint('process_event_transaction_id_fkey')
    .execute();
  await db.schema
    .withSchema('pies')
    .alterTable('process_event')
    .addForeignKeyConstraint('process_event_transaction_id_fkey', ['transaction_id'], 'transaction', ['id'], (cb) =>
      cb.onUpdate('cascade').onDelete('cascade')
    )
    .execute();

  await db.schema
    .withSchema('pies')
    .alterTable('process_event')
    .dropConstraint('process_event_coding_id_fkey')
    .execute();
  await db.schema
    .withSchema('pies')
    .alterTable('process_event')
    .addForeignKeyConstraint('process_event_coding_id_fkey', ['coding_id'], 'coding', ['id'], (cb) =>
      cb.onUpdate('cascade').onDelete('cascade')
    )
    .execute();

  // Restore on_hold_event constraints to CASCADE on delete
  await db.schema
    .withSchema('pies')
    .alterTable('on_hold_event')
    .dropConstraint('on_hold_event_transaction_id_fkey')
    .execute();
  await db.schema
    .withSchema('pies')
    .alterTable('on_hold_event')
    .addForeignKeyConstraint('on_hold_event_transaction_id_fkey', ['transaction_id'], 'transaction', ['id'], (cb) =>
      cb.onUpdate('cascade').onDelete('cascade')
    )
    .execute();

  await db.schema
    .withSchema('pies')
    .alterTable('on_hold_event')
    .dropConstraint('on_hold_event_coding_id_fkey')
    .execute();
  await db.schema
    .withSchema('pies')
    .alterTable('on_hold_event')
    .addForeignKeyConstraint('on_hold_event_coding_id_fkey', ['coding_id'], 'coding', ['id'], (cb) =>
      cb.onUpdate('cascade').onDelete('cascade')
    )
    .execute();

  // Drop the new undirected index
  await db.schema.withSchema('pies').dropIndex('record_linkage_undirected').ifExists().execute();

  // Revert column renames in dependent tables
  await db.schema
    .withSchema('pies')
    .alterTable('record_linkage')
    .renameColumn('linked_asset_id', 'linked_system_record_id')
    .execute();
  await db.schema
    .withSchema('pies')
    .alterTable('record_linkage')
    .renameColumn('asset_id', 'system_record_id')
    .execute();

  await db.schema.withSchema('pies').alterTable('process_event').renameColumn('asset_id', 'system_record_id').execute();
  await db.schema.withSchema('pies').alterTable('on_hold_event').renameColumn('asset_id', 'system_record_id').execute();

  // Recreate the old unique undirected index
  await sql`
    CREATE UNIQUE INDEX record_linkage_undirected
    ON pies.record_linkage (
      LEAST(system_record_id, linked_system_record_id),
      GREATEST(system_record_id, linked_system_record_id)
    );
  `.execute(db);

  // Drop asset triggers and indexes using the new names
  await dropAuditLogTrigger(db, 'pies', 'asset');
  await dropUpdatedAtTrigger(db, 'pies', 'asset');
  await dropIndex(db, 'pies', 'asset', ['system_id']);
  await dropIndex(db, 'pies', 'asset', ['record_id']);

  // Rename constraint and table back to system_record
  await db.schema
    .withSchema('pies')
    .alterTable('asset')
    .renameConstraint('asset_system_id_record_id_unique', 'system_record_system_id_record_id_unique')
    .execute();
  await db.schema.withSchema('pies').alterTable('asset').renameTo('system_record').execute();

  // Recreate original triggers and indexes
  await createAuditLogTrigger(db, 'pies', 'system_record');
  await createUpdatedAtTrigger(db, 'pies', 'system_record');
  await createIndex(db, 'pies', 'system_record', ['system_id']);
  await createIndex(db, 'pies', 'system_record', ['record_id']);
}
