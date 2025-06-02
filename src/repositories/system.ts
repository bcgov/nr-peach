import { BaseRepository } from './index.ts';

import type { Kysely, Transaction } from 'kysely';
import type { DB, PiesSystem } from '../types/index.ts';

export class SystemRepository extends BaseRepository<'pies.system', PiesSystem, string> {
  constructor(db?: Kysely<DB> | Transaction<DB>) {
    super('pies.system', db);
  }

  read(id: string) {
    return this.db.selectFrom(this.tableName).where('id', '=', id).selectAll().$castTo<PiesSystem>();
  }

  delete(id: string) {
    return this.db.deleteFrom(this.tableName).where('id', '=', id);
  }
}
