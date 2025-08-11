#!/usr/bin/env node

import { config } from 'dotenv';

// Load environment variables, prioritizing .env over .env.default
config({ path: ['.env', '.env.default'], quiet: true });

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
