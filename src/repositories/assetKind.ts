import { BaseRepository } from './base.ts';

import type { Kysely, Transaction } from 'kysely';
import type { DB } from '#types';

const CONSTRAINTS = ['asset_kind_version_id_kind_unique'] as const;

export class AssetKindRepository extends BaseRepository<'pies.assetKind', (typeof CONSTRAINTS)[number]> {
  constructor(db?: Kysely<DB> | Transaction<DB>) {
    super('pies.assetKind', db, CONSTRAINTS);
  }
}
