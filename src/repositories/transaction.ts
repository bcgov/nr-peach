import { BaseRepository } from './index.ts';

import type { Kysely, Transaction } from 'kysely';
import type { DB, PiesTransaction } from '../types/index.ts';

export class TransactionRepository extends BaseRepository<'pies.transaction', PiesTransaction, string> {
  constructor(db?: Kysely<DB> | Transaction<DB>) {
    super('pies.transaction', db);
  }

  read(id: string) {
    return this.db.selectFrom(this.tableName).where('id', '=', id).selectAll().$castTo<PiesTransaction>();
  }

  delete(id: string) {
    return this.db.deleteFrom(this.tableName).where('id', '=', id);
  }
}
