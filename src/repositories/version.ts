import { BaseRepository } from './index.ts';

import type { Kysely, Transaction } from 'kysely';
import type { DB, PiesVersion } from '../types/index.ts';

export class VersionRepository extends BaseRepository<'pies.version', PiesVersion> {
  constructor(db?: Kysely<DB> | Transaction<DB>) {
    super('pies.version', 'id', db);
  }
}
