import type { ProcessEventSet } from '../../src/types/elements.ts';

/**
 * Generates a mock `ProcessEventSet` object with sample process events.
 * @returns A populated `ProcessEventSet` containing example process events for testing or development purposes.
 */
export function generateProcessEventSet(): ProcessEventSet {
  return {
    transaction_id: uuidv7(),
    version: '0.1.0',
    kind: 'ProcessEventSet',
    system_id: 'ITSM-5917',
    record_id: uuidv7(),
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
}

/**
 * Generates a UUID version 7 (UUIDv7) string.
 *
 * UUIDv7 is a time-ordered UUID format that includes a 48-bit timestamp (milliseconds since Unix epoch),
 * 12 bits of random data, and 62 bits of additional random data, following the draft specification:
 * https://datatracker.ietf.org/doc/html/draft-ietf-uuidrev-rfc4122bis-10#section-5.7
 *
 * The resulting UUID string is formatted as: `xxxxxxxx-xxxx-7xxx-yxxx-xxxxxxxxxxxx`
 * where:
 * - The first 12 hex digits represent the timestamp.
 * - The 13th hex digit is always '7' to indicate version 7.
 * - The 17th hex digit is set to one of '8', '9', 'a', or 'b' to indicate the variant.
 * - The remaining digits are random.
 * @returns A randomly generated UUIDv7 string.
 */
export function uuidv7(): string {
  const now = Date.now();
  const unixTsMs = BigInt(now);
  // UUIDv7: 48 bits timestamp, 12 bits random, 62 bits random
  // Layout: https://datatracker.ietf.org/doc/html/draft-ietf-uuidrev-rfc4122bis-10#section-5.7

  // 48 bits timestamp (milliseconds since Unix epoch)
  const tsHex = unixTsMs.toString(16).padStart(12, '0');

  // 12 bits random
  const rand12 = Math.floor(Math.random() * 0x1000)
    .toString(16)
    .padStart(3, '0');

  // 62 bits random (16 hex chars = 64 bits, but we use only 62 bits)
  const rand62 = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

  // Compose UUIDv7: xxxxxxxx-xxxx-7xxx-yxxx-xxxxxxxxxxxx
  // Version (7) in 13th hex digit, variant (10xx) in 17th hex digit
  const uuid =
    tsHex.slice(0, 8) +
    '-' +
    tsHex.slice(8, 12) +
    '-' +
    '7' +
    rand12.slice(0, 3) +
    '-' +
    ((parseInt(rand62[0], 16) & 0x3) | 0x8).toString(16) +
    rand62.slice(1, 4) +
    '-' +
    rand62.slice(4, 16);

  return uuid;
}
