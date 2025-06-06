import { BaseRepository } from './index.ts';

import type { Kysely, Transaction } from 'kysely';
import type { DB } from '../types/index.ts';

export class ProcessEventRepository extends BaseRepository<'pies.processEvent'> {
  constructor(db?: Kysely<DB> | Transaction<DB>) {
    super('pies.processEvent', db);
  }
}
