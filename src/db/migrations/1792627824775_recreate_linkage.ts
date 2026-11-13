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
} from '#src/db/index';

/**
 * @param db - Database
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  //
  // Drop record_linkage table
  //

  await dropAuditLogTrigger(db, 'pies', 'record_linkage');
  await dropUpdatedAtTrigger(db, 'pies', 'record_linkage');
  await dropIndex(db, 'pies', 'record_linkage', ['asset_id']);
  await dropIndex(db, 'pies', 'record_linkage', ['linked_asset_id']);
  await dropIndex(db, 'pies', 'record_linkage', ['record_linkage_undirected']);
  await db.schema.withSchema('pies').dropTable('record_linkage').execute();

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
  // Create linkage table
  //

  await db.schema
    .withSchema('pies')
    .createTable('linkage')
    .addColumn('id', 'integer', (col) => col.primaryKey().generatedAlwaysAsIdentity())
    .addColumn('transaction_id', 'uuid', (col) =>
      col.notNull().unique().references('transaction.id').onUpdate('cascade').onDelete('cascade')
    )
    .addColumn('asset_id', 'integer', (col) =>
      col.notNull().references('asset.id').onUpdate('cascade').onDelete('cascade')
    )
    .addColumn('linked_asset_id', 'integer', (col) =>
      col.notNull().references('asset.id').onUpdate('cascade').onDelete('cascade')
    )
    .addColumn('asset_group_id', 'integer', (col) =>
      col.notNull().references('asset.id').onUpdate('cascade').onDelete('cascade')
    )
    .addColumn('relation_kind_id', 'integer', (col) =>
      col.notNull().references('relation_kind.id').onUpdate('cascade').onDelete('cascade')
    )
    .addCheckConstraint('linkage_distinct_assets_check', sql<string>`asset_id <> linked_asset_id`)
    .addCheckConstraint(
      'linkage_distinct_group_from_assets_check',
      sql<string>`asset_group_id <> asset_id AND asset_group_id <> linked_asset_id`
    )
    .$call(withTimestamps)
    .execute();
  await createIndex(db, 'pies', 'linkage', ['asset_id']);
  await createIndex(db, 'pies', 'linkage', ['linked_asset_id']);
  await createIndex(db, 'pies', 'linkage', ['asset_group_id']);
  // Ensures bidirectional uniqueness scoped per asset group
  await sql`
    CREATE UNIQUE INDEX linkage_undirected_group
    ON pies.linkage (
      asset_group_id,
      LEAST(asset_id, linked_asset_id),
      GREATEST(asset_id, linked_asset_id)
    );
  `.execute(db);
  await createUpdatedAtTrigger(db, 'pies', 'linkage');
  await createAuditLogTrigger(db, 'pies', 'linkage');
}

/**
 * @param db - Database
 */
export async function down(db: Kysely<unknown>): Promise<void> {
  //
  // Drop linkage table
  //

  await dropAuditLogTrigger(db, 'pies', 'linkage');
  await dropUpdatedAtTrigger(db, 'pies', 'linkage');
  await dropIndex(db, 'pies', 'linkage', ['asset_id']);
  await dropIndex(db, 'pies', 'linkage', ['linked_asset_id']);
  await dropIndex(db, 'pies', 'linkage', ['asset_group_id']);
  await dropIndex(db, 'pies', 'linkage', ['linkage_undirected_group']);
  await db.schema.withSchema('pies').dropTable('linkage').execute();

  //
  // Drop relation_kind table
  //

  await dropAuditLogTrigger(db, 'pies', 'relation_kind');
  await dropUpdatedAtTrigger(db, 'pies', 'relation_kind');
  await db.schema.withSchema('pies').dropTable('relation_kind').execute();

  //
  // Restore record_linkage table
  //

  await db.schema
    .withSchema('pies')
    .createTable('record_linkage')
    .addColumn('id', 'integer', (col) => col.primaryKey().generatedAlwaysAsIdentity())
    .addColumn('transaction_id', 'uuid', (col) =>
      col.notNull().unique().references('transaction.id').onUpdate('cascade').onDelete('cascade')
    )
    .addColumn('asset_id', 'integer', (col) =>
      col.notNull().references('asset.id').onUpdate('cascade').onDelete('cascade')
    )
    .addColumn('linked_asset_id', 'integer', (col) =>
      col.notNull().references('asset.id').onUpdate('cascade').onDelete('cascade')
    )
    .$call(withTimestamps)
    .execute();
  await createIndex(db, 'pies', 'record_linkage', ['asset_id']);
  await createIndex(db, 'pies', 'record_linkage', ['linked_asset_id']);
  // Ensures bidirectional links - should behave as an undirected graph
  await sql`
    CREATE UNIQUE INDEX record_linkage_undirected
    ON pies.record_linkage (
      LEAST(asset_id, linked_asset_id),
      GREATEST(asset_id, linked_asset_id)
    );
  `.execute(db);
  await createUpdatedAtTrigger(db, 'pies', 'record_linkage');
  await createAuditLogTrigger(db, 'pies', 'record_linkage');
}
