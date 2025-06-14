import { BaseRepository } from './base.ts';

import type { Kysely, Transaction } from 'kysely';
import type { DB } from '../types/index.d.ts';

export class SystemRecordRepository extends BaseRepository<'pies.systemRecord'> {
  constructor(db?: Kysely<DB> | Transaction<DB>) {
    super('pies.systemRecord', db, ['system_record_system_id_record_id_unique']);
  }
}
