import { check } from 'k6';
import http from 'k6/http';

import { generateProcessEventSet } from './helpers/index.ts';

import type { Options } from 'k6/options';

/**
 * 1. Initialization
 */
const API_PROCESS_EVENT = '/api/v1/process-events';
const BASE_URL = 'http://localhost:3000';

export const options: Options = {
  stages: [
    { duration: '5s', target: 10 }, // ramp up virtual users
    { duration: '20s', target: 10 }, // hold virtual users
    { duration: '5s', target: 0 } // ramp down virtual users
  ],
  thresholds: {
    http_req_duration: ['p(95)<100'], // 95% of requests should be below 100ms
    http_req_failed: [
      {
        threshold: 'rate<0.001', // http errors should be less than 0.1%
        abortOnFail: true, // Short circuit the test if this threshold is breached
        delayAbortEval: '1s' // Wait 1 second before aborting
      }
    ]
  },
  throw: true // Throw an error if a threshold is breached
};

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
  const options = {
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const body = generateProcessEventSet(); // Add a number argument to pin the ITSM identifier if needed
  const res = http.put(`${BASE_URL}${API_PROCESS_EVENT}`, JSON.stringify(body), options);
  if (!check(res, { 'status is 201': (res) => res.status === 201 })) {
    console.log(body); // eslint-disable-line no-console
    // eslint-disable-next-line no-console
    console.error(`Request failed with status ${res.status}: ${JSON.stringify(res.body)}`);
  }
}

/**
 * 4. Teardown
 */
// export function teardown() {
//   // Cleanup actions after the test
//   console.log('Test teardown complete'); // eslint-disable-line no-console
// }
