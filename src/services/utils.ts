import { BaseRepository } from '../repositories/index.ts';

import type { FilterObject, InsertObject, Selectable } from 'kysely';
import type { DB } from '../types/index.d.ts';

/**
 * Finds a record in the database using the provided filter criteria. If no record is found,
 * inserts a new record with the given data. Returns the found or newly inserted record.
 * @template TB - The table name in the database schema.
 * @param repo - The repository instance used to interact with the database.
 * @param data - An object containing both filter criteria and data for insertion.
 * @returns A promise that resolves to the found or newly inserted record.
 * @throws If the upsert operation fails to insert a new record.
 */
export async function findByThenUpsert<TB extends keyof DB>(
  repo: BaseRepository<TB>,
  data: FilterObject<DB, TB> & InsertObject<DB, TB>
): Promise<Selectable<DB[TB]>> {
  const findRow = await repo.findBy(data).executeTakeFirst();
  return findRow ?? (await repo.upsert(data).executeTakeFirstOrThrow());
}
