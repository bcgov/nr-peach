import { BaseRepository } from './index.ts';

import type { InsertResult, DeleteResult } from 'kysely';
import type { PiesTransaction } from '../types/index.ts';

export class TransactionRepository extends BaseRepository<PiesTransaction, string> {
  create(item: Partial<PiesTransaction>): Promise<InsertResult> {
    return this.db
      .insertInto('pies.transaction')
      .values({ id: item.id ?? '' })
      .executeTakeFirst();
  }

  read(id: string): Promise<object | undefined> {
    return this.db.selectFrom('pies.transaction').where('id', '=', id).selectAll().executeTakeFirst();
  }

  /** @deprecated Updates to pies.transaction are not allowed. */
  update(): never {
    throw new Error('Updates to pies.transaction are not allowed.');
  }

  delete(id: string): Promise<DeleteResult> {
    return this.db.deleteFrom('pies.transaction').where('id', '=', id).executeTakeFirst();
  }

  upsert(item: Partial<PiesTransaction>): Promise<InsertResult> {
    return this.db
      .insertInto('pies.transaction')
      .values({ id: item.id ?? '' })
      .onConflict((oc) => oc.column('id').doNothing())
      .executeTakeFirst();
  }
}
