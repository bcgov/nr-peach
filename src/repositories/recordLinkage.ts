import { BaseRepository } from './index.ts';

import type { Kysely, Transaction } from 'kysely';
import type { DB } from '../types/index.ts';

export class RecordLinkageRepository extends BaseRepository<'pies.recordLinkage'> {
  constructor(db?: Kysely<DB> | Transaction<DB>) {
    super('pies.recordLinkage', db, ['record_linkage_forward_unique', 'record_linkage_reverse_unique']);
  }
}
