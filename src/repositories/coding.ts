import { BaseRepository } from './base.ts';

import type { Kysely, Transaction } from 'kysely';
import type { DB } from '../types/index.d.ts';

const CONSTRAINTS = ['coding_code_code_system_version_id_unique'] as const;

export class CodingRepository extends BaseRepository<'pies.coding', (typeof CONSTRAINTS)[number]> {
  constructor(db?: Kysely<DB> | Transaction<DB>) {
    super('pies.coding', db, CONSTRAINTS);
  }
}
