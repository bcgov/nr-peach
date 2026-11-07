import { BaseRepository } from './base.ts';

import type { Kysely, Transaction } from 'kysely';
import type { DB } from '#types';

const CONSTRAINTS = ['relation_kind_version_id_kind_unique'] as const;

export class RelationKindRepository extends BaseRepository<'pies.relationKind', (typeof CONSTRAINTS)[number]> {
  constructor(db?: Kysely<DB> | Transaction<DB>) {
    super('pies.relationKind', db, CONSTRAINTS);
  }
}
