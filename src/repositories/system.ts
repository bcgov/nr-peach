import { BaseRepository } from './index.ts';

import type { InsertResult, DeleteResult } from 'kysely';
import type { PiesSystem } from '../types/index.ts';

export class SystemRepository extends BaseRepository<PiesSystem, string> {
  create(item: Partial<PiesSystem>): Promise<InsertResult> {
    return this.db
      .insertInto('pies.system')
      .values({
        id: item.id ?? '',
        createdBy: 'SYSTEM'
      })
      .executeTakeFirst();
  }

  read(id: string): Promise<object | undefined> {
    return this.db.selectFrom('pies.system').where('id', '=', id).selectAll().executeTakeFirst();
  }

  /** @deprecated Updates to pies.system are not allowed. */
  update(): never {
    throw new Error('Updates to pies.system are not allowed.');
  }

  delete(id: string): Promise<DeleteResult> {
    return this.db.deleteFrom('pies.system').where('id', '=', id).executeTakeFirst();
  }

  upsert(item: Partial<PiesSystem>): Promise<InsertResult> {
    return this.db
      .insertInto('pies.system')
      .values({
        id: item.id ?? '',
        createdBy: 'SYSTEM'
      })
      .onConflict((oc) => oc.column('id').doNothing())
      .executeTakeFirst();
  }
}
