import { check } from 'k6';
import http from 'k6/http';

import { fetchBearerToken, generateRecord, parseEnv } from './helpers/index.ts';

const env = parseEnv();

/**
 * 1. Initialization
 */
const API_RECORD = '/api/v1/records';
const API_SYSTEM_RECORD = '/api/v1/system-records';
const BASE_URL = __ENV.BASE_URL ?? env.BASE_URL ?? 'http://localhost:3000';
const CLIENT_ID = __ENV.CLIENT_ID ?? env.CLIENT_ID;
const CLIENT_SECRET = __ENV.CLIENT_SECRET ?? env.CLIENT_SECRET;
const MAX_RECORD_ID = +(__ENV.MAX_RECORD_ID ?? env.MAX_RECORD_ID ?? 50);
const RECORD_PREFIX = 'k6-test-';
const SYSTEM_ID = 'ITSM-5917';
const TOKEN_ENDPOINT = __ENV.CLIENT_SECRET ?? env.TOKEN_ENDPOINT;

export { options } from './helpers/index.ts';

/**
 * 2. Setup - initialize test data or state
 * @returns - Data created in setup to be used by VU execution
 */
export function setup() {
  const token = fetchBearerToken(CLIENT_ID, CLIENT_SECRET, TOKEN_ENDPOINT);
  console.log('Test setup complete'); // eslint-disable-line no-console

  return { token };
}

/**
 * 3. VU Execution
 * @param data - Data defined in setup()
 * @param data.token - Bearer token for authorization
 */
export default function main(data: { token: string }) {
  const body = generateRecord(5917); // Add a number argument to pin the ITSM identifier if needed
  const res = http.put(`${BASE_URL}${API_RECORD}`, JSON.stringify(body), {
    headers: {
      Authorization: `Bearer ${data.token}`,
      'Content-Type': 'application/json'
    }
  });
  if (!check(res, { 'status is 201': (res) => res.status === 201 })) {
    console.error(`Request failed with status ${res.status}`, res.body); // eslint-disable-line no-console
    console.warn('Request body:', body); // eslint-disable-line no-console
  }
}

/**
 * 4. Teardown - cleanup actions after the test
 * @param data - Data defined in setup()
 * @param data.token - Bearer token for authorization
 */
export function teardown(data: { token: string }) {
  for (let count = 1; count <= MAX_RECORD_ID; count++) {
    http.del(
      `${BASE_URL}${API_SYSTEM_RECORD}?record_id=${RECORD_PREFIX}${MAX_RECORD_ID}&system_id=${SYSTEM_ID}`,
      null,
      {
        headers: {
          Authorization: `Bearer ${data.token}`,
          'Content-Type': 'application/json'
        }
      }
    );
  }

  console.log('Test teardown complete'); // eslint-disable-line no-console
}
