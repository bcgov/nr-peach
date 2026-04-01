import { defineConfig } from 'kysely-ctl';

import '#src/env';
import { db } from '#src/db/index';

export default defineConfig({
  kysely: db,
  migrations: { migrationFolder: 'src/db/migrations' },
  seeds: { seedFolder: 'src/db/seeds' }
});
