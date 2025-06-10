import { BaseRepository } from './index.ts';

import type { InsertObject, InsertQueryBuilder, Kysely, Selectable, Transaction } from 'kysely';
import type { DB } from '../types/index.ts';

export class RecordKindRepository extends BaseRepository<'pies.recordKind'> {
  constructor(db?: Kysely<DB> | Transaction<DB>) {
    super('pies.recordKind', db);
  }

  override upsert(
    data: InsertObject<DB, 'pies.recordKind'>
  ): InsertQueryBuilder<DB, 'pies.recordKind', Selectable<DB['pies.recordKind']>> {
    return super
      .upsert(data)
      .onConflict((oc) => oc.constraint('record_kind_version_id_kind_unique').doNothing())
      .returningAll();
  }

  override upsertMany(
    data: readonly InsertObject<DB, 'pies.recordKind'>[]
  ): InsertQueryBuilder<DB, 'pies.recordKind', Selectable<DB['pies.recordKind']>> {
    return super
      .upsertMany(data)
      .onConflict((oc) => oc.constraint('record_kind_version_id_kind_unique').doNothing())
      .returningAll();
  }
}
