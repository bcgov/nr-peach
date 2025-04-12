import { config } from 'dotenv';
import { CamelCasePlugin, Kysely, PostgresDialect } from 'kysely';
import pg from 'pg';

import type { PostgresDialectConfig } from 'kysely';
import type { Database } from './schema.d.ts';

// Load environment variables, prioritizing .env over .env.default
config({ path: ['.env', '.env.default'] });

const { Pool } = pg;

// TODO Add in .env parameterization support
export const dialectConfig: PostgresDialectConfig = {
  pool: new Pool({
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    port: +(process.env.PGPORT ?? 5432),
    max: +(process.env.PGPOOL_MAX ?? 10)
  })
};

// Database interface is passed to Kysely's constructor, and from now on, Kysely knows your database structure.
// Dialect is passed to Kysely's constructor, and from now on, Kysely knows how to communicate with your database.
export const db = new Kysely<Database>({
  dialect: new PostgresDialect(dialectConfig),
  log: ['error' /*, 'query'*/],
  plugins: [new CamelCasePlugin()]
});
