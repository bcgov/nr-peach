import { BaseRepository } from './index.ts';

import type { InsertObject, InsertQueryBuilder, Kysely, Selectable, Transaction } from 'kysely';
import type { DB } from '../types/index.ts';

export class SystemRecordRepository extends BaseRepository<'pies.systemRecord'> {
  constructor(db?: Kysely<DB> | Transaction<DB>) {
    super('pies.systemRecord', db);
  }

  override upsert(
    data: InsertObject<DB, 'pies.systemRecord'>
  ): InsertQueryBuilder<DB, 'pies.systemRecord', Selectable<DB['pies.systemRecord']>> {
    return super
      .upsert(data)
      .onConflict((oc) => oc.constraint('system_record_system_id_record_id_unique').doNothing())
      .returningAll();
  }

  override upsertMany(
    data: readonly InsertObject<DB, 'pies.systemRecord'>[]
  ): InsertQueryBuilder<DB, 'pies.systemRecord', Selectable<DB['pies.systemRecord']>> {
    return super
      .upsertMany(data)
      .onConflict((oc) => oc.constraint('system_record_system_id_record_id_unique').doNothing())
      .returningAll();
  }
}
