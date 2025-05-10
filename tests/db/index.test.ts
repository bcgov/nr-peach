import { Kysely } from 'kysely';

import { db, dialectConfig, handleLogEvent } from '../../src/db/index.ts';

import type { LogEvent, QueryId, RootOperationNode } from 'kysely';
import type { Database } from '../../src/db/schema.d.js';

describe('dialectConfig', () => {
  it('should yield a dialectConfig', () => {
    expect(dialectConfig).toBeDefined();
    expect(dialectConfig).toHaveProperty('pool');
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
    expect(db).toBeInstanceOf(Kysely<Database>);
  });
});
