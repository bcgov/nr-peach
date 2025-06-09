import { sql } from 'kysely';

import { db } from '../db/index.ts';

import type {
  AnyColumn,
  DeleteQueryBuilder,
  FilterObject,
  InsertObject,
  InsertQueryBuilder,
  Kysely,
  OperandValueExpression,
  Selectable,
  SelectQueryBuilder,
  Transaction
} from 'kysely';
import type { DB } from '../types/index.ts';

/**
 * Abstract base class for repository implementations.
 * Provides a common structure for schema building and database interaction.
 * @template TB - Table name type, must be a key of the `DB` schema.
 * @example
 * ```typescript
 * class UserRepository extends BaseRepository<'users'> {
 *   constructor(db: Kysely<DB> | Transaction<DB>) {
 *     super('users', db);
 *   }
 * }
 * ```
 */
export abstract class BaseRepository<TB extends keyof DB> {
  /** The Kysely database instance or transaction used for executing queries. */
  private _db: Kysely<DB> | Transaction<DB>;
  protected get db(): Kysely<DB> | Transaction<DB> {
    return this._db;
  }

  /** The name of the primary key column for the table. */
  private _idColumn: AnyColumn<DB, TB>;
  protected get idColumn(): AnyColumn<DB, TB> {
    return this._idColumn;
  }

  /** The name of the table this repository operates on. */
  private _tableName: TB;
  public get tableName(): TB {
    return this._tableName;
  }

  /**
   * Creates an instance of the repository for the specified table.
   * @param tableName - The name of the table this repository will operate on.
   * @param dbInstance - Optional. An instance of Kysely or Transaction to use for database operations.
   * If not provided, a default instance is used.
   * @param idColumn - Optional. The name of the ID column for the table. Defaults to 'id' if not specified.
   */
  constructor(tableName: TB, dbInstance?: Kysely<DB> | Transaction<DB>, idColumn?: AnyColumn<DB, TB>) {
    this._db = dbInstance ?? db;
    this._idColumn = idColumn ?? 'id';
    this._tableName = tableName;
  }

  /**
   * Create a new entity in the table.
   * @param data - The data to insert.
   * @returns A query builder for the insert operation.
   */
  create(data: InsertObject<DB, TB>): InsertQueryBuilder<DB, TB, Selectable<DB[TB]>> {
    return this.db.insertInto(this.tableName).values(data).returningAll();
  }

  /**
   * Delete an entity from the table by its identifier.
   * @param id - The primary key value of the record to delete.
   * @returns A query builder instance configured to delete the specified record.
   */
  delete(id: OperandValueExpression<DB, TB, DB[TB]>): DeleteQueryBuilder<DB, TB, DB[TB]> {
    const builder = this.db.deleteFrom(this.tableName) as unknown as DeleteQueryBuilder<DB, TB, DB[TB]>;
    return builder.where(sql.ref(this.idColumn), '=', id);
  }

  /**
   * Finds entities in the table matching all of the provided data.
   * @param data - The data to find.
   * @returns A query builder for the find operation.
   */
  find(data: FilterObject<DB, TB>): SelectQueryBuilder<DB, TB, Selectable<DB[TB]>> {
    const builder = this.db.selectFrom(this.tableName).selectAll() as unknown as SelectQueryBuilder<DB, TB, DB[TB]>;
    return builder.where((eb) => eb.and(data)).$castTo<Selectable<DB[TB]>>();
  }

  /**
   * Read an entity from the database by its identifier.
   * @param id - The primary key value of the record to retrieve.
   * @returns A query builder instance configured to select the record with the specified ID.
   */
  read(id: OperandValueExpression<DB, TB, DB[TB]>): SelectQueryBuilder<DB, TB, Selectable<DB[TB]>> {
    const builder = this.db.selectFrom(this.tableName).selectAll() as unknown as SelectQueryBuilder<DB, TB, DB[TB]>;
    return builder.where(sql.ref(this.idColumn), '=', id).$castTo<Selectable<DB[TB]>>();
  }

  /**
   * Upsert an entity into the table, with conflict resolution set to do nothing if a conflict occurs.
   * @param data - The data to upsert.
   * @returns A query builder for the upsert operation.
   */
  upsert(data: InsertObject<DB, TB>): InsertQueryBuilder<DB, TB, Selectable<DB[TB]>> {
    return this.create(data)
      .onConflict((oc) => oc.column(this.idColumn).doNothing())
      .returningAll();
  }
}
