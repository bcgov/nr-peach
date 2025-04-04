import { defineConfig } from 'kysely-ctl';

import { db } from '../src/db';

export default defineConfig({
  kysely: db,
  migrations: { migrationFolder: 'src/db/migrations' },
  seeds: { seedFolder: 'src/db/seeds' }
});
