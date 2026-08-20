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
  // Drop all triggers, indexes, and foreign keys before renaming
  //

  // asset table
  await dropAuditLogTrigger(db, 'pies', 'asset');
  await dropUpdatedAtTrigger(db, 'pies', 'asset');
  await dropIndex(db, 'pies', 'asset', ['record_id']);
  await dropIndex(db, 'pies', 'asset', ['system_id']);
  await db.schema.withSchema('pies').alterTable('asset').dropConstraint('asset_record_kind_id_fkey').execute();
  await db.schema.withSchema('pies').alterTable('asset').dropConstraint('asset_system_id_fkey').execute();
  await db.schema.withSchema('pies').alterTable('asset').dropConstraint('asset_system_id_record_id_unique').execute();

  // record_kind
  await dropAuditLogTrigger(db, 'pies', 'record_kind');
  await dropUpdatedAtTrigger(db, 'pies', 'record_kind');
  await db.schema.withSchema('pies').alterTable('record_kind').dropConstraint('record_kind_version_id_fkey').execute();

  //
  // Rename record_kind to asset_kind
  //

  // Rename table and sequence
  await db.schema.withSchema('pies').alterTable('record_kind').renameTo('asset_kind').execute();
  await sql`ALTER SEQUENCE pies.record_kind_id_seq RENAME TO asset_kind_id_seq;`.execute(db);

  // Rename unique constraint
  await db.schema
    .withSchema('pies')
    .alterTable('asset_kind')
    .renameConstraint('record_kind_version_id_kind_unique', 'asset_kind_version_id_kind_unique')
    .execute();

  // Constraint rename housekeeping
  await db.schema
    .withSchema('pies')
    .alterTable('asset_kind')
    .renameConstraint('record_kind_created_at_not_null', 'asset_kind_created_at_not_null')
    .execute();
  await db.schema
    .withSchema('pies')
    .alterTable('asset_kind')
    .renameConstraint('record_kind_created_by_not_null', 'asset_kind_created_by_not_null')
    .execute();
  await db.schema
    .withSchema('pies')
    .alterTable('asset_kind')
    .renameConstraint('record_kind_id_not_null', 'asset_kind_id_not_null')
    .execute();
  await db.schema
    .withSchema('pies')
    .alterTable('asset_kind')
    .renameConstraint('record_kind_kind_not_null', 'asset_kind_kind_not_null')
    .execute();
  await db.schema
    .withSchema('pies')
    .alterTable('asset_kind')
    .renameConstraint('record_kind_pkey', 'asset_kind_pkey')
    .execute();
  await db.schema
    .withSchema('pies')
    .alterTable('asset_kind')
    .renameConstraint('record_kind_version_id_not_null', 'asset_kind_version_id_not_null')
    .execute();

  await db.schema
    .withSchema('pies')
    .alterTable('asset')
    .renameConstraint('system_record_created_at_not_null', 'asset_created_at_not_null')
    .execute();
  await db.schema
    .withSchema('pies')
    .alterTable('asset')
    .renameConstraint('system_record_created_by_not_null', 'asset_created_by_not_null')
    .execute();
  await db.schema
    .withSchema('pies')
    .alterTable('asset')
    .renameConstraint('system_record_id_not_null', 'asset_id_not_null')
    .execute();
  await db.schema
    .withSchema('pies')
    .alterTable('asset')
    .renameConstraint('system_record_record_id_not_null', 'asset_asset_id_not_null')
    .execute();
  await db.schema
    .withSchema('pies')
    .alterTable('asset')
    .renameConstraint('system_record_record_kind_id_not_null', 'asset_asset_kind_id_not_null')
    .execute();
  await db.schema
    .withSchema('pies')
    .alterTable('asset')
    .renameConstraint('system_record_system_id_not_null', 'asset_system_id_not_null')
    .execute();

  //
  // Rename asset.record_kind_id and asset.record_id columns
  //

  await db.schema.withSchema('pies').alterTable('asset').renameColumn('record_kind_id', 'asset_kind_id').execute();
  await db.schema.withSchema('pies').alterTable('asset').renameColumn('record_id', 'asset_id').execute();

  //
  // Uppercase all kind values in asset_kind
  //

  await sql`UPDATE pies.asset_kind SET kind = UPPER(kind);`.execute(db);

  //
  // Restore triggers, indexes, and foreign keys with new names
  //

  // asset table
  await createUpdatedAtTrigger(db, 'pies', 'asset');
  await createAuditLogTrigger(db, 'pies', 'asset');
  await createIndex(db, 'pies', 'asset', ['asset_id']);
  await createIndex(db, 'pies', 'asset', ['system_id']);
  await db.schema
    .withSchema('pies')
    .alterTable('asset')
    .addUniqueConstraint('asset_system_id_asset_id_unique', ['system_id', 'asset_id'])
    .execute();
  await db.schema
    .withSchema('pies')
    .alterTable('asset')
    .addForeignKeyConstraint('asset_asset_kind_id_fkey', ['asset_kind_id'], 'asset_kind', ['id'], (cb) =>
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

  // asset_kind
  await createUpdatedAtTrigger(db, 'pies', 'asset_kind');
  await createAuditLogTrigger(db, 'pies', 'asset_kind');
  await db.schema
    .withSchema('pies')
    .alterTable('asset_kind')
    .addForeignKeyConstraint('asset_kind_version_id_fkey', ['version_id'], 'version', ['id'], (cb) =>
      cb.onUpdate('cascade').onDelete('cascade')
    )
    .execute();
}

/**
 * @param db - Database
 */
export async function down(db: Kysely<unknown>): Promise<void> {
  //
  // Drop all triggers, indexes, and foreign keys before renaming
  //

  // asset table
  await dropAuditLogTrigger(db, 'pies', 'asset');
  await dropUpdatedAtTrigger(db, 'pies', 'asset');
  await dropIndex(db, 'pies', 'asset', ['asset_id']);
  await dropIndex(db, 'pies', 'asset', ['system_id']);
  await db.schema.withSchema('pies').alterTable('asset').dropConstraint('asset_asset_kind_id_fkey').execute();
  await db.schema.withSchema('pies').alterTable('asset').dropConstraint('asset_system_id_fkey').execute();
  await db.schema.withSchema('pies').alterTable('asset').dropConstraint('asset_system_id_asset_id_unique').execute();

  // asset_kind
  await dropAuditLogTrigger(db, 'pies', 'asset_kind');
  await dropUpdatedAtTrigger(db, 'pies', 'asset_kind');
  await db.schema.withSchema('pies').alterTable('asset_kind').dropConstraint('asset_kind_version_id_fkey').execute();

  //
  // Downcase all kind values back to camel case
  //

  await sql`
    UPDATE pies.asset_kind SET kind =
      CASE kind
        WHEN 'ANCHOR' THEN 'Anchor'
        WHEN 'PERMIT' THEN 'Permit'
        ELSE kind
      END;
  `.execute(db);

  //
  // Rename asset_kind back to record_kind and update columns in asset
  //

  // Rename table and sequence
  await db.schema.withSchema('pies').alterTable('asset_kind').renameTo('record_kind').execute();
  await sql`ALTER SEQUENCE pies.asset_kind_id_seq RENAME TO record_kind_id_seq;`.execute(db);

  // Rename unique constraint
  await db.schema
    .withSchema('pies')
    .alterTable('record_kind')
    .renameConstraint('asset_kind_version_id_kind_unique', 'record_kind_version_id_kind_unique')
    .execute();

  // Constraint rename housekeeping
  await db.schema
    .withSchema('pies')
    .alterTable('record_kind')
    .renameConstraint('asset_kind_created_at_not_null', 'record_kind_created_at_not_null')
    .execute();
  await db.schema
    .withSchema('pies')
    .alterTable('record_kind')
    .renameConstraint('asset_kind_created_by_not_null', 'record_kind_created_by_not_null')
    .execute();
  await db.schema
    .withSchema('pies')
    .alterTable('record_kind')
    .renameConstraint('asset_kind_id_not_null', 'record_kind_id_not_null')
    .execute();
  await db.schema
    .withSchema('pies')
    .alterTable('record_kind')
    .renameConstraint('asset_kind_kind_not_null', 'record_kind_kind_not_null')
    .execute();
  await db.schema
    .withSchema('pies')
    .alterTable('record_kind')
    .renameConstraint('asset_kind_pkey', 'record_kind_pkey')
    .execute();
  await db.schema
    .withSchema('pies')
    .alterTable('record_kind')
    .renameConstraint('asset_kind_version_id_not_null', 'record_kind_version_id_not_null')
    .execute();

  await db.schema
    .withSchema('pies')
    .alterTable('asset')
    .renameConstraint('asset_created_at_not_null', 'system_record_created_at_not_null')
    .execute();
  await db.schema
    .withSchema('pies')
    .alterTable('asset')
    .renameConstraint('asset_created_by_not_null', 'system_record_created_by_not_null')
    .execute();
  await db.schema
    .withSchema('pies')
    .alterTable('asset')
    .renameConstraint('asset_id_not_null', 'system_record_id_not_null')
    .execute();
  await db.schema
    .withSchema('pies')
    .alterTable('asset')
    .renameConstraint('asset_asset_id_not_null', 'system_record_record_id_not_null')
    .execute();
  await db.schema
    .withSchema('pies')
    .alterTable('asset')
    .renameConstraint('asset_asset_kind_id_not_null', 'system_record_record_kind_id_not_null')
    .execute();
  await db.schema
    .withSchema('pies')
    .alterTable('asset')
    .renameConstraint('asset_system_id_not_null', 'system_record_system_id_not_null')
    .execute();

  //
  // Rename asset.asset_kind_id and asset.asset_id columns
  //

  await db.schema.withSchema('pies').alterTable('asset').renameColumn('asset_kind_id', 'record_kind_id').execute();
  await db.schema.withSchema('pies').alterTable('asset').renameColumn('asset_id', 'record_id').execute();

  //
  // Restore triggers, indexes, and foreign keys with old names
  //

  // asset table
  await createUpdatedAtTrigger(db, 'pies', 'asset');
  await createAuditLogTrigger(db, 'pies', 'asset');
  await createIndex(db, 'pies', 'asset', ['record_id']);
  await createIndex(db, 'pies', 'asset', ['system_id']);
  await db.schema
    .withSchema('pies')
    .alterTable('asset')
    .addUniqueConstraint('asset_system_id_record_id_unique', ['system_id', 'record_id'])
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

  // record_kind
  await createAuditLogTrigger(db, 'pies', 'record_kind');
  await createUpdatedAtTrigger(db, 'pies', 'record_kind');
  await db.schema
    .withSchema('pies')
    .alterTable('record_kind')
    .addForeignKeyConstraint('record_kind_version_id_fkey', ['version_id'], 'version', ['id'], (cb) =>
      cb.onUpdate('cascade').onDelete('cascade')
    )
    .execute();
}
