import type { Transaction } from 'kysely';
import type { DB } from '../../../src/types/index.d.ts';

/** Dynamically generate mocks for all repositories except BaseRepository */
vi.mock('../../../src/repositories/index.ts', async () => {
  const actual = await vi.importActual('../../../src/repositories/index.ts');
  return Object.assign(
    { ...actual },
    Object.fromEntries(
      Object.keys(actual)
        .filter((key) => key !== 'BaseRepository')
        .map((key) => [
          key,
          vi.fn(function () {
            return baseRepositoryMock;
          })
        ])
    )
  );
});

/** Mock the service helpers so that they are observable */
vi.mock('../../../src/services/helpers/index.ts', async () => {
  const actual = await vi.importActual('../../../src/services/helpers/index.ts');
  return {
    ...actual,
    cacheableRead: vi.fn(),
    cacheableUpsert: vi.fn(),
    dateTimePartsToEvent: vi.fn(),
    eventToDateTimeParts: vi.fn(),
    /** Spy on the transactionWrapper method to directly test its callback behaviour */
    transactionWrapper: vi.fn((operation: <T>(trx?: Transaction<DB>) => Promise<T>) => operation({} as Transaction<DB>))
  };
});

/** Mock implementation of the abstract base repository for unit testing */
export const baseRepositoryMock = {
  create: vi.fn(() => executeMock),
  createMany: vi.fn(() => executeMock),
  delete: vi.fn(() => executeMock),
  deleteMany: vi.fn(() => executeMock),
  findBy: vi.fn(() => executeMock),
  read: vi.fn(() => executeMock),
  upsert: vi.fn(() => executeMock),
  upsertMany: vi.fn(() => executeMock)
};

/** Mock implementation of the Kysely execute methods for unit testing */
export const executeMock = {
  execute: vi.fn(),
  executeTakeFirst: vi.fn(),
  executeTakeFirstOrThrow: vi.fn()
};
