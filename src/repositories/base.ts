import { db } from '../db/index.ts';

import type { DeleteResult, InsertResult, InsertType, Kysely, Transaction, UpdateType } from 'kysely';
import type { DB } from '../types/index.ts';

/**
 * Abstract base class for repository implementations.
 * Provides a structure for CRUD operations and database interaction.
 * @template T - The type of the entity managed by the repository.
 * @template ID - The type of the primary key identifier for the entity.
 */
export abstract class BaseRepository<T, ID> {
  /**
   * The database instance used for executing queries.
   * Can be either a `Kysely` instance or a `Transaction` instance.
   */
  protected db: Kysely<DB> | Transaction<DB>;

  /**
   * Constructs a new instance of the repository.
   * @param [dbInstance] - Optional database instance.
   * If not provided, the default database instance (`defaultDb`) will be used.
   */
  constructor(dbInstance?: Kysely<DB> | Transaction<DB>) {
    this.db = dbInstance ?? db;
  }

  /**
   * Create a new entity in the database.
   * @param {InsertType<T>} item - The entity to be created.
   * @returns {Promise<InsertResult>} A promise that resolves to the result of the insert operation.
   */
  abstract create(item: InsertType<T>): Promise<InsertResult>;

  /**
   * Read an entity from the database by its identifier.
   * @param {ID} id - The identifier of the entity to be read.
   * @returns {Promise<Partial<T> | undefined>} A promise that resolves to the entity if found, or `null` if not found.
   */
  abstract read(id: ID): Promise<Partial<T> | undefined>;

  /**
   * Update an existing entity in the database.
   * @param {ID} id - The identifier of the entity to be updated.
   * @param {Partial<T>} item - The partial entity data to update.
   * @returns {Promise<T>} A promise that resolves to the updated entity.
   */
  abstract update(id: ID, item: UpdateType<T>): Promise<T>;

  /**
   * Delete an entity from the database by its identifier.
   * @param {ID} id - The identifier of the entity to be deleted.
   * @returns {Promise<DeleteResult>} A promise that resolves to the result of the delete operation.
   */
  abstract delete(id: ID): Promise<DeleteResult>;

  // TODO: Uncomment if we want to enforce this interface in BaseRepository
  // /**
  //  * Upserts an existing entity in the database.
  //  * @param {InsertType<T>} item - The partial entity data to update.
  //  * @returns {Promise<InsertResult>} A promise that resolves to the updated entity.
  //  */
  // abstract upsert(item: InsertType<T>): Promise<InsertResult>;
}
