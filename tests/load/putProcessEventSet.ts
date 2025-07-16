import { check } from 'k6';
import http from 'k6/http';

import { generateProcessEventSet, options as k6opts } from './helpers/index.ts';

/**
 * 1. Initialization
 */
const API_PROCESS_EVENT = '/api/v1/process-events';
const BASE_URL = 'http://localhost:3000';

export const options = k6opts;

/**
 * 2. Setup
 */
// export function setup() {
//   // Initialize test data or state
//   console.log('Test setup complete'); // eslint-disable-line no-console
// }

/**
 * 3. VU Execution
 */
export default function () {
  const body = generateProcessEventSet(1111); // Add a number argument to pin the ITSM identifier if needed
  const res = http.put(`${BASE_URL}${API_PROCESS_EVENT}`, JSON.stringify(body), {
    headers: {
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
// export function teardown() {
//   // Cleanup actions after the test
//   console.log('Test teardown complete'); // eslint-disable-line no-console
// }
