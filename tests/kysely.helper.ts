import { Kysely } from 'kysely';

import type { KyselyConfig } from 'kysely';

vi.mock('kysely', async (importOriginal) => ({
  ...(await importOriginal<typeof Kysely>()),
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
