import { BaseRepository } from './index.ts';

import type { Kysely, Transaction } from 'kysely';
import type { DB, PiesTransaction } from '../types/index.ts';

export class TransactionRepository extends BaseRepository<'pies.transaction', PiesTransaction> {
  constructor(db?: Kysely<DB> | Transaction<DB>) {
    super('pies.transaction', 'id', db);
  }
}
