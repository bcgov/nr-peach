import { BaseRepository } from './base.ts';

import type { Kysely, Transaction } from 'kysely';
import type { DB } from '../types/index.d.ts';

export class TransactionRepository extends BaseRepository<'pies.transaction'> {
  constructor(db?: Kysely<DB> | Transaction<DB>) {
    super('pies.transaction', db);
  }
}
