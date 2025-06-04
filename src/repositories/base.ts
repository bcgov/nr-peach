import { sql } from 'kysely';

import { db } from '../db/index.ts';

import type {
  DeleteQueryBuilder,
  InsertObject,
  InsertQueryBuilder,
  InsertResult,
  Kysely,
  OperandValueExpression,
  Selectable,
  SelectQueryBuilder,
  Transaction
} from 'kysely';
import type { DB } from '../types/index.ts';

/**
 * Abstract base class for repository implementations.
 * Provides a structure for CRUD operations and database interaction.
 * @template TB - The key of the table in the database.
 * @template R - The key of the primary key identifier for the entity.
 */
export abstract class BaseRepository<TB extends keyof DB, R extends DB[TB]> {
  private db: Kysely<DB> | Transaction<DB>;
  private idColumn: string;
  private tableName: TB;

  constructor(tableName: TB, idColumn: string, dbInstance?: Kysely<DB> | Transaction<DB>) {
    this.tableName = tableName;
    this.idColumn = idColumn;
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
   * Read an entity from the database by its identifier.
   * @param id - The primary key value of the record to retrieve.
   * @returns A query builder instance configured to select the record with the specified ID.
   */
  read(id: OperandValueExpression<DB, TB, R>): SelectQueryBuilder<DB, TB, Selectable<R>> {
    const builder = this.db.selectFrom(this.tableName).selectAll() as unknown as SelectQueryBuilder<DB, TB, R>;
    return builder.where(sql.ref(this.idColumn), '=', id).$castTo<Selectable<R>>();
  }

  /**
   * Upsert an entity into the table, with conflict resolution set to do nothing if a conflict occurs.
   * @param item - The data to upsert.
   * @returns A query builder for the upsert operation.
   */
  upsert(item: InsertObject<DB, TB>): InsertQueryBuilder<DB, TB, Selectable<DB[TB]>> {
    return this.create(item)
      .onConflict((oc) => oc.column('id').doNothing())
      .returningAll();
  }

  /**
   * Delete an entity from the table by its identifier.
   * @param id - The primary key value of the record to delete.
   * @returns A query builder instance configured to delete the specified record.
   */
  delete(id: OperandValueExpression<DB, TB, R>): DeleteQueryBuilder<DB, TB, R> {
    const builder = this.db.deleteFrom(this.tableName) as unknown as DeleteQueryBuilder<DB, TB, R>;
    return builder.where(sql.ref(this.idColumn), '=', id);
  }
}
