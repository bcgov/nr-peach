import { BaseRepository } from './index.ts';

import type { InsertObject, InsertQueryBuilder, Kysely, Selectable, Transaction } from 'kysely';
import type { DB } from '../types/index.ts';

export class CodingRepository extends BaseRepository<'pies.coding'> {
  constructor(db?: Kysely<DB> | Transaction<DB>) {
    super('pies.coding', db);
  }

  override upsert(
    data: InsertObject<DB, 'pies.coding'>
  ): InsertQueryBuilder<DB, 'pies.coding', Selectable<DB['pies.coding']>> {
    return super
      .upsert(data)
      .onConflict((oc) => oc.constraint('coding_code_code_system_version_id_unique').doNothing())
      .returningAll();
  }

  override upsertMany(
    data: readonly InsertObject<DB, 'pies.coding'>[]
  ): InsertQueryBuilder<DB, 'pies.coding', Selectable<DB['pies.coding']>> {
    return super
      .upsertMany(data)
      .onConflict((oc) => oc.constraint('coding_code_code_system_version_id_unique').doNothing())
      .returningAll();
  }
}
