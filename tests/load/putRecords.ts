import { check } from 'k6';
import http from 'k6/http';

import { fetchBearerToken, generateRecord } from './helpers/index.ts';

/**
 * 1. Initialization
 */
const API_PROCESS_EVENT = '/api/v1/records';
const BASE_URL = 'http://localhost:3000';

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
  const res = http.put(`${BASE_URL}${API_PROCESS_EVENT}`, JSON.stringify(body), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${data.token}`
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
