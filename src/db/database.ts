import { config } from 'dotenv';
import { promises as dns } from 'node:dns';
import { readdirSync } from 'node:fs';
import { CamelCasePlugin, Kysely, Migrator, PostgresDialect, sql } from 'kysely';
import { Pool, types } from 'pg';

import { state } from '../state.ts';
import { getLogger } from '../utils/index.ts';

import type { LogEvent, Migration } from 'kysely';
import type { DB } from '../types/index.d.ts';

// Load environment variables, prioritizing .env over .env.default
config({ path: ['.env', '.env.default'], quiet: true });

const log = getLogger(import.meta.filename);

/** Handle bigint parsing {@see https://kysely.dev/docs/recipes/data-types#runtime-javascript-types} */
const int8TypeId = 20; // PostgreSQL's bigint type is represented as int8 in Kysely
types.setTypeParser(int8TypeId, (value: string): number => parseInt(value, 10));

const pool = new Pool({
  host: (await dns.lookup(process.env.PGHOST ?? '', { family: 4 })).address,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  port: +(process.env.PGPORT ?? 5432),
  // TODO: Consider using 'rejectUnauthorized: true' with proper certificate configuration
  ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: +(process.env.PGPOOL_TIMEOUT ?? 0),
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

let healthCheckPromise: Promise<boolean> | null = null;
let lastHealthCheckTime = 0;
let lastHealthCheckResult: boolean | null = null;

/** The main Kysely database instance configured for the application. */
export const db = new Kysely<DB>({
  dialect: new PostgresDialect({ pool }),
  log: onLogEvent,
  plugins: [new CamelCasePlugin()]
});

/** The Kysely migrator instance for managing database migrations. */
export const migrator = new Migrator({
  db: db,
  provider: { getMigrations }
});

/**
 * Checks the health status of the database by executing a simple query.
 * This function caches the result for 1 second to avoid excessive health checks.
 * @param now - The current timestamp in milliseconds. Defaults to `Date.now()`.
 * @returns A promise that resolves to `true` if the database is healthy, or `false` if unhealthy.
 */
export async function checkDatabaseHealth(now?: number): Promise<boolean> {
  const cacheDuration = 1000; // Cache duration in milliseconds (1 second)
  now ??= Date.now();

  // Use cached health check result if it exists and is still valid (within cacheDuration).
  if (lastHealthCheckResult !== null && now - lastHealthCheckTime < cacheDuration) {
    log.debug(`Database is ${lastHealthCheckResult ? 'healthy' : 'unhealthy'} (cached)`);
    return lastHealthCheckResult;
  }

  // Promise lock to prevent multiple concurrent health checks.
  if (healthCheckPromise) return healthCheckPromise;
  healthCheckPromise = (async () => {
    try {
      const result = await sql<{ result: number }>`SELECT 1 AS result`.execute(db);
      const healthy = result.rows?.[0]?.result === 1;
      lastHealthCheckTime = now;
      lastHealthCheckResult = healthy;
      log.debug(`Database is ${lastHealthCheckResult ? 'healthy' : 'unhealthy'}`);
      return lastHealthCheckResult;
    } catch (error) {
      lastHealthCheckTime = now;
      lastHealthCheckResult = false;
      log.error('Database is unhealthy', {
        code: (error as { code?: string }).code,
        message: (error as Error).message,
        stack: (error as Error).stack,
        error
      });
      return lastHealthCheckResult;
    } finally {
      healthCheckPromise = null; // Reset the promise lock
    }
  })();

  return healthCheckPromise;
}

/**
 * Checks whether all database migrations have been executed.
 * @returns A promise that resolves to `true` if all migrations have been executed, otherwise `false`.
 */
export async function checkDatabaseMigrations(): Promise<boolean> {
  const migrations = await migrator.getMigrations();
  const isMigrated = migrations.every((m) => !!m.executedAt);
  if (!isMigrated) {
    log.warn('Database is missing migrations', { missing: migrations.filter((m) => !m.executedAt).map((m) => m.name) });
  }
  return isMigrated;
}

/**
 * Loads all migration modules from the 'src/db/migrations' directory.
 * This function reads all TypeScript migration files (excluding .d.ts files),
 * dynamically imports each migration, and returns them as a record keyed by filename.
 * @returns A promise that resolves to a record of migration modules.
 */
export async function getMigrations(): Promise<Record<string, Migration>> {
  const migrations: Record<string, Migration> = {};
  const files = readdirSync('src/db/migrations');
  for (const fileName of files) {
    if (fileName.endsWith('.ts') && !fileName.endsWith('.d.ts')) {
      const migrationKey = fileName.substring(0, fileName.lastIndexOf('.'));
      migrations[migrationKey] = (await import(`./migrations/${migrationKey}.ts`)) as Migration;
    }
  }
  return migrations;
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
export async function shutdownDatabase(cb?: () => void): Promise<void> {
  await db.destroy();
  return cb?.();
}

export * from './utils.ts';
