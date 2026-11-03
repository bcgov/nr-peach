import { BaseRepository } from './base.ts';

import type { Kysely, Transaction } from 'kysely';
import type { DB } from '#types';

export class LinkageRepository extends BaseRepository<'pies.linkage'> {
  constructor(db?: Kysely<DB> | Transaction<DB>) {
    super('pies.linkage', db);
  }
}
