import { dialectConfig } from '../../src/db/index.ts';

import type { Pool } from 'pg';

describe('Database Configuration', () => {
  let pool: Pool;

  beforeAll(() => {
    pool = dialectConfig.pool as Pool;
  });

  afterAll(async () => {
    await pool.end();
  });

  it('should configure the pool with the correct settings', () => {
    const host = process.env.PGHOST;
    const database = process.env.PGDATABASE;
    const user = process.env.PGUSER;
    const password = process.env.PGPASSWORD;
    const port = +(process.env.PGPORT ?? 5432);
    const maxConnections = +(process.env.PGPOOL_MAX ?? 10);

    expect(pool.options.host).toBe(host);
    expect(pool.options.database).toBe(database);
    expect(pool.options.user).toBe(user);
    expect(pool.options.password).toBe(password);
    expect(pool.options.port).toBe(port);
    expect(pool.options.max).toBe(maxConnections);
  });
});
