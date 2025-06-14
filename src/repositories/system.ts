import { BaseRepository } from './base.ts';

import type { Kysely, Transaction } from 'kysely';
import type { DB } from '../types/index.d.ts';

export class SystemRepository extends BaseRepository<'pies.system'> {
  constructor(db?: Kysely<DB> | Transaction<DB>) {
    super('pies.system', db);
  }
}
