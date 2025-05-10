import { config } from 'dotenv';
import { CamelCasePlugin, Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';

import { getLogger } from '../utils/index.ts';

import type { LogEvent, PostgresDialectConfig } from 'kysely';
import type { Database } from './schema.d.ts';

// Load environment variables, prioritizing .env over .env.default
config({ path: ['.env', '.env.default'] });

const log = getLogger(import.meta.filename);

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

export const handleLogEvent = (event: LogEvent): void => {
  if (event.level === 'error') {
    log.error('Query failed', {
      durationMs: event.queryDurationMillis,
      error: event.error,
      params: event.query.parameters,
      sql: event.query.sql
    });
  } else {
    log.verbose('Query executed', {
      durationMs: event.queryDurationMillis,
      params: event.query.parameters,
      sql: event.query.sql
    });
  }
};

// Database interface is passed to Kysely's constructor, and from now on, Kysely knows your database structure.
// Dialect is passed to Kysely's constructor, and from now on, Kysely knows how to communicate with your database.
export const db = new Kysely<Database>({
  dialect: new PostgresDialect(dialectConfig),
  log: handleLogEvent,
  plugins: [new CamelCasePlugin()]
});

export * from './utils.ts';
