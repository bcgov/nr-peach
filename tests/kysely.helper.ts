import type { Kysely } from 'kysely';

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
      on: vi.fn().mockReturnThis(),
      withSchema: vi.fn().mockReturnThis()
    };
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
