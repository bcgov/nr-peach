import { check } from 'k6';
import http from 'k6/http';

import { generateProcessEventSet } from './generator.ts';

import type { Options } from 'k6/options';

/**
 * 1. Initialization
 */
const API_PROCESS_EVENT = '/api/v1/process-events';
const BASE_URL = 'http://localhost:3000';

export const options: Options = {
  stages: [
    { duration: '10s', target: 10 }, // ramp up to 10 users over 10 seconds
    { duration: '10s', target: 10 }, // stay at 10 users for 40 seconds
    { duration: '10s', target: 0 } // ramp down to 0 users over 10 seconds
  ],
  thresholds: {
    http_req_duration: ['p(95)<100'], // 95% of requests should be below 100ms
    http_req_failed: [
      {
        threshold: 'rate<0.001',
        abortOnFail: true,
        delayAbortEval: '1s'
      }
    ] // http errors should be less than 0.1%
  },
  throw: true,
  vus: 10
};

/**
 * 2. Setup
 */
export function setup() {
  // Initialize test data or state
  // eslint-disable-next-line no-console
  console.log('Test setup complete');
}

/**
 * 3. VU Execution
 */
export default function () {
  const options = {
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const body = generateProcessEventSet();
  const res = http.put(`${BASE_URL}${API_PROCESS_EVENT}`, JSON.stringify(body), options);
  check(res, { 'status is 201': (res) => res.status === 201 });
}

/**
 * 4. Teardown
 */
export function teardown() {
  // Cleanup actions after the test
  // eslint-disable-next-line no-console
  console.log('Test teardown complete');
}
