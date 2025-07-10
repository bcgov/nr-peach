import { CodingDictionary, getUUIDv7Timestamp } from '../../utils/index.ts';
import type { Event, Header, IntegrityError, Process, ProcessEvent } from '../../types/index.d.ts';

/** A Set containing the keys of the `coding` object, representing all available code systems. */
const codeSystemCache = new Set<keyof typeof CodingDictionary>(Object.keys(CodingDictionary));
/** Caches sets of codes for each code system. */
const codeSetCache: Record<string, Set<string>> = {};
for (const codeSystem of codeSystemCache) {
  codeSetCache[codeSystem] = new Set(Object.keys(CodingDictionary[codeSystem]));
}

/**
 * audits the integrity of the `Event` element.
 * @param data - The `Event` object to validate.
 * @param index - The index of the `ProcessEvent` in the array being validated.
 * @returns An array of detected `IntegrityError`s.
 */
export function auditEvent(data: Event, index: number): IntegrityError[] {
  const errors: IntegrityError[] = [];
  const { start_datetime, start_date, end_datetime, end_date } = data;
  const eventStart = start_datetime ?? start_date!;
  const eventEnd = end_datetime ?? end_date;
  if (eventEnd && eventEnd < eventStart) {
    errors.push({
      instancePath: `/process_event/${index}/event`,
      message: `Invalid Event in ProcessEvent element at index ${index}`,
      key: end_datetime ? 'end_datetime' : 'end_date',
      value: end_datetime ?? end_date
    });
  }
  return errors;
}

/**
 * audits the integrity of the `Header` element.
 * @param data - The `Header` object to validate.
 * @returns An array of detected `IntegrityError`s.
 */
export function auditHeader(data: Header): IntegrityError[] {
  const errors: IntegrityError[] = [];
  const trxTimestamp = getUUIDv7Timestamp(data.transaction_id);
  if (trxTimestamp === undefined || trxTimestamp > Date.now()) {
    errors.push({
      instancePath: '/transaction_id',
      message: 'Invalid Header element',
      key: 'transaction_id',
      value: data.transaction_id
    });
  }
  return errors;
}

/**
 * Audits the integrity of the `Process` element.
 * @param data - The `Process` object to validate.
 * @param index - The index of the `ProcessEvent` in the array being validated.
 * @returns An array of detected `IntegrityError`s.
 */
export function auditProcess(data: Process, index: number): IntegrityError[] {
  const errors: IntegrityError[] = [];
  if (!codeSystemCache.has(data.code_system)) {
    errors.push({
      instancePath: `/process_event/${index}/process`,
      message: `Invalid Process in ProcessEvent element at index ${index}`,
      key: 'code_system',
      value: data.code_system
    });
  }
  if (!codeSystemCache.has(data.code_system) || !codeSetCache[data.code_system].has(data.code)) {
    errors.push({
      instancePath: `/process_event/${index}/process`,
      message: `Invalid Process in ProcessEvent element at index ${index}`,
      key: 'code',
      value: data.code
    });
  }
  return errors;
}

/**
 * Audits the integrity of the `ProcessEvent` element.
 * @param data - The `ProcessEvent` array to validate.
 * @returns An array of detected `IntegrityError`s.
 */
export function auditProcessEvent(data: readonly ProcessEvent[]): IntegrityError[] {
  return data.flatMap((pe, index) => [...auditEvent(pe.event, index), ...auditProcess(pe.process, index)]);
}
