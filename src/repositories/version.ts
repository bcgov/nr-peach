import { BaseRepository } from './index.ts';

import type { Kysely, Transaction } from 'kysely';
import type { DB, PiesVersion } from '../types/index.ts';

export class VersionRepository extends BaseRepository<'pies.version', PiesVersion, string> {
  constructor(db?: Kysely<DB> | Transaction<DB>) {
    super('pies.version', db);
  }

  read(id: string) {
    return this.db.selectFrom(this.tableName).where('id', '=', id).selectAll().$castTo<PiesVersion>();
  }

  delete(id: string) {
    return this.db.deleteFrom(this.tableName).where('id', '=', id);
  }
}
