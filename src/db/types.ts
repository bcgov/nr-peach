import type {
  ColumnType,
  Generated,
  Insertable,
  Selectable,
  Updateable,
} from "kysely";

/*
 * Core Database Interfaces 
 */

export interface Database {
  'pies.concept': ConceptTable
}

export interface Timestamps {
  // You can specify a different type for each operation (select, insert and
  // update) using the `ColumnType<SelectType, InsertType, UpdateType>`
  // wrapper. Here we define a column `created_at` that is selected as
  // a `Date`, can optionally be provided as a `string` in inserts and
  // can never be updated:
  created_at: ColumnType<Date, string | undefined, never>
  created_by: string
  updated_at: ColumnType<Date, string | undefined, string | undefined>
  updated_by: string | null
}

/*
 * Concept Table
 */

export interface ConceptFields {
  // Columns that are generated by the database should be marked
  // using the `Generated` type. This way they are automatically
  // made optional in inserts and updates.
  id: Generated<number>
  class: string[]
  concept: string
  version: string
}

export interface ConceptTable extends ConceptFields, Timestamps {};

// You should not use the table schema interfaces directly. Instead, you should
// use the `Selectable`, `Insertable` and `Updateable` wrappers. These wrappers
// make sure that the correct types are used in each operation.
//
// Most of the time you should trust the type inference and not use explicit
// types at all. These types can be useful when typing function arguments.
export type Concept = Selectable<ConceptTable>
export type NewConcept = Insertable<ConceptTable>
export type UpdateConcept = Updateable<ConceptTable>
