import { BaseRepository } from './index.ts';

import type { InsertResult, DeleteResult } from 'kysely';
import type { PiesTransaction } from '../db/index.ts';

export class TransactionRepository extends BaseRepository<PiesTransaction, string> {
  create(item: Partial<PiesTransaction>): Promise<InsertResult> {
    return this.db
      .insertInto('pies.transaction')
      .values({
        id: item.id ?? '',
        createdBy: 'SYSTEM'
      })
      .executeTakeFirst();
  }

  read(id: string): Promise<object | undefined> {
    return this.db.selectFrom('pies.transaction').where('id', '=', id).selectAll().executeTakeFirst();
  }

  update(): never {
    throw new Error('Updates to pies.transaction are not allowed.');
  }

  delete(id: string): Promise<DeleteResult> {
    return this.db.deleteFrom('pies.transaction').where('id', '=', id).executeTakeFirst();
  }
}
