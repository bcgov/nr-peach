import { sql } from 'kysely';

import { BaseRepository } from './base.ts';

import type { DeleteQueryBuilder, DeleteResult, Kysely, Transaction } from 'kysely';
import type { DB } from '../types/index.d.ts';

export class ProcessEventRepository extends BaseRepository<'pies.processEvent'> {
  constructor(db?: Kysely<DB> | Transaction<DB>) {
    super('pies.processEvent', db);
  }

  /**
   * Deletes all process event entities associated with a specific system record.
   * @param systemRecordId - The ID of the system record whose process events should be deleted.
   * @returns A query builder instance configured to delete the specified records.
   */
  prune(systemRecordId: number): DeleteQueryBuilder<DB, 'pies.processEvent', DeleteResult> {
    return this.db.deleteFrom(this.tableName).where(sql.ref('system_record_id'), '=', systemRecordId);
  }
}
