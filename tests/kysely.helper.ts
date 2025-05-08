import type { Kysely } from 'kysely';

vi.mock('kysely', async (importActual) => ({
  ...(await importActual<typeof Kysely>()),
  Kysely: class {
    schema = {
      columns: vi.fn().mockReturnThis(),
      createIndex: vi.fn().mockReturnThis(),
      dropIndex: vi.fn().mockReturnThis(),
      execute: vi.fn((qb: Kysely<unknown>) => qb),
      on: vi.fn().mockReturnThis(),
      withSchema: vi.fn().mockReturnThis()
    };
  },
  sql: Object.assign(
    vi.fn((strings: TemplateStringsArray, ...values: unknown[]) => ({
      strings,
      values,
      execute: vi.fn((qb: Kysely<unknown>) => qb)
    })),
    {
      id: vi.fn((...args: unknown[]) => args),
      join: vi.fn((...args: unknown[]) => args),
      lit: vi.fn((arg: unknown) => arg),
      raw: vi.fn((arg: unknown) => arg),
      ref: vi.fn((arg: unknown) => arg),
      table: vi.fn((arg: unknown) => arg),
      val: vi.fn((arg: unknown) => arg)
    }
  )
}));
