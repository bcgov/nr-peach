import { BaseRepository } from './index.ts';

import type { Kysely, Transaction } from 'kysely';
import type { DB, PiesSystemRecord } from '../types/index.ts';

export class SystemRecordRepository extends BaseRepository<'pies.systemRecord', PiesSystemRecord> {
  constructor(db?: Kysely<DB> | Transaction<DB>) {
    super('pies.systemRecord', 'id', db);
  }
}
