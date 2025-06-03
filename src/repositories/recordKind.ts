import { BaseRepository } from './index.ts';

import type { InsertObject, InsertQueryBuilder, InsertResult, Kysely, Transaction } from 'kysely';
import type { DB, PiesRecordKind } from '../types/index.ts';

export class RecordKindRepository extends BaseRepository<'pies.recordKind', PiesRecordKind, number> {
  constructor(db?: Kysely<DB> | Transaction<DB>) {
    super('pies.recordKind', db);
  }

  upsert(item: InsertObject<DB, 'pies.recordKind'>): InsertQueryBuilder<DB, 'pies.recordKind', InsertResult> {
    return super.upsert(item).onConflict((oc) => oc.constraint('record_kind_version_id_kind_unique').doNothing());
  }

  read(id: number) {
    return this.db.selectFrom(this.tableName).where('id', '=', id).selectAll().$castTo<PiesRecordKind>();
  }

  delete(id: number) {
    return this.db.deleteFrom(this.tableName).where('id', '=', id);
  }
}
