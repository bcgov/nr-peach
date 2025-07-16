import { check } from 'k6';
import http from 'k6/http';

import { options as k6opts } from './helpers/index.ts';

/**
 * 1. Initialization
 */
const API_PROCESS_EVENT = '/api/v1/process-events';
const BASE_URL = 'http://localhost:3000';

export const options = k6opts;

/** @see https://raw.githubusercontent.com/bcgov/nr-pies/refs/heads/main/docs/spec/element/message/process_event_set.example.json */
const testRecord = {
  transaction_id: '01950719-b154-72f5-8437-5572df032a69',
  version: '0.1.0',
  kind: 'ProcessEventSet',
  system_id: 'ITSM-5917',
  record_id: '06bc53dc-3e4f-420b-801c-bd9cc0ea01b2',
  record_kind: 'Permit',
  process_event: [
    {
      event: {
        start_datetime: '2024-11-30T00:21:20.575Z'
      },
      process: {
        code: 'PRE_APPLICATION',
        code_display: 'Pre-Application',
        code_set: ['APPLICATION', 'PRE_APPLICATION'],
        code_system: 'https://bcgov.github.io/nr-pies/docs/spec/code_system/application_process'
      }
    },
    {
      event: {
        start_date: '2024-12-01',
        end_date: '2024-12-31'
      },
      process: {
        code: 'REFERRAL',
        code_set: ['APPLICATION', 'TECH_REVIEW_COMMENT', 'REFERRAL'],
        code_system: 'https://bcgov.github.io/nr-pies/docs/spec/code_system/application_process',
        status: 'Auditing',
        status_code: 'AU',
        status_description: 'The authorization request is under review by subject matter expert.'
      }
    },
    {
      event: {
        start_date: '2025-01-01'
      },
      process: {
        code: 'DISALLOWED',
        code_set: ['APPLICATION', 'DECISION', 'DISALLOWED'],
        code_system: 'https://bcgov.github.io/nr-pies/docs/spec/code_system/application_process',
        status: 'DeclinedConflict',
        status_description: 'The authorization request has not been allowed due to a conflict of interest.'
      }
    }
  ]
};

/**
 * 2. Setup
 */
export function setup() {
  // Initialize test data or state
  const res = http.get(
    `${BASE_URL}${API_PROCESS_EVENT}?record_id=06bc53dc-3e4f-420b-801c-bd9cc0ea01b2&system_id=ITSM-5917`
  );
  if (res.status === 404) {
    http.put(`${BASE_URL}${API_PROCESS_EVENT}`, JSON.stringify(testRecord), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  console.log('Test setup complete'); // eslint-disable-line no-console
}

/**
 * 3. VU Execution
 */
export default function () {
  const res = http.get(
    `${BASE_URL}${API_PROCESS_EVENT}?record_id=06bc53dc-3e4f-420b-801c-bd9cc0ea01b2&system_id=ITSM-5917`
  );
  if (!check(res, { 'status is 200': (res) => res.status === 200 })) {
    console.error(`Request failed with status ${res.status}`, res.body); // eslint-disable-line no-console
  }
}

/**
 * 4. Teardown
 */
// export function teardown() {
//   // Cleanup actions after the test
//   console.log('Test teardown complete'); // eslint-disable-line no-console
// }
