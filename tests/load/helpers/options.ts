import { parseEnv } from './utils.ts';

import type { Options } from 'k6/options';

const env = parseEnv();

const MAX_VU = +(__ENV.MAX_VU ?? env.MAX_VU ?? 10);
const RAMP_DOWN_TIME = __ENV.RAMP_DOWN_TIME ?? env.RAMP_DOWN_TIME ?? '5s';
const RAMP_UP_TIME = __ENV.RAMP_UP_TIME ?? env.RAMP_UP_TIME ?? '5s';
const SUSTAIN_TIME = __ENV.SUSTAIN_TIME ?? env.SUSTAIN_TIME ?? '20s';

/**
 * Common k6 load test options configuration.
 *
 * This configuration defines the stages for ramping up, holding, and ramping down virtual users,
 * as well as thresholds for request duration and failure rates. If thresholds are breached,
 * the test will throw an error and may abort early based on the specified settings.
 */
export const options: Options = {
  stages: [
    { duration: RAMP_UP_TIME, target: MAX_VU }, // ramp up virtual users
    { duration: SUSTAIN_TIME, target: MAX_VU }, // hold virtual users
    { duration: RAMP_DOWN_TIME, target: 0 } // ramp down virtual users
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'], // 95% of requests should be below 200ms
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
