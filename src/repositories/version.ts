import { BaseRepository } from './index.ts';

import type { Kysely, Transaction } from 'kysely';
import type { DB } from '../types/index.d.ts';

export class VersionRepository extends BaseRepository<'pies.version'> {
  constructor(db?: Kysely<DB> | Transaction<DB>) {
    super('pies.version', db);
  }
}
