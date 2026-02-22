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
import type { DB } from '../types/index.d.ts';

/**
 * Abstract base class for repository implementations.
 * Provides a common structure for schema building and database interaction.
 * @template TB - Table name type, must be a key of the `DB` schema.
 * @template C - Optional table constraint identifiers.
 * @example
 * ```typescript
 * class UserRepository extends BaseRepository<'users'> {
 *   constructor(db: Kysely<DB> | Transaction<DB>) {
 *     super('users', db);
 *   }
 * }
 * ```
 * @example
 * ```
 * const CONSTRAINTS = ['first_constraint', 'second_constraint'] as const;
 *
 * class UserRepository extends BaseRepository<'users', (typeof CONSTRAINTS)[number]> {
 *   constructor(db: Kysely<DB> | Transaction<DB>) {
 *     super('users', db, CONSTRAINTS);
 *   }
 * }
 * ```
 */
export abstract class BaseRepository<TB extends keyof DB, C extends string = string> {
  /** The column constraints associated with the table. */
  protected readonly constraints: readonly C[];

  /** The Kysely database instance or transaction used for executing queries. */
  protected readonly db: Kysely<DB> | Transaction<DB>;

  /** The name of the primary key column for the table. */
  protected readonly idColumn: AnyColumn<DB, TB>;

  /** The name of the table this repository operates on. */
  public readonly tableName: TB;

  /**
   * Creates an instance of the repository for the specified table.
   * @param tableName - The name of the table this repository will operate on.
   * @param dbInstance - Optional. An instance of Kysely or Transaction to use for database operations.
   * If not provided, a default instance is used.
   * @param constraints - Optional. An array of column constraints for the table.
   * @param idColumn - Optional. The name of the ID column for the table. Defaults to 'id' if not specified.
   */
  constructor(
    tableName: TB,
    dbInstance?: Kysely<DB> | Transaction<DB>,
    constraints?: readonly C[],
    idColumn?: AnyColumn<DB, TB>
  ) {
    this.constraints = constraints ?? [];
    this.db = dbInstance ?? db;
    this.idColumn = idColumn ?? 'id';
    this.tableName = tableName;
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
   * Create multiple new entities in the table.
   * @param data - The data array to insert.
   * @returns A query builder for the insert operation.
   */
  createMany(data: readonly InsertObject<DB, TB>[]): InsertQueryBuilder<DB, TB, Selectable<DB[TB]>> {
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
   * Delete multiple records from the table, excluding specific IDs and optionally
   * scoping the operation to specific column values.
   * @remarks If `excludeIds` is an empty array, this collapses to an unrestricted delete operation.
   * @param excludeIds - The array of primary keys to NOT delete.
   * @param scope - Optional object containing column/value pairs to narrow the deletion
   * @returns A query builder instance configured to delete the specified records.
   */
  deleteExcept(
    excludeIds: readonly OperandValueExpression<DB, TB, DB[TB]>[],
    scope?: Partial<Selectable<DB[TB]>>
  ): DeleteQueryBuilder<DB, TB, DB[TB]> {
    let builder = this.db.deleteFrom(this.tableName) as unknown as DeleteQueryBuilder<DB, TB, DB[TB]>;

    if (scope) {
      Object.entries(scope).forEach(([column, value]) => {
        if (value !== undefined) builder = builder.where(sql.ref(column), '=', value);
      });
    }
    if (excludeIds.length > 0) builder = builder.where(sql.ref(this.idColumn), 'not in', excludeIds);

    return builder;
  }

  /**
   * Delete multiple entities from the table by its identifiers.
   * @param ids - The array of primary key values of the records to delete.
   * @returns A query builder instance configured to delete the specified records.
   */
  deleteMany(ids: readonly OperandValueExpression<DB, TB, DB[TB]>[]): DeleteQueryBuilder<DB, TB, DB[TB]> {
    const builder = this.db.deleteFrom(this.tableName) as unknown as DeleteQueryBuilder<DB, TB, DB[TB]>;
    return builder.where(sql.ref(this.idColumn), 'in', ids);
  }

  /**
   * Finds entities in the table matching all of the provided data.
   * This performs a logical AND operation across all provided fields.
   * @param data - The data to find.
   * @returns A query builder for the find operation.
   */
  findBy(data: FilterObject<DB, TB>): SelectQueryBuilder<DB, TB, Selectable<DB[TB]>> {
    const builder = this.db.selectFrom(this.tableName).selectAll() as unknown as SelectQueryBuilder<
      DB,
      TB,
      Selectable<DB[TB]>
    >;
    return builder.where((eb) => eb.and(data));
  }

  /**
   * Read an entity from the database by its identifier.
   * @param id - The primary key value of the record to retrieve.
   * @returns A query builder instance configured to select the record with the specified ID.
   */
  read(id: OperandValueExpression<DB, TB, DB[TB]>): SelectQueryBuilder<DB, TB, Selectable<DB[TB]>> {
    const builder = this.db.selectFrom(this.tableName).selectAll() as unknown as SelectQueryBuilder<
      DB,
      TB,
      Selectable<DB[TB]>
    >;
    return builder.where(sql.ref(this.idColumn), '=', id);
  }

  /**
   * Upsert an entity into the table, with conflict resolution set to do nothing if a conflict occurs.
   * @param data - The data to upsert.
   * @param constraint - Optional conflict constraint; defaults to the first registered constraint or the table id.
   * @returns A query builder for the upsert operation.
   */
  upsert(data: InsertObject<DB, TB>, constraint?: C): InsertQueryBuilder<DB, TB, Selectable<DB[TB]>> {
    return this.create(data).onConflict((oc) => {
      if (this.constraints.length) return oc.constraint(constraint ?? this.constraints[0]).doNothing();
      return oc.column(this.idColumn).doNothing();
    });
  }

  /**
   * Upsert multiple entities into the table, with conflict resolution set to do nothing if a conflict occurs.
   * @param data - The data array to upsert.
   * @param constraint - Optional conflict constraint; defaults to the first registered constraint or the table id.
   * @returns A query builder for the upsert operation.
   */
  upsertMany(data: readonly InsertObject<DB, TB>[], constraint?: C): InsertQueryBuilder<DB, TB, Selectable<DB[TB]>> {
    return this.createMany(data).onConflict((oc) => {
      if (this.constraints.length) return oc.constraint(constraint ?? this.constraints[0]).doNothing();
      return oc.column(this.idColumn).doNothing();
    });
  }
}
