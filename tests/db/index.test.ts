import '../kysely.helper.ts'; // Must be imported before everything else
import { mockSqlExecuteReturn } from '../kysely.helper.ts';

import { Kysely, sql } from 'kysely';

import {
  checkDatabaseHealth,
  checkDatabaseSchema,
  db,
  dialectConfig,
  handleLogEvent
} from '../../src/db/index.ts';

import type { LogEvent, QueryId, RootOperationNode } from 'kysely';
import type { Mock } from 'vitest';
import type { DB } from '../../src/db/models.d.ts';

describe('dialectConfig', () => {
  it('should yield a dialectConfig', () => {
    expect(dialectConfig).toBeDefined();
    expect(dialectConfig).toHaveProperty('pool');
  });
});

describe('checkDatabaseHealth', () => {
  it('should return true when the database is healthy', async () => {
    (sql as unknown as Mock).mockImplementation(
      mockSqlExecuteReturn({ rows: [{ result: 1 }] })
    );
    const result = await checkDatabaseHealth();

    expect(sql).toHaveBeenCalledWith(['SELECT 1 AS result']);
    expect(result).toBe(true);
  });

  it('should return false and log an error when the database is unhealthy', async () => {
    (sql as unknown as Mock).mockImplementation(
      mockSqlExecuteReturn(Promise.reject(new Error('Database error')))
    );
    const result = await checkDatabaseHealth();

    expect(sql).toHaveBeenCalledWith(['SELECT 1 AS result']);
    expect(result).toBe(false);
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

describe('handleLogEvent', () => {
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

    handleLogEvent(event);
    expect(handleLogEvent(event)).toBeUndefined();
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

    handleLogEvent(event);
    expect(handleLogEvent(event)).toBeUndefined();
  });
});

describe('db', () => {
  it('should yield a database', () => {
    expect(db).toBeDefined();
    expect(db).toBeInstanceOf(Kysely<DB>);
  });
});
