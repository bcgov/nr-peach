import { BaseRepository } from './index.ts';

import type { Kysely, Transaction } from 'kysely';
import type { DB } from '../types/index.d.ts';

export class RecordKindRepository extends BaseRepository<'pies.recordKind'> {
  constructor(db?: Kysely<DB> | Transaction<DB>) {
    super('pies.recordKind', db, ['record_kind_version_id_kind_unique']);
  }
}
