/** Dynamically generate mocks for all repositories except BaseRepository */
vi.mock('../../../src/repositories/index.ts', async () => {
  return Object.fromEntries(
    Object.keys(await vi.importActual('../../../src/repositories/index.ts'))
      .filter((key) => key !== 'BaseRepository')
      .map((key) => [key, vi.fn(() => baseRepositoryMock)])
  );
});

/** Spy on the transactionWrapper method to directly test its callback behaviour */
vi.mock('../../../src/services/helpers/repo.ts', () => ({
  transactionWrapper: vi.fn((operation: <T>() => Promise<T>) => operation())
}));

/** Mock implementation of the abstract base repository for unit testing */
export const baseRepositoryMock = {
  create: vi.fn(() => executeMock),
  createMany: vi.fn(() => executeMock),
  delete: vi.fn(() => executeMock),
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
