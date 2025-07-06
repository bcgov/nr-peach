import './kysely.helper.ts'; // Must be imported before everything else
import { mockSqlExecuteReturn } from './kysely.helper.ts';

import { Kysely, sql } from 'kysely';

import { state } from '../../src/state.ts';
import {
  checkDatabaseHealth,
  checkDatabaseSchema,
  db,
  onLogEvent,
  onPoolError,
  shutdownDatabase
} from '../../src/db/database.ts';

import type { LogEvent, QueryId, RootOperationNode } from 'kysely';
import type { Mock } from 'vitest';
import type { DB } from '../../src/types/index.d.ts';

describe('db', () => {
  it('should yield a database', () => {
    expect(db).toBeDefined();
    expect(db).toBeInstanceOf(Kysely<DB>);
  });
});

describe('checkDatabaseHealth', () => {
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

describe('checkDatabaseSchema', () => {
  const getTablesSpy = vi.spyOn(db.introspection, 'getTables');

  it('should return true when the database schema matches the expected structure', async () => {
    getTablesSpy.mockResolvedValue(
      [
        { schema: 'audit', name: 'logged_actions' },
        { schema: 'pies', name: 'coding' },
        { schema: 'pies', name: 'process_event' },
        { schema: 'pies', name: 'record_kind' },
        { schema: 'pies', name: 'system' },
        { schema: 'pies', name: 'system_record' },
        { schema: 'pies', name: 'transaction' },
        { schema: 'pies', name: 'version' }
      ].map((r) => ({ ...r, isView: false, columns: [] }))
    );

    const result = await checkDatabaseSchema();

    expect(result).toBe(true);
    expect(getTablesSpy).toHaveBeenCalledTimes(1);
  });

  it('should return false when the database schema does not match the expected structure', async () => {
    getTablesSpy.mockResolvedValue(
      [
        { schema: 'audit', name: 'logged_actions' },
        { schema: 'audit', name: 'coding' } // Force a false situation with a different schema
      ].map((r) => ({ ...r, isView: false, columns: [] }))
    );

    const result = await checkDatabaseSchema();

    expect(result).toBe(false);
    expect(getTablesSpy).toHaveBeenCalledTimes(1);
  });

  it('should log an error and return false when introspection fails', async () => {
    getTablesSpy.mockRejectedValue(new Error('Introspection error'));

    const result = await checkDatabaseSchema();

    expect(result).toBe(false);
    expect(getTablesSpy).toHaveBeenCalledTimes(1);
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
