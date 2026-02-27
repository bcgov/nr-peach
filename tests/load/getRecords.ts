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
const RECORD_ID = 'k6-test-1';
const SYSTEM_ID = 'ITSM-5917';
const TOKEN_ENDPOINT = __ENV.CLIENT_SECRET ?? env.TOKEN_ENDPOINT;

export { options } from './helpers/index.ts';

/**
 * 2. Setup - initialize test data or state
 * @returns - Data created in setup to be used by VU execution
 */
export function setup() {
  const token = fetchBearerToken(CLIENT_ID, CLIENT_SECRET, TOKEN_ENDPOINT);
  const res = http.get(`${BASE_URL}${API_RECORD}?record_id=${RECORD_ID}&system_id=${SYSTEM_ID}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    responseCallback: http.expectedStatuses(200, 404)
  });
  if (res.status === 404) {
    /** @see https://raw.githubusercontent.com/bcgov/nr-pies/refs/heads/main/docs/spec/element/message/record.example.json */
    const testRecord = generateRecord(5917, RECORD_ID);
    http.put(`${BASE_URL}${API_RECORD}`, JSON.stringify(testRecord), {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  }

  console.log('Test setup complete'); // eslint-disable-line no-console
  return { token };
}

/**
 * 3. VU Execution
 * @param data - Data defined in setup()
 * @param data.token - Bearer token for authorization
 */
export default function main(data: { token: string }) {
  const res = http.get(`${BASE_URL}${API_RECORD}?record_id=${RECORD_ID}&system_id=${SYSTEM_ID}`, {
    headers: {
      Authorization: `Bearer ${data.token}`,
      'Content-Type': 'application/json'
    }
  });
  if (!check(res, { 'status is 200': (res) => res.status === 200 })) {
    console.error(`Request failed with status ${res.status}`, res.body); // eslint-disable-line no-console
  }
}

/**
 * 4. Teardown - Cleanup actions after the test
 * @param data - Data defined in setup()
 * @param data.token - Bearer token for authorization
 */
export function teardown(data: { token: string }) {
  http.del(`${BASE_URL}${API_SYSTEM_RECORD}?record_id=${RECORD_ID}&system_id=${SYSTEM_ID}`, null, {
    headers: {
      Authorization: `Bearer ${data.token}`,
      'Content-Type': 'application/json'
    }
  });

  console.log('Test teardown complete'); // eslint-disable-line no-console
}
