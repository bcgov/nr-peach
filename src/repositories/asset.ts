import { BaseRepository } from './base.ts';

import type { Kysely, Transaction } from 'kysely';
import type { DB } from '#types';

const CONSTRAINTS = ['asset_system_id_record_id_unique'] as const;

export class AssetRepository extends BaseRepository<'pies.asset', (typeof CONSTRAINTS)[number]> {
  constructor(db?: Kysely<DB> | Transaction<DB>) {
    super('pies.asset', db, CONSTRAINTS);
  }
}
