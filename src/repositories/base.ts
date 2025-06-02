import { db } from '../db/index.ts';

import type {
  DeleteQueryBuilder,
  DeleteResult,
  InsertObject,
  InsertQueryBuilder,
  InsertResult,
  Kysely,
  SelectQueryBuilder,
  Transaction
  // UpdateObject,
  // UpdateQueryBuilder,
  // UpdateResult
} from 'kysely';
import type { DB } from '../types/index.ts';

/**
 * Abstract base class for repository implementations.
 * Provides a structure for CRUD operations and database interaction.
 * @template TB - The key of the table in the database.
 * @template O - The type of the entity managed by the repository.
 * @template ID - The type of the primary key identifier for the entity.
 */
export abstract class BaseRepository<TB extends keyof DB, O, ID> {
  /**
   * The database instance used for executing queries.
   * Can be either a `Kysely` instance or a `Transaction` instance.
   */
  protected db: Kysely<DB> | Transaction<DB>;

  /**
   * The name of the database table and schema associated with this repository.
   * This property is intended to be set by derived classes to specify
   * the table that the repository interacts with.
   */
  protected tableName: TB;

  /**
   * Constructs a new instance of the repository.
   * @param tableName - The name of the table associated with the repository.
   * @param [dbInstance] - Optional database instance.
   * If not provided, the default database instance (`defaultDb`) will be used.
   */
  constructor(tableName: TB, dbInstance?: Kysely<DB> | Transaction<DB>) {
    this.tableName = tableName;
    this.db = dbInstance ?? db;
  }

  /**
   * Create a new entity in the table.
   * @param item - The data to insert.
   * @returns A query builder for the insert operation.
   */
  create(item: InsertObject<DB, TB>): InsertQueryBuilder<DB, TB, InsertResult> {
    return this.db.insertInto(this.tableName).values(item);
  }

  /**
   * Upsert an entity into the table, with conflict resolution set to do nothing if a conflict occurs.
   * @param item - The data to upsert.
   * @returns A query builder for the upsert operation.
   */
  upsert(item: InsertObject<DB, TB>): InsertQueryBuilder<DB, TB, InsertResult> {
    return this.create(item).onConflict((oc) => oc.column('id').doNothing());
  }

  /**
   * Read an entity from the database by its identifier.
   * @param id - The identifier of the entity to be read.
   * @returns A promise that resolves to the entity if found, or `null` if not found.
   */
  abstract read(id: ID): SelectQueryBuilder<DB, TB, O>;

  /**
   * Update an existing entity in the table.
   * @param {ID} id - The identifier of the entity to be updated.
   * @param {Partial<O>} item - The partial entity data to update.
   * @returns {Promise<O>} A promise that resolves to the updated entity.
   */
  // TODO: Uncomment and enforce the update method when needed.
  // abstract update(id: ID, item: UpdateObject<DB, TB>): UpdateQueryBuilder<DB, TB, TB, UpdateResult>;

  /**
   * Delete an entity from the table by its identifier.
   * @param {ID} id - The identifier of the entity to be deleted.
   * @returns {Promise<DeleteResult>} A promise that resolves to the result of the delete operation.
   */
  abstract delete(id: ID): DeleteQueryBuilder<DB, TB, DeleteResult>;
}
