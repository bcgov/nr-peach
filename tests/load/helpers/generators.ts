import { randomIntBetween, randomItem, uniqByKeepFirst, uuidv7 } from './utils.ts';
import { CodingDictionary } from '../../../src/utils/coding.ts';

import type { Event, Process, ProcessEvent, Record } from '../../../src/types/elements.d.ts';

/**
 * Generates a mock `Event` object with sample data.
 * @returns A generated event object with required and possibly optional datetime fields.
 */
export function generateEvent(): Event {
  const event = {} as Event;
  const start = new Date(Date.now() - randomIntBetween(0, 1000 * 60 * 60 * 24 * 30)).toISOString();
  const end = new Date().toISOString();
  if (randomIntBetween(0, 1)) {
    event.start_date = start.split('T')[0];
    if (randomIntBetween(0, 1)) {
      event.end_date = end.split('T')[0];
    }
  } else {
    event.start_datetime = start;
    if (randomIntBetween(0, 1)) {
      event.end_datetime = end;
    }
  }

  return event;
}

/**
 * Generates a mock `Process` object with sample data.
 * @returns A populated `Process` containing example process data.
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
 * Generates a mock `ProcessEvent` object for testing purposes.
 * @returns A populated `ProcessEvent` mock process event object.
 */
export function generateProcessEvent(): ProcessEvent {
  return {
    event: generateEvent(),
    process: generateProcess()
  };
}

/**
 * Generates a mock `Record` object with sample process events.
 * @param itsm - The ITSM identifier to associate with the process events.
 * @returns A populated `Record` containing example process events for testing or development purposes.
 */
export function generateRecord(itsm?: number): Record {
  const processEvents: ProcessEvent[] = [];
  for (let count = 0; count < randomIntBetween(1, 5); count++) {
    processEvents.push(generateProcessEvent());
  }

  return {
    transaction_id: uuidv7(),
    version: '0.1.0',
    kind: 'Record',
    system_id: `ITSM-${itsm ? itsm.toString() : randomIntBetween(1000, 99999).toString()}`,
    record_id: uuidv7(),
    record_kind: 'Permit',
    on_hold_event_set: [],
    process_event_set: uniqByKeepFirst(processEvents, (item) => item.process.code) as [ProcessEvent, ...ProcessEvent[]]
  };
}
