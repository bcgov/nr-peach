import { BaseRepository } from './base.ts';

import type { Kysely, Transaction } from 'kysely';
import type { DB } from '../types/index.d.ts';

export class CodingRepository extends BaseRepository<'pies.coding'> {
  constructor(db?: Kysely<DB> | Transaction<DB>) {
    super('pies.coding', db, ['coding_code_code_system_version_id_unique']);
  }
}
