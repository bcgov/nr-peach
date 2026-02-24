import { check } from 'k6';
import http from 'k6/http';

import { fetchBearerToken, generateRecord, parseEnv } from './helpers/index.ts';

const env = parseEnv();

/**
 * 1. Initialization
 */
const API_PATH = '/api/v1/records';
const BASE_URL = __ENV.BASE_URL ?? env.BASE_URL ?? 'http://localhost:3000';

export { options } from './helpers/index.ts';

/**
 * 2. Setup
 * @returns - Data created in setup to be used by VU execution
 */
export function setup() {
  // Initialize test data or state
  const token = fetchBearerToken();
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
  const res = http.put(`${BASE_URL}${API_PATH}`, JSON.stringify(body), {
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
 * 4. Teardown
 */
export function teardown() {
  // Cleanup actions after the test

  console.log('Test teardown complete'); // eslint-disable-line no-console
}
