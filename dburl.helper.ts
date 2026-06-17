#!/usr/bin/env node

import '#src/env';

const { PGDATABASE, PGHOST, PGPASSWORD, PGPORT, PGUSER } = process.env;
const missingVars = [
  !PGDATABASE && 'PGDATABASE',
  !PGHOST && 'PGHOST',
  !PGPASSWORD && 'PGPASSWORD',
  !PGPORT && 'PGPORT',
  !PGUSER && 'PGUSER'
].filter(Boolean);

if (missingVars.length > 0) {
  process.stdout.write(`Missing required environment variables: ${missingVars.join(', ')}\n`);
  process.exit(1);
}

/**
 * Constructs a PostgreSQL connection URL using environment variables into the format:
 * `postgresql://<user>:<password>@<host>:<port>/<database>`
 */
const url = `postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/${PGDATABASE}`;
process.stdout.write(url);
