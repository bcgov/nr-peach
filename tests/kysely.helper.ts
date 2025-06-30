import { DummyDriver, Kysely, PostgresAdapter, PostgresIntrospector, PostgresQueryCompiler } from 'kysely';

import type { KyselyConfig } from 'kysely';
import type { DB } from '../src/types/index.d.ts';

vi.mock('kysely', async (importActual) => ({
  ...(await importActual<typeof Kysely>()),
  Kysely: class {
    introspection = {
      getTables: vi.fn()
    };
    schema = {
      columns: vi.fn().mockReturnThis(),
      createIndex: vi.fn().mockReturnThis(),
      dropIndex: vi.fn().mockReturnThis(),
      execute: vi.fn((qb: Kysely<unknown>) => qb),
      ifExists: vi.fn().mockReturnThis(),
      on: vi.fn().mockReturnThis(),
      withSchema: vi.fn().mockReturnThis()
    };
    destroy = vi.fn();
    // TODO: Figure out how to properly mock transaction call flow
    execute = vi.fn((cb: () => Kysely<unknown>) => cb());
    transaction = vi.fn(() => new Kysely({} as KyselyConfig));
    setIsolationLevel = vi.fn().mockReturnThis();
  },
  sql: Object.assign(vi.fn(), {
    id: vi.fn((...args: unknown[]) => args),
    join: vi.fn((...args: unknown[]) => args),
    lit: vi.fn((arg: unknown) => arg),
    raw: vi.fn((arg: unknown) => arg),
    ref: vi.fn((arg: unknown) => arg),
    table: vi.fn((arg: unknown) => arg),
    val: vi.fn((arg: unknown) => arg)
  })
}));

/**
 * Mock Kysely database instance for testing.
 * Uses a custom dialect with:
 * - `PostgresAdapter` for PostgreSQL features.
 * - `DummyDriver` as a placeholder driver.
 * - `PostgresIntrospector` for schema introspection.
 * - `PostgresQueryCompiler` for PostgreSQL query compilation.
 */
export const mockDb = new Kysely<DB>({
  dialect: {
    createAdapter() {
      return new PostgresAdapter();
    },
    createDriver() {
      return new DummyDriver();
    },
    createIntrospector(db) {
      return new PostgresIntrospector(db);
    },
    createQueryCompiler() {
      return new PostgresQueryCompiler();
    }
  }
});

/**
 * Mocks the execution of an SQL query by returning a function that simulates
 * the behavior of a tagged template literal for SQL queries.
 * @param result - The result to be returned when the `execute` function is called.
 * @returns A function that accepts a template string and its interpolated values,
 *          and returns an object containing the strings, values, and a mocked `execute` function.
 * @example
 * (sql as unknown as Mock).mockImplementation(
 *   mockSqlExecuteReturn({ rows: [{ result: 1 }] })
 * );
 */
export const mockSqlExecuteReturn = (result: unknown) => {
  return (strings: TemplateStringsArray, ...values: unknown[]) => ({
    strings,
    values,
    execute: vi.fn(() => result)
  });
};
