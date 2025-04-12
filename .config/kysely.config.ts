import { defineConfig } from 'kysely-ctl';

import { db } from '../src/db/index.ts';

export default defineConfig({
  kysely: db,
  migrations: { migrationFolder: 'src/db/migrations' },
  seeds: { seedFolder: 'src/db/seeds' }
});
