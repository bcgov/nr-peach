import './kysely.helper.ts'; // Must be imported before everything else
import { mockSqlExecuteReturn } from './kysely.helper.ts';

import { Kysely, Migrator, sql } from 'kysely';
import { readdirSync } from 'node:fs';

import { state } from '../../../src/state.ts';
import {
  checkDatabaseHealth,
  checkDatabaseMigrations,
  db,
  getMigrations,
  migrator,
  onLogEvent,
  onPoolError,
  shutdownDatabase
} from '../../../src/db/database.ts';

import type { LogEvent, QueryId, RootOperationNode } from 'kysely';
import type { Mock } from 'vitest';
import type { DB } from '../../../src/types/index.js';

vi.mock('node:fs', () => ({
  readdirSync: vi.fn()
}));

describe('db', () => {
  it('should yield a database', () => {
    expect(db).toBeDefined();
    expect(db).toBeInstanceOf(Kysely<DB>);
  });
});

describe('migrator', () => {
  it('should yield a migrator', () => {
    expect(migrator).toBeDefined();
    expect(migrator).toBeInstanceOf(Migrator);
  });
});

describe('checkDatabaseHealth', { shuffle: false }, () => {
  const testSystemTime = 1735718400000; // Jan 1, 2025 00:00:00 GMT

  beforeAll(() => {
    vi.useFakeTimers();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('should return true when the database is healthy', async () => {
    vi.setSystemTime(testSystemTime);
    (sql as unknown as Mock).mockImplementation(mockSqlExecuteReturn({ rows: [{ result: 1 }] }));
    const result = await checkDatabaseHealth();

    expect(sql).toHaveBeenCalledWith(['SELECT 1 AS result']);
    expect(result).toBe(true);
  });

  it('should return false and log an error when the database is unhealthy', async () => {
    vi.setSystemTime(testSystemTime + 100000);
    (sql as unknown as Mock).mockImplementation(mockSqlExecuteReturn(Promise.reject(new Error('Database error'))));
    const result = await checkDatabaseHealth();

    expect(sql).toHaveBeenCalledWith(['SELECT 1 AS result']);
    expect(result).toBe(false);
  });

  it('should return cached health check result if called within 1 second', async () => {
    vi.setSystemTime(testSystemTime + 200000);
    // First call: healthy
    (sql as unknown as Mock).mockImplementationOnce(mockSqlExecuteReturn({ rows: [{ result: 1 }] }));
    const firstResult = await checkDatabaseHealth();
    expect(firstResult).toBe(true);

    // Advance time by less than 1 second
    vi.setSystemTime(testSystemTime + 200000 + 1);

    // Second call: should return cached result, not call sql again
    const secondResult = await checkDatabaseHealth();
    expect(secondResult).toBe(true);

    expect(sql as unknown as Mock).toHaveBeenCalledTimes(1);
  });

  it('should update cache after 1 second', async () => {
    vi.setSystemTime(testSystemTime + 300000);
    // First call: healthy
    (sql as unknown as Mock).mockImplementationOnce(mockSqlExecuteReturn({ rows: [{ result: 1 }] }));
    await checkDatabaseHealth();

    // Advance time by more than 1 second
    vi.setSystemTime(testSystemTime + 300000 + 1001);

    // Second call: unhealthy
    (sql as unknown as Mock).mockImplementationOnce(mockSqlExecuteReturn(Promise.reject(new Error('Database error'))));
    const result = await checkDatabaseHealth();
    expect(result).toBe(false);

    expect(sql as unknown as Mock).toHaveBeenCalledTimes(2);
  });
});

describe('checkDatabaseMigrations', () => {
  let getMigrationsSpy: ReturnType<typeof vi.spyOn>;

  beforeAll(() => {
    getMigrationsSpy = vi.spyOn(migrator, 'getMigrations');
  });

  afterAll(() => {
    getMigrationsSpy.mockRestore();
  });

  it('should return true if all migrations are executed', async () => {
    getMigrationsSpy.mockResolvedValue([
      { name: '001_init', executedAt: new Date() },
      { name: '002_add_table', executedAt: new Date() }
    ]);
    const result = await checkDatabaseMigrations();
    expect(result).toBe(true);
  });

  it('should return false and log a warning if some migrations are not executed', async () => {
    getMigrationsSpy.mockResolvedValue([
      { name: '001_init', executedAt: new Date() },
      { name: '002_add_table', executedAt: undefined }
    ]);
    const result = await checkDatabaseMigrations();
    expect(result).toBe(false);
  });

  it('should return true if there are no migrations', async () => {
    getMigrationsSpy.mockResolvedValue([]);
    const result = await checkDatabaseMigrations();
    expect(result).toBe(true);
  });
});

describe('getMigrations', () => {
  it('loads all .ts migration files except .d.ts', async () => {
    (readdirSync as Mock).mockReturnValue(['1742402292166_init.ts', '002_ignore.d.ts']);
    const migrations = await getMigrations();
    expect(migrations).toHaveProperty('1742402292166_init');
    expect(migrations).not.toHaveProperty('002_ignore');
    expect(migrations['1742402292166_init']).toEqual(
      expect.objectContaining({
        up: expect.any(Function) as () => unknown,
        down: expect.any(Function) as () => unknown
      })
    );
  });

  it('returns an empty object if no migration files are found', async () => {
    (readdirSync as Mock).mockReturnValue([]);
    const migrations = await getMigrations();
    expect(migrations).toEqual({});
  });

  it('ignores non-ts files', async () => {
    (readdirSync as Mock).mockReturnValue(['not_a_migration.txt', 'another.js', 'README.md']);
    const migrations = await getMigrations();
    expect(migrations).toEqual({});
  });
});

describe('onLogEvent', () => {
  it('should log an error when event level is "error"', () => {
    const event: LogEvent = {
      level: 'error',
      queryDurationMillis: 100,
      error: new Error('Test error'),
      query: {
        parameters: ['param1', 'param2'],
        sql: 'SELECT * FROM test',
        query: {} as RootOperationNode,
        queryId: 'test-query-id' as unknown as QueryId
      }
    };

    onLogEvent(event);
    expect(onLogEvent(event)).toBeUndefined();
  });

  it('should log a verbose message when event level is not "error"', () => {
    const event: LogEvent = {
      level: 'query',
      queryDurationMillis: 50,
      query: {
        parameters: ['param1'],
        sql: 'SELECT * FROM test',
        query: {} as RootOperationNode,
        queryId: 'test-query-id' as unknown as QueryId
      }
    };

    onLogEvent(event);
    expect(onLogEvent(event)).toBeUndefined();
  });
});

describe('onPoolError', () => {
  let originalReady: boolean;

  beforeEach(() => {
    originalReady = state.ready;
    state.ready = true;
  });

  afterEach(() => {
    state.ready = originalReady;
  });

  it('should log an error and set state.ready to false', () => {
    onPoolError(new Error('Pool connection failed'));
    expect(state.ready).toBe(false);
  });
});

describe('shutdownDatabase', () => {
  it('should call db.destroy and resolve', async () => {
    const destroySpy = vi.spyOn(db, 'destroy').mockResolvedValueOnce(undefined);

    await expect(shutdownDatabase()).resolves.toBeUndefined();
    expect(destroySpy).toHaveBeenCalledTimes(1);

    destroySpy.mockRestore();
  });

  it('should call the callback after db.destroy resolves', async () => {
    const destroySpy = vi.spyOn(db, 'destroy').mockResolvedValueOnce(undefined);
    const cb = vi.fn();

    await shutdownDatabase(cb);

    expect(destroySpy).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledTimes(1);

    destroySpy.mockRestore();
  });
});
