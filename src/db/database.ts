import { config } from 'dotenv';
import { CamelCasePlugin, Kysely, PostgresDialect, sql } from 'kysely';
import { Pool, types } from 'pg';

import { state } from '../state.ts';
import { getLogger } from '../utils/index.ts';

import type { LogEvent } from 'kysely';
import type { DB } from '../types/index.d.ts';

// Load environment variables, prioritizing .env over .env.default
config({ path: ['.env', '.env.default'], quiet: true });

const log = getLogger(import.meta.filename);

// Handle bigint parsing {@see https://kysely.dev/docs/recipes/data-types#runtime-javascript-types}
const int8TypeId = 20; // PostgreSQL's bigint type is represented as int8 in Kysely
types.setTypeParser(int8TypeId, (value: string): number => parseInt(value, 10));

const pool = new Pool({
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  port: +(process.env.PGPORT ?? 5432),
  connectionTimeoutMillis: +(process.env.PGPOOL_TIMEOUT ?? 3000),
  idleTimeoutMillis: +(process.env.PGPOOL_IDLE_TIMEOUT ?? 10000),
  max: +(process.env.PGPOOL_MAX ?? 10),
  min: +(process.env.PGPOOL_MIN ?? 0),
  maxLifetimeSeconds: +(process.env.PGPOOL_MAX_LIFETIME ?? 60)
});

pool.on('error', onPoolError);
pool.on('connect', () => log.silly('Database has connected a client', { clientCount: pool.totalCount }));
pool.on('acquire', () => log.silly('Database has acquired a client', { clientCount: pool.totalCount }));
pool.on('release', () => log.silly('Database has released a client', { clientCount: pool.totalCount }));
pool.on('remove', () => log.silly('Database has removed a client', { clientCount: pool.totalCount }));

/**
 * Checks the health of the database by executing a simple query.
 * @returns A promise that resolves to `true` if the database is healthy, or
 * `false` if the health check fails.
 * @throws Will log an error and return `false` if the database is not healthy.
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const result = await sql<{ result: number }>`SELECT 1 AS result`.execute(db);
    log.debug('Database is healthy');
    return result.rows?.[0]?.result === 1;
  } catch (error) {
    log.error('Database is unhealthy', { code: (error as { code?: string }).code });
    return false;
  }
}

/**
 * Checks if the database schema matches the expected structure.
 * @returns A promise that resolves to `true` if the  database schema matches
 * the expected structure, or `false` otherwise.
 * @throws Will log an error and return `false` if the database introspection fails.
 */
export async function checkDatabaseSchema(): Promise<boolean> {
  const expected = Object.freeze({
    schemas: ['audit', 'pies'],
    tables: [
      'logged_actions',
      'coding',
      'process_event',
      'record_kind',
      'system',
      'system_record',
      'transaction',
      'version'
    ]
  });

  try {
    const result = await db.introspection.getTables();
    const schemas = new Set(result.map((r) => r.schema));
    const tables = new Set(result.map((r) => r.name));
    const matches = {
      schemas: expected.schemas.every((s) => schemas.has(s)),
      tables: expected.tables.every((t) => tables.has(t))
    };

    log.debug('Database schema introspection', { matches });
    return matches.schemas && matches.tables;
  } catch (error) {
    log.error('Database introspection failed', error);
    return false;
  }
}

/**
 * Handles logging of database query events based on their severity level.
 * @param event - The log event containing details about the database query.
 * @param event.level - The severity level of the event ('error' or other levels).
 * @param event.queryDurationMillis - The duration of the query execution in milliseconds.
 * @param event.error - The error object associated with the query, if any (only for 'error' level).
 * @param event.query.parameters - The parameters used in the query.
 * @param event.query.sql - The SQL query string.
 */
export function onLogEvent(event: LogEvent): void {
  if (event.level === 'error') {
    log.error('Query failed', {
      durationMs: event.queryDurationMillis,
      error: event.error,
      params: event.query.parameters,
      sql: event.query.sql
    });
  } else {
    log.debug('Query executed', {
      durationMs: event.queryDurationMillis,
      params: event.query.parameters,
      sql: event.query.sql
    });
  }
}

/**
 * Handles errors emitted by the database connection pool.
 * Server assumes the worst and forces a database check on next database request.
 * @param err - The error object emitted by the pool.
 */
export function onPoolError(err: Error): void {
  log.error(`Database has errored: ${err.message}`, { clientCount: pool.totalCount });
  state.ready = false;
}

/**
 * Shuts down the database connection gracefully.
 * @param cb - Optional callback function to be executed after the database is destroyed.
 * @returns A promise that resolves when the database has been destroyed.
 */
export function shutdownDatabase(cb?: () => void): Promise<void> {
  return db.destroy().then(cb);
}

// Database interface is passed to Kysely's constructor, and from now on, Kysely knows your database structure.
// Dialect is passed to Kysely's constructor, and from now on, Kysely knows how to communicate with your database.
export const db = new Kysely<DB>({
  dialect: new PostgresDialect({ pool }),
  log: onLogEvent,
  plugins: [new CamelCasePlugin()]
});

export * from './utils.ts';
