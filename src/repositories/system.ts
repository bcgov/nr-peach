import { BaseRepository } from './base.ts';

import type { Kysely, Transaction } from 'kysely';
import type { DB } from '#types';

export class SystemRepository extends BaseRepository<'pies.system'> {
  constructor(db?: Kysely<DB> | Transaction<DB>) {
    super('pies.system', db);
  }
}
