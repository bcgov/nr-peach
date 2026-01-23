import { BaseRepository } from './base.ts';

import type { DeleteQueryBuilder, DeleteResult, Kysely, Selectable, SelectQueryBuilder, Transaction } from 'kysely';
import type { DB } from '../types/index.d.ts';

export class RecordLinkageRepository extends BaseRepository<'pies.recordLinkage'> {
  constructor(db?: Kysely<DB> | Transaction<DB>) {
    super('pies.recordLinkage', db);
  }

  /**
   * Deletes the record linkage entity associated with the two system record ids.
   * @param systemRecordIds - The two linked system record IDs whose record linkage should be dropped.
   * @returns A query builder instance configured to delete the specified record linkage.
   */
  drop(systemRecordIds: [number, number]): DeleteQueryBuilder<DB, 'pies.recordLinkage', DeleteResult> {
    return this.db.deleteFrom(this.tableName).where((eb) =>
      eb.or([
        eb.and({
          systemRecordId: systemRecordIds[0],
          linkedSystemRecordId: systemRecordIds[1]
        }),
        eb.and({
          systemRecordId: systemRecordIds[1],
          linkedSystemRecordId: systemRecordIds[0]
        })
      ])
    );
  }

  /**
   * Find the record linkage entity associated with the specified system record id.
   * @param systemRecordId - The system record ID who finds record linkages to list.
   * @returns A query builder instance configured to list the found record linkage.
   */
  list(systemRecordId: number): SelectQueryBuilder<DB, 'pies.recordLinkage', Selectable<'pies.recordLinkage'>> {
    return this.db
      .selectFrom(this.tableName)
      .selectAll()
      .where((eb) => eb('systemRecordId', '=', systemRecordId).or('linkedSystemRecordId', '=', systemRecordId));
  }
}
