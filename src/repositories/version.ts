import { BaseRepository } from './index.ts';

import type { InsertResult, DeleteResult } from 'kysely';
import type { PiesVersion } from '../types/index.ts';

export class VersionRepository extends BaseRepository<PiesVersion, string> {
  create(item: Partial<PiesVersion>): Promise<InsertResult> {
    return this.db
      .insertInto('pies.version')
      .values({ id: item.id ?? '' })
      .executeTakeFirst();
  }

  read(id: string): Promise<object | undefined> {
    return this.db.selectFrom('pies.version').where('id', '=', id).selectAll().executeTakeFirst();
  }

  /** @deprecated Updates to pies.version are not allowed. */
  update(): never {
    throw new Error('Updates to pies.version are not allowed.');
  }

  delete(id: string): Promise<DeleteResult> {
    return this.db.deleteFrom('pies.version').where('id', '=', id).executeTakeFirst();
  }

  upsert(item: Partial<PiesVersion>): Promise<InsertResult> {
    return this.db
      .insertInto('pies.version')
      .values({ id: item.id ?? '' })
      .onConflict((oc) => oc.column('id').doNothing())
      .executeTakeFirst();
  }
}
