import { randomItem, uuidv7 } from './utils.ts';
import { CodingDictionary } from '../../../src/utils/coding.ts';

import type { Process, ProcessEventSet } from '../../../src/types/elements.d.ts';

/**
 * Generates a mock `Process` object with sample data.
 * @returns A populated `Process` containing example process data for testing or development purposes.
 */
export function generateProcess(): Process {
  const codeSystem = 'https://bcgov.github.io/nr-pies/docs/spec/code_system/application_process';
  const code = randomItem(Object.entries(CodingDictionary[codeSystem]));
  return {
    code: code[0],
    code_display: code[1].display,
    code_set: code[1].codeSet,
    code_system: codeSystem
  };
}

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
        process: generateProcess()
      },
      {
        event: {
          start_date: '2024-12-01',
          end_date: '2024-12-31'
        },
        process: generateProcess()
      },
      {
        event: {
          start_date: '2025-01-01'
        },
        process: generateProcess()
      }
    ]
  };
}
