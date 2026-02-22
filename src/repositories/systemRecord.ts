import { BaseRepository } from './base.ts';

import type { Kysely, Transaction } from 'kysely';
import type { DB } from '../types/index.d.ts';

const CONSTRAINTS = ['system_record_system_id_record_id_unique'] as const;

export class SystemRecordRepository extends BaseRepository<'pies.systemRecord', (typeof CONSTRAINTS)[number]> {
  constructor(db?: Kysely<DB> | Transaction<DB>) {
    super('pies.systemRecord', db, CONSTRAINTS);
  }
}
