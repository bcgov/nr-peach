#!/usr/bin/env node

import './src/env.ts';

const { PGDATABASE, PGHOST, PGPASSWORD, PGPORT, PGUSER } = process.env;

if (!PGDATABASE || !PGHOST || !PGPASSWORD || !PGPORT || !PGUSER) {
  process.stdout.write('Missing required environment variables.');
  process.exit(1);
}

/**
 * Constructs a PostgreSQL connection URL using environment variables into the format:
 * `postgresql://<user>:<password>@<host>:<port>/<database>`
 */
const url = `postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/${PGDATABASE}`;
process.stdout.write(url);
