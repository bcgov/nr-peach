import { BaseRepository } from './base.ts';

import type { Kysely, Transaction } from 'kysely';
import type { DB } from '../types/index.d.ts';

const CONSTRAINTS = ['record_kind_version_id_kind_unique'] as const;

export class RecordKindRepository extends BaseRepository<'pies.recordKind', (typeof CONSTRAINTS)[number]> {
  constructor(db?: Kysely<DB> | Transaction<DB>) {
    super('pies.recordKind', db, CONSTRAINTS);
  }
}
