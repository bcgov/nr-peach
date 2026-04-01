import { BaseRepository } from './base.ts';

import type { Kysely, Transaction } from 'kysely';
import type { DB } from '#types';

export class RecordLinkageRepository extends BaseRepository<'pies.recordLinkage'> {
  constructor(db?: Kysely<DB> | Transaction<DB>) {
    super('pies.recordLinkage', db);
  }
}
