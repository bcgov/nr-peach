import { defineConfig } from 'kysely-ctl';

import './src/env.ts';
import { db } from './src/db/index.ts';

export default defineConfig({
  kysely: db,
  migrations: { migrationFolder: 'src/db/migrations' },
  seeds: { seedFolder: 'src/db/seeds' }
});
