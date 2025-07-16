import type { Options } from 'k6/options';

const MAX_VU = 10; // Maximum number of virtual users; 10 is a reasonable amount as it matches the pgpool default size

/**
 * Common k6 load test options configuration.
 *
 * This configuration defines the stages for ramping up, holding, and ramping down virtual users,
 * as well as thresholds for request duration and failure rates. If thresholds are breached,
 * the test will throw an error and may abort early based on the specified settings.
 */
export const options: Options = {
  stages: [
    { duration: '5s', target: MAX_VU }, // ramp up virtual users
    { duration: '20s', target: MAX_VU }, // hold virtual users
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
