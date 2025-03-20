import { sql } from "kysely";

import type { CreateTableBuilder } from "kysely";

/**
 * @function withTimestamps
 * @description Adds timestamps to a table builder.
 * @param qb The table builder to add timestamps to.
 * @returns {CreateTableBuilder} The table builder with timestamps added. Should be invoked within a $call.
 */
export function withTimestamps<TB extends string>(
  qb: CreateTableBuilder<TB>
): CreateTableBuilder<TB> {
  return qb
    .addColumn("created_at", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("created_by", "text", (col) => col.notNull())
    .addColumn("updated_at", "timestamp")
    .addColumn("updated_by", "text");
}
