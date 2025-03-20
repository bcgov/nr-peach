import { defineConfig } from "kysely-ctl";

import { dialectConfig } from "../src/db";

export default defineConfig({
  dialect: "pg",
  dialectConfig,
  migrations: { migrationFolder: "src/db/migrations" },
  // plugins: [],
  // seeds: { seedFolder: "src/db/seeds" }
});
