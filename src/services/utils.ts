import { BaseRepository } from '../repositories/index.ts';

import type { FilterObject, InsertObject } from 'kysely';
import type { DB } from '../types/index.ts';

/**
 * Performs an upsert (insert or update) operation on the specified repository.
 * If the upsert operation does not return a row, retrieves the row by its ID.
 * @template TB - The table name, constrained to keys of the database schema `DB`.
 * @param repo - The repository instance for the target table.
 * @param data - The data object to insert or update.
 * @returns A promise that resolves to the upserted or retrieved row.
 */
export async function readableUpsert<TB extends keyof DB>(
  repo: BaseRepository<TB>,
  data: FilterObject<DB, TB> & InsertObject<DB, TB>
) {
  const upsertRow = await repo.upsert(data).executeTakeFirst();
  return upsertRow ?? (await repo.find(data).executeTakeFirstOrThrow());
}
