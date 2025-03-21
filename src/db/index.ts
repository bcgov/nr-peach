import { CamelCasePlugin, Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";

import { Database } from "./types.ts";

import type { PostgresDialectConfig } from "kysely";

// TODO: Add in .env parameterization support
export const dialectConfig: PostgresDialectConfig = {
  pool: new Pool({
    host: "localhost",
    database: "hub",
    user: "jerho",
    // password: "postgres",
    port: 5432,
    max: 10,
  }),
};

// Database interface is passed to Kysely's constructor, and from now on, Kysely knows your database structure.
// Dialect is passed to Kysely's constructor, and from now on, Kysely knows how to communicate with your database.
export const db = new Kysely<Database>({
  dialect: new PostgresDialect(dialectConfig),
  log: ['error'/*, 'query'*/],
  plugins: [new CamelCasePlugin()],
});
