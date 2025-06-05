import { BaseRepository } from './index.ts';

import type { Kysely, Transaction } from 'kysely';
import type { DB } from '../types/index.ts';

export class SystemRecordRepository extends BaseRepository<'pies.systemRecord'> {
  constructor(db?: Kysely<DB> | Transaction<DB>) {
    super('pies.systemRecord', db);
  }
}
