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
  //
  // Drop all triggers, indexes, constraints and foreign keys before renaming
  //

  // asset/system_record
  await dropAuditLogTrigger(db, 'pies', 'system_record');
  await dropUpdatedAtTrigger(db, 'pies', 'system_record');
  await dropIndex(db, 'pies', 'system_record', ['record_id']);
  await dropIndex(db, 'pies', 'system_record', ['system_id']);
  await db.schema
    .withSchema('pies')
    .alterTable('system_record')
    .dropConstraint('system_record_record_kind_id_fkey')
    .execute();
  await db.schema
    .withSchema('pies')
    .alterTable('system_record')
    .dropConstraint('system_record_system_id_fkey')
    .execute();

  // on_hold_event
  await dropIndex(db, 'pies', 'on_hold_event', ['system_record_id']);
  await db.schema
    .withSchema('pies')
    .alterTable('on_hold_event')
    .dropConstraint('on_hold_event_coding_id_fkey')
    .execute();
  await db.schema
    .withSchema('pies')
    .alterTable('on_hold_event')
    .dropConstraint('on_hold_event_transaction_id_fkey')
    .execute();
  await db.schema
    .withSchema('pies')
    .alterTable('on_hold_event')
    .dropConstraint('on_hold_event_system_record_id_fkey')
    .execute();

  // process_event
  await dropIndex(db, 'pies', 'process_event', ['system_record_id']);
  await db.schema
    .withSchema('pies')
    .alterTable('process_event')
    .dropConstraint('process_event_coding_id_fkey')
    .execute();
  await db.schema
    .withSchema('pies')
    .alterTable('process_event')
    .dropConstraint('process_event_transaction_id_fkey')
    .execute();
  await db.schema
    .withSchema('pies')
    .alterTable('process_event')
    .dropConstraint('process_event_system_record_id_fkey')
    .execute();

  // record_linkage
  await dropIndex(db, 'pies', 'record_linkage', ['linked_system_record_id']);
  await dropIndex(db, 'pies', 'record_linkage', ['system_record_id']);
  await db.schema.withSchema('pies').dropIndex('record_linkage_undirected').ifExists().execute();
  await db.schema
    .withSchema('pies')
    .alterTable('record_linkage')
    .dropConstraint('record_linkage_linked_system_record_id_fkey')
    .execute();
  await db.schema
    .withSchema('pies')
    .alterTable('record_linkage')
    .dropConstraint('record_linkage_system_record_id_fkey')
    .execute();

  //
  // Rename system_record to asset and update column names in dependent tables
  //

  // asset/system_record
  await db.schema.withSchema('pies').alterTable('system_record').renameTo('asset').execute();
  await sql`ALTER SEQUENCE pies.system_record_id_seq RENAME TO asset_id_seq;`.execute(db);

  // on_hold_event
  await db.schema.withSchema('pies').alterTable('on_hold_event').renameColumn('system_record_id', 'asset_id').execute();

  // process_event
  await db.schema.withSchema('pies').alterTable('process_event').renameColumn('system_record_id', 'asset_id').execute();

  // record_linkage
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

  //
  // Restore all triggers, indexes, constraints and foreign keys, triggers with new names
  //

  // asset/system_record
  await createUpdatedAtTrigger(db, 'pies', 'asset');
  await createAuditLogTrigger(db, 'pies', 'asset');
  await createIndex(db, 'pies', 'asset', ['record_id']);
  await createIndex(db, 'pies', 'asset', ['system_id']);
  await db.schema.withSchema('pies').alterTable('asset').renameConstraint('system_record_pkey', 'asset_pkey').execute();
  await db.schema
    .withSchema('pies')
    .alterTable('asset')
    .renameConstraint('system_record_system_id_record_id_unique', 'asset_system_id_record_id_unique')
    .execute();
  await db.schema
    .withSchema('pies')
    .alterTable('asset')
    .addForeignKeyConstraint('asset_record_kind_id_fkey', ['record_kind_id'], 'record_kind', ['id'], (cb) =>
      cb.onUpdate('cascade').onDelete('cascade')
    )
    .execute();
  await db.schema
    .withSchema('pies')
    .alterTable('asset')
    .addForeignKeyConstraint('asset_system_id_fkey', ['system_id'], 'system', ['id'], (cb) =>
      cb.onUpdate('cascade').onDelete('cascade')
    )
    .execute();

  // on_hold_event
  await createIndex(db, 'pies', 'on_hold_event', ['asset_id']);
  await db.schema
    .withSchema('pies')
    .alterTable('on_hold_event')
    .addForeignKeyConstraint('on_hold_event_asset_id_fkey', ['asset_id'], 'asset', ['id'], (cb) =>
      cb.onUpdate('cascade').onDelete('cascade')
    )
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
    .addForeignKeyConstraint('on_hold_event_transaction_id_fkey', ['transaction_id'], 'transaction', ['id'], (cb) =>
      cb.onUpdate('cascade').onDelete('restrict')
    )
    .execute();

  // process_event
  await createIndex(db, 'pies', 'process_event', ['asset_id']);
  await db.schema
    .withSchema('pies')
    .alterTable('process_event')
    .addForeignKeyConstraint('process_event_asset_id_fkey', ['asset_id'], 'asset', ['id'], (cb) =>
      cb.onUpdate('cascade').onDelete('cascade')
    )
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
    .addForeignKeyConstraint('process_event_transaction_id_fkey', ['transaction_id'], 'transaction', ['id'], (cb) =>
      cb.onUpdate('cascade').onDelete('restrict')
    )
    .execute();

  // record_linkage
  await createIndex(db, 'pies', 'record_linkage', ['linked_asset_id']);
  await createIndex(db, 'pies', 'record_linkage', ['asset_id']);
  await sql`
    CREATE UNIQUE INDEX record_linkage_undirected
    ON pies.record_linkage (
      LEAST(asset_id, linked_asset_id),
      GREATEST(asset_id, linked_asset_id)
    );
  `.execute(db);
  await db.schema
    .withSchema('pies')
    .alterTable('record_linkage')
    .addForeignKeyConstraint('record_linkage_asset_id_fkey', ['asset_id'], 'asset', ['id'], (cb) =>
      cb.onUpdate('cascade').onDelete('cascade')
    )
    .execute();
  await db.schema
    .withSchema('pies')
    .alterTable('record_linkage')
    .addForeignKeyConstraint('record_linkage_linked_asset_id_fkey', ['linked_asset_id'], 'asset', ['id'], (cb) =>
      cb.onUpdate('cascade').onDelete('cascade')
    )
    .execute();
}

/**
 * @param db - Database
 */
export async function down(db: Kysely<unknown>): Promise<void> {
  //
  // Drop all triggers, indexes, constraints and foreign keys before renaming
  //

  // asset/system_record
  await dropAuditLogTrigger(db, 'pies', 'asset');
  await dropUpdatedAtTrigger(db, 'pies', 'asset');
  await dropIndex(db, 'pies', 'asset', ['system_id']);
  await dropIndex(db, 'pies', 'asset', ['record_id']);
  await db.schema.withSchema('pies').alterTable('asset').dropConstraint('asset_record_kind_id_fkey').execute();
  await db.schema.withSchema('pies').alterTable('asset').dropConstraint('asset_system_id_fkey').execute();

  // on_hold_event
  await dropIndex(db, 'pies', 'on_hold_event', ['asset_id']);
  await db.schema
    .withSchema('pies')
    .alterTable('on_hold_event')
    .dropConstraint('on_hold_event_asset_id_fkey')
    .execute();
  await db.schema
    .withSchema('pies')
    .alterTable('on_hold_event')
    .dropConstraint('on_hold_event_coding_id_fkey')
    .execute();
  await db.schema
    .withSchema('pies')
    .alterTable('on_hold_event')
    .dropConstraint('on_hold_event_transaction_id_fkey')
    .execute();

  // process_event
  await dropIndex(db, 'pies', 'process_event', ['asset_id']);
  await db.schema
    .withSchema('pies')
    .alterTable('process_event')
    .dropConstraint('process_event_asset_id_fkey')
    .execute();
  await db.schema
    .withSchema('pies')
    .alterTable('process_event')
    .dropConstraint('process_event_coding_id_fkey')
    .execute();
  await db.schema
    .withSchema('pies')
    .alterTable('process_event')
    .dropConstraint('process_event_transaction_id_fkey')
    .execute();

  // record_linkage
  await dropIndex(db, 'pies', 'record_linkage', ['linked_asset_id']);
  await dropIndex(db, 'pies', 'record_linkage', ['asset_id']);
  await db.schema.withSchema('pies').dropIndex('record_linkage_undirected').ifExists().execute();
  await db.schema
    .withSchema('pies')
    .alterTable('record_linkage')
    .dropConstraint('record_linkage_asset_id_fkey')
    .execute();
  await db.schema
    .withSchema('pies')
    .alterTable('record_linkage')
    .dropConstraint('record_linkage_linked_asset_id_fkey')
    .execute();

  //
  // Restore asset to system_record to and update column names in dependent tables
  //

  // asset/system_record
  await db.schema.withSchema('pies').alterTable('asset').renameTo('system_record').execute();
  await sql`ALTER SEQUENCE pies.asset_id_seq RENAME TO system_record_id_seq;`.execute(db);

  // on_hold_event
  await db.schema.withSchema('pies').alterTable('on_hold_event').renameColumn('asset_id', 'system_record_id').execute();

  // process_event
  await db.schema.withSchema('pies').alterTable('process_event').renameColumn('asset_id', 'system_record_id').execute();

  // record_linkage
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

  //
  // Restore all triggers, indexes, constraints and foreign keys, triggers with old names
  //

  // asset/system_record
  await createAuditLogTrigger(db, 'pies', 'system_record');
  await createUpdatedAtTrigger(db, 'pies', 'system_record');
  await createIndex(db, 'pies', 'system_record', ['system_id']);
  await createIndex(db, 'pies', 'system_record', ['record_id']);
  await db.schema
    .withSchema('pies')
    .alterTable('system_record')
    .renameConstraint('asset_pkey', 'system_record_pkey')
    .execute();
  await db.schema
    .withSchema('pies')
    .alterTable('system_record')
    .renameConstraint('asset_system_id_record_id_unique', 'system_record_system_id_record_id_unique')
    .execute();
  await db.schema
    .withSchema('pies')
    .alterTable('system_record')
    .addForeignKeyConstraint('system_record_record_kind_id_fkey', ['record_kind_id'], 'record_kind', ['id'], (cb) =>
      cb.onUpdate('cascade').onDelete('cascade')
    )
    .execute();
  await db.schema
    .withSchema('pies')
    .alterTable('system_record')
    .addForeignKeyConstraint('system_record_system_id_fkey', ['system_id'], 'system', ['id'], (cb) =>
      cb.onUpdate('cascade').onDelete('cascade')
    )
    .execute();

  // on_hold_event
  await createIndex(db, 'pies', 'on_hold_event', ['system_record_id']);
  await db.schema
    .withSchema('pies')
    .alterTable('on_hold_event')
    .addForeignKeyConstraint('on_hold_event_coding_id_fkey', ['coding_id'], 'coding', ['id'], (cb) =>
      cb.onUpdate('cascade').onDelete('cascade')
    )
    .execute();
  await db.schema
    .withSchema('pies')
    .alterTable('on_hold_event')
    .addForeignKeyConstraint(
      'on_hold_event_system_record_id_fkey',
      ['system_record_id'],
      'system_record',
      ['id'],
      (cb) => cb.onUpdate('cascade').onDelete('cascade')
    )
    .execute();
  await db.schema
    .withSchema('pies')
    .alterTable('on_hold_event')
    .addForeignKeyConstraint('on_hold_event_transaction_id_fkey', ['transaction_id'], 'transaction', ['id'], (cb) =>
      cb.onUpdate('cascade').onDelete('cascade')
    )
    .execute();

  // process_event
  await createIndex(db, 'pies', 'process_event', ['system_record_id']);
  await db.schema
    .withSchema('pies')
    .alterTable('process_event')
    .addForeignKeyConstraint('process_event_coding_id_fkey', ['coding_id'], 'coding', ['id'], (cb) =>
      cb.onUpdate('cascade').onDelete('cascade')
    )
    .execute();
  await db.schema
    .withSchema('pies')
    .alterTable('process_event')
    .addForeignKeyConstraint(
      'process_event_system_record_id_fkey',
      ['system_record_id'],
      'system_record',
      ['id'],
      (cb) => cb.onUpdate('cascade').onDelete('cascade')
    )
    .execute();
  await db.schema
    .withSchema('pies')
    .alterTable('process_event')
    .addForeignKeyConstraint('process_event_transaction_id_fkey', ['transaction_id'], 'transaction', ['id'], (cb) =>
      cb.onUpdate('cascade').onDelete('cascade')
    )
    .execute();

  // record_linkage
  await createIndex(db, 'pies', 'record_linkage', ['linked_system_record_id']);
  await createIndex(db, 'pies', 'record_linkage', ['system_record_id']);
  await sql`
    CREATE UNIQUE INDEX record_linkage_undirected
    ON pies.record_linkage (
      LEAST(system_record_id, linked_system_record_id),
      GREATEST(system_record_id, linked_system_record_id)
    );
  `.execute(db);
  await db.schema
    .withSchema('pies')
    .alterTable('record_linkage')
    .addForeignKeyConstraint(
      'record_linkage_system_record_id_fkey',
      ['system_record_id'],
      'system_record',
      ['id'],
      (cb) => cb.onUpdate('cascade').onDelete('cascade')
    )
    .execute();
  await db.schema
    .withSchema('pies')
    .alterTable('record_linkage')
    .addForeignKeyConstraint(
      'record_linkage_linked_system_record_id_fkey',
      ['linked_system_record_id'],
      'system_record',
      ['id'],
      (cb) => cb.onUpdate('cascade').onDelete('cascade')
    )
    .execute();
}
