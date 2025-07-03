import {
  CamelCasePlugin,
  DummyDriver,
  Kysely,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler
} from 'kysely';

import type { RootOperationNode } from 'kysely';
import type { DB } from '../../src/types/index.js';

/**
 * Returns an array of keys from the given object whose values are defined and truthy.
 * @param obj - The object to extract keys from.
 * @returns An array of keys whose corresponding values are truthy.
 */
export const getDefinedOperations = (obj: RootOperationNode) =>
  Object.entries(obj)
    .filter(([, value]) => !!value)
    .map(([key]) => key);

/**
 * Creates a mock Kysely database instance for testing purposes.
 * This mock database uses a dummy driver and Postgres dialect components,
 * along with a CamelCase plugin for column naming conventions.
 * - Intended for use in unit tests to simulate database interactions without a real database connection.
 * - The `DummyDriver` prevents actual database operations.
 */
export const mockDb = new Kysely<DB>({
  dialect: {
    createAdapter: () => new PostgresAdapter(),
    createDriver: () => new DummyDriver(),
    createIntrospector: (db) => new PostgresIntrospector(db),
    createQueryCompiler: () => new PostgresQueryCompiler()
  },
  plugins: [new CamelCasePlugin()]
});
