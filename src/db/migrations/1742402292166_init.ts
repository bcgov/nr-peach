import { Kysely, sql } from "kysely";

import { withTimestamps } from "../utils";

export async function up(db: Kysely<any>): Promise<void> {
  // Create schema updated at trigger
  await sql`CREATE or REPLACE function set_updated_at()
    returns trigger
    language plpgsql
    as $$
    begin
      new."updated_at" = now();
      return new;
    end;
    $$`.execute(db);

  // Create PIES schema
  await db.schema.createSchema("pies").ifNotExists().execute();

  // Create PIES tables
  await db.schema
    .withSchema("pies")
    .createTable("concept")
    .addColumn("id", "integer", (col) =>
      col.primaryKey().generatedAlwaysAsIdentity()
    )
    .addColumn("class", sql`_text`, (col) => col.notNull())
    .addColumn("concept", "text", (col) => col.notNull())
    .addColumn("version", "text", (col) => col.notNull())
    .addUniqueConstraint("concept_class_concept_version_unique", [
      "class",
      "concept",
      "version",
    ])
    .$call(withTimestamps)
    .execute();
  await db.schema
    .withSchema("pies")
    .createIndex("concept_class_index")
    .on("concept")
    .columns(["class"])
    .execute();

  await db.schema
    .withSchema("pies")
    .createTable("process_event")
    .addColumn("id", "integer", (col) =>
      col.primaryKey().generatedAlwaysAsIdentity()
    )
    .addColumn("tx_id", "uuid", (col) => col.notNull().unique())
    .addColumn("system_record_id", "integer", (col) => col.notNull())
    .addColumn("start_date", "timestamp", (col) => col.notNull())
    .addColumn("end_date", "timestamp")
    .addColumn("is_datetime", "boolean", (col) =>
      col.notNull().defaultTo(false)
    )
    .addColumn("concept_id", "integer", (col) =>
      col.notNull().references("concept.id")
    )
    .addColumn("status", "text")
    .addColumn("status_code", "text")
    .addColumn("description", "text")
    .$call(withTimestamps)
    .execute();
  await db.schema
    .withSchema("pies")
    .createIndex("process_event_system_record_id_index")
    .on("process_event")
    .columns(["system_record_id"])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop PIES tables
  await db.schema
    .withSchema("pies")
    .dropIndex("process_event_system_record_id_index")
    .execute();
  await db.schema.withSchema("pies").dropTable("process_event").execute();

  await db.schema.withSchema("pies").dropIndex("concept_class_index").execute();
  await db.schema.withSchema("pies").dropTable("concept").execute();
  // Drop PIES schema
  await db.schema.dropSchema("pies").execute();
  // Drop schema updated at trigger
  await sql`DROP FUNCTION IF EXISTS public.set_updated_at`.execute(db);
}
