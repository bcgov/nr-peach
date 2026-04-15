import { DatabaseError } from 'pg';

import { db } from '#src/db/index';
import { BaseRepository } from '#src/repositories/index';
import { getLogger } from '#src/utils/index';

import type { AccessMode, FilterObject, InsertObject, IsolationLevel, Selectable, Transaction } from 'kysely';
import type { DB } from '#types';

const log = getLogger(import.meta.filename);

/**
 * Finds a record in the database using the provided filter criteria. If no record is found,
 * inserts a new record with the given data. Returns the found or newly inserted record.
 * @remarks Ensure the `data` filters are constrained enough to select only one record
 * @param repo - The repository instance used to interact with the database.
 * @param data - An object containing both filter criteria and data for insertion.
 * @returns A promise that resolves to the found or newly inserted record.
 * @throws If the upsert operation fails to insert a new record.
 */
export async function findWhereOrUpsert<TB extends keyof DB>(
  repo: BaseRepository<TB>,
  data: FilterObject<DB, TB> & InsertObject<DB, TB>
): Promise<Selectable<DB[TB]>> {
  const findRow = await repo.findWhere(data).executeTakeFirst();
  return findRow ?? (await repo.upsert(data).executeTakeFirstOrThrow());
}

/**
 * Executes a database operation in a transaction, retrying on serialization failures or deadlocks.
 * @param operation - An async function that receives a transaction object and performs database operations.
 * @param opts - Optional settings for transaction and retry logic.
 * - accessMode - The transaction access mode (default: 'read write').
 * - initialDelay - Initial delay in ms before retrying after a failure (default: 100).
 * - isolationLevel - The transaction isolation level (default: 'read committed').
 * - maxRetries - Maximum number of retry attempts (default: 3).
 * @returns A promise that resolves with the operation result.
 * @throws If the operation fails for other reasons or all retries are exhausted.
 */
export async function transactionWrapper<T>(
  operation: (trx: Transaction<DB>) => Promise<T>,
  opts: Partial<{
    accessMode: AccessMode;
    initialDelay: number;
    isolationLevel: IsolationLevel;
    maxRetries: number;
  }> = {}
): Promise<T> {
  const { accessMode = 'read write', initialDelay = 100, isolationLevel = 'read committed', maxRetries = 3 } = opts;

  for (let attempt = 0; attempt < maxRetries - 1; attempt++) {
    try {
      return db.transaction().setAccessMode(accessMode).setIsolationLevel(isolationLevel).execute(operation);
    } catch (err) {
      // Rethrow immediately if error is not a serialization_failure (40001) or deadlock_detected (40P01)
      if (!(err instanceof DatabaseError && (err.code === '40001' || err.code === '40P01'))) throw err;

      const delay = initialDelay * 2 ** attempt;
      log.warn(
        {
          attempt: attempt + 1,
          error: err,
          function: 'transactionWrapper'
        },
        `Transaction failed, retrying in ${delay}ms...`
      );
      await new Promise((res) => setTimeout(res, delay));
    }
  }

  return db.transaction().setAccessMode(accessMode).setIsolationLevel(isolationLevel).execute(operation);
}
