import { BaseRepository } from '../repositories/index.ts';

import type { InsertObject, OperandValueExpression } from 'kysely';
import type { DB } from '../types/index.ts';

export const readableUpsert = async <TB extends keyof DB, R extends DB[TB]>(
  repo: BaseRepository<TB, R>,
  data: InsertObject<DB, TB>,
  k: OperandValueExpression<DB, TB, R>
) => {
  const upsertRow = await repo.upsert(data).executeTakeFirst();
  const readRow = await repo.read(k).executeTakeFirstOrThrow();
  return upsertRow ?? readRow;
};
