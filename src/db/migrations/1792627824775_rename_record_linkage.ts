import { sql } from 'kysely';

import type { Kysely } from 'kysely';

import {
  createAuditLogTrigger,
  createIndex,
  createUpdatedAtTrigger,
  dropAuditLogTrigger,
  dropIndex,
  dropUpdatedAtTrigger,
  renameConstraints,
  withTimestamps
} from '#src/db/index';

const LINKAGE_CONSTRAINTS = [
  ['record_linkage_created_at_not_null', 'linkage_created_at_not_null'],
  ['record_linkage_created_by_not_null', 'linkage_created_by_not_null'],
  ['record_linkage_id_not_null', 'linkage_id_not_null'],
  ['record_linkage_linked_system_record_id_not_null', 'linkage_linked_asset_id_not_null'],
  ['record_linkage_pkey', 'linkage_pkey'],
  ['record_linkage_system_record_id_not_null', 'linkage_asset_id_not_null'],
  ['record_linkage_transaction_id_key', 'linkage_transaction_id_key'],
  ['record_linkage_transaction_id_not_null', 'linkage_transaction_id_not_null']
] as const;

/**
 * @param db - Database
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  //
  // Create relation_kind table
  //

  await db.schema
    .withSchema('pies')
    .createTable('relation_kind')
    .addColumn('id', 'integer', (col) => col.primaryKey().generatedAlwaysAsIdentity())
    .addColumn('kind', 'text', (col) => col.notNull())
    .addColumn('version_id', 'text', (col) =>
      col.notNull().references('version.id').onUpdate('cascade').onDelete('cascade')
    )
    .addUniqueConstraint('relation_kind_version_id_kind_unique', ['version_id', 'kind'])
    .$call(withTimestamps)
    .execute();
  await createUpdatedAtTrigger(db, 'pies', 'relation_kind');
  await createAuditLogTrigger(db, 'pies', 'relation_kind');

  //
  // Drop all triggers, indexes, and foreign keys before renaming
  //

  // linkage table
  await dropAuditLogTrigger(db, 'pies', 'record_linkage');
  await dropUpdatedAtTrigger(db, 'pies', 'record_linkage');
  await dropIndex(db, 'pies', 'record_linkage', ['asset_id']);
  await dropIndex(db, 'pies', 'record_linkage', ['linked_asset_id']);
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
  await db.schema
    .withSchema('pies')
    .alterTable('record_linkage')
    .dropConstraint('record_linkage_transaction_id_fkey')
    .execute();

  //
  // Rename record_linkage to linkage
  //

  // Rename table and sequence
  await db.schema.withSchema('pies').alterTable('record_linkage').renameTo('linkage').execute();
  await sql`ALTER SEQUENCE pies.record_linkage_id_seq RENAME TO linkage_id_seq;`.execute(db);

  // Rename constraints
  await renameConstraints(db, 'pies', 'linkage', LINKAGE_CONSTRAINTS);

  //
  // Add asset_group and relation_kind columns
  //

  await db.schema
    .withSchema('pies')
    .alterTable('linkage')
    .addColumn('asset_group_id', 'integer', (col) =>
      col.notNull().references('asset.id').onUpdate('cascade').onDelete('cascade')
    )
    .execute();
  await db.schema
    .withSchema('pies')
    .alterTable('linkage')
    .addColumn('relation_kind_id', 'integer', (col) =>
      col.notNull().references('relation_kind.id').onUpdate('cascade').onDelete('cascade')
    )
    .execute();

  //
  // Restore triggers, indexes, and foreign keys with new names
  //

  // asset table
  await createUpdatedAtTrigger(db, 'pies', 'linkage');
  await createAuditLogTrigger(db, 'pies', 'linkage');
  await createIndex(db, 'pies', 'linkage', ['asset_id']);
  await createIndex(db, 'pies', 'linkage', ['linked_asset_id']);
  await db.schema
    .withSchema('pies')
    .alterTable('linkage')
    .addForeignKeyConstraint('linkage_asset_id_fkey', ['asset_id'], 'asset', ['id'], (cb) =>
      cb.onUpdate('cascade').onDelete('cascade')
    )
    .execute();
  await db.schema
    .withSchema('pies')
    .alterTable('linkage')
    .addForeignKeyConstraint('linkage_linked_asset_id_fkey', ['linked_asset_id'], 'asset', ['id'], (cb) =>
      cb.onUpdate('cascade').onDelete('cascade')
    )
    .execute();
  await db.schema
    .withSchema('pies')
    .alterTable('linkage')
    .addForeignKeyConstraint('linkage_transaction_id_fkey', ['transaction_id'], 'transaction', ['id'], (cb) =>
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

  await dropAuditLogTrigger(db, 'pies', 'linkage');
  await dropUpdatedAtTrigger(db, 'pies', 'linkage');
  await dropIndex(db, 'pies', 'linkage', ['asset_id']);
  await dropIndex(db, 'pies', 'linkage', ['linked_asset_id']);
  await db.schema.withSchema('pies').alterTable('linkage').dropConstraint('linkage_asset_id_fkey').execute();
  await db.schema.withSchema('pies').alterTable('linkage').dropConstraint('linkage_linked_asset_id_fkey').execute();
  await db.schema.withSchema('pies').alterTable('linkage').dropConstraint('linkage_transaction_id_fkey').execute();

  //
  // Remove asset_group and relation_kind columns
  //

  await db.schema.withSchema('pies').alterTable('linkage').dropColumn('relation_kind_id').execute();
  await db.schema.withSchema('pies').alterTable('linkage').dropColumn('asset_group_id').execute();

  //
  // Rename linkage back to record_linkage
  //

  await db.schema.withSchema('pies').alterTable('linkage').renameTo('record_linkage').execute();
  await sql`ALTER SEQUENCE pies.linkage_id_seq RENAME TO record_linkage_id_seq;`.execute(db);

  const invert = (pairs: readonly (readonly [string, string])[]): readonly (readonly [string, string])[] =>
    pairs.map(([from, to]) => [to, from]);

  await renameConstraints(db, 'pies', 'record_linkage', invert(LINKAGE_CONSTRAINTS));

  //
  // Restore triggers, indexes, and foreign keys with old names
  //

  await createUpdatedAtTrigger(db, 'pies', 'record_linkage');
  await createAuditLogTrigger(db, 'pies', 'record_linkage');
  await createIndex(db, 'pies', 'record_linkage', ['asset_id']);
  await createIndex(db, 'pies', 'record_linkage', ['linked_asset_id']);
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
  await db.schema
    .withSchema('pies')
    .alterTable('record_linkage')
    .addForeignKeyConstraint('record_linkage_transaction_id_fkey', ['transaction_id'], 'transaction', ['id'], (cb) =>
      cb.onUpdate('cascade').onDelete('cascade')
    )
    .execute();

  //
  // Drop relation_kind table
  //

  await dropAuditLogTrigger(db, 'pies', 'relation_kind');
  await dropUpdatedAtTrigger(db, 'pies', 'relation_kind');
  await db.schema.withSchema('pies').dropTable('relation_kind').execute();
}
