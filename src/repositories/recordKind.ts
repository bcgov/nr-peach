import { BaseRepository } from './index.ts';

import type { InsertObject, InsertQueryBuilder, Kysely, Selectable, Transaction } from 'kysely';
import type { DB, PiesRecordKind } from '../types/index.ts';

export class RecordKindRepository extends BaseRepository<'pies.recordKind', PiesRecordKind> {
  constructor(db?: Kysely<DB> | Transaction<DB>) {
    super('pies.recordKind', 'id', db);
  }

  override upsert(
    item: InsertObject<DB, 'pies.recordKind'>
  ): InsertQueryBuilder<DB, 'pies.recordKind', Selectable<PiesRecordKind>> {
    return super
      .upsert(item)
      .onConflict((oc) => oc.constraint('record_kind_version_id_kind_unique').doNothing())
      .returningAll();
    // .$castTo<PiesRecordKind>();
  }
}
