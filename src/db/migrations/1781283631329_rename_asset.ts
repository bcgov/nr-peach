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
  // pies.system_record -> pies.asset
  await dropAuditLogTrigger(db, 'pies', 'system_record');
  await dropUpdatedAtTrigger(db, 'pies', 'system_record');
  await dropIndex(db, 'pies', 'system_record', ['record_id']);
  await dropIndex(db, 'pies', 'system_record', ['system_id']);

  // Rename table
  await db.schema.withSchema('pies').alterTable('system_record').renameTo('asset').execute();

  // Rename unique constraint
  await db.schema
    .withSchema('pies')
    .alterTable('asset')
    .renameConstraint('system_record_system_id_record_id_unique', 'asset_system_id_record_id_unique')
    .execute();

  // Recreate triggers with new table name
  await createUpdatedAtTrigger(db, 'pies', 'asset');
  await createAuditLogTrigger(db, 'pies', 'asset');

  // Recreate indexes with new table name
  await createIndex(db, 'pies', 'asset', ['record_id']);
  await createIndex(db, 'pies', 'asset', ['system_id']);
}

/**
 * @param db - Database
 */
export async function down(db: Kysely<unknown>): Promise<void> {
  // pies.asset -> pies.system_record
  await dropAuditLogTrigger(db, 'pies', 'asset');
  await dropUpdatedAtTrigger(db, 'pies', 'asset');
  await dropIndex(db, 'pies', 'asset', ['system_id']);
  await dropIndex(db, 'pies', 'asset', ['record_id']);

  // Rename unique constraint back
  await db.schema
    .withSchema('pies')
    .alterTable('asset')
    .renameConstraint('asset_system_id_record_id_unique', 'system_record_system_id_record_id_unique')
    .execute();

  // Rename table back
  await db.schema.withSchema('pies').alterTable('asset').renameTo('system_record').execute();

  // Recreate triggers with old table name
  await createAuditLogTrigger(db, 'pies', 'system_record');
  await createUpdatedAtTrigger(db, 'pies', 'system_record');

  // Recreate indexes with old table name
  await createIndex(db, 'pies', 'system_record', ['system_id']);
  await createIndex(db, 'pies', 'system_record', ['record_id']);
}
