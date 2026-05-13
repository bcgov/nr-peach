import { CodingDictionary, getUUIDv7Timestamp } from '#src/utils/index';

import type { CodingEvent, Event, Header, IntegrityError, Process, ProcessEvent } from '#types';

/** A Set containing the keys of the `coding` object, representing all available code systems. */
const codeSystemCache = new Set<keyof typeof CodingDictionary>(Object.keys(CodingDictionary));
/** Caches sets of codes for each code system. */
const codeSetCache: Record<string, Set<string>> = {};
for (const codeSystem of codeSystemCache) {
  const codes = CodingDictionary[codeSystem];
  if (codes) codeSetCache[codeSystem] = new Set(Object.keys(codes));
}

/**
 * audits the integrity of the `Event` element.
 * @param data - The `Event` object to validate.
 * @param index - The index of the element in the array being validated.
 * @param parentPath - The path of the parent array containing the event being validated.
 * @returns An array of detected `IntegrityError`s.
 */
export function auditEvent(data: Event, index: number, parentPath: string): IntegrityError[] {
  const errors: IntegrityError[] = [];
  const { start_datetime, start_date, end_datetime, end_date } = data;
  const eventStart = start_datetime ?? start_date;
  const eventEnd = end_datetime ?? end_date;
  if (eventEnd && eventEnd < eventStart) {
    errors.push({
      instancePath: `/${parentPath}/${index}/event`,
      message: `Invalid Event element in ${parentPath} at index ${index}`,
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
  const parentPath = 'transaction_id';
  const errors: IntegrityError[] = [];
  const trxTimestamp = getUUIDv7Timestamp(data.transaction_id);
  if (trxTimestamp === undefined || trxTimestamp > Date.now()) {
    errors.push({
      instancePath: `/${parentPath}`,
      message: 'Invalid Header element',
      key: 'transaction_id',
      value: data.transaction_id
    });
  }
  return errors;
}

/**
 * Audits the integrity of the `OnHoldEvent` element, including duplicate checks.
 * @param data - The `OnHoldEvent` array to validate.
 * @returns An array of detected `IntegrityError`s.
 */
export function auditOnHoldEvent(data?: readonly CodingEvent[]): IntegrityError[] {
  const parentPath = 'on_hold_event_set';

  return data?.flatMap((ohe, index) => auditEvent(ohe.event, index, parentPath)) ?? [];
}

/**
 * Audits the integrity of the `Process` element.
 * @param data - The `Process` object to validate.
 * @param index - The index of the element in the array being validated.
 * @param parentPath - The path of the parent array containing the process being validated.
 * @returns An array of detected `IntegrityError`s.
 */
export function auditProcess(data: Process, index: number): IntegrityError[] {
  const parentPath = 'process_event_set';

  const errors: IntegrityError[] = [];
  if (!codeSystemCache.has(data.code_system)) {
    errors.push({
      instancePath: `/${parentPath}/${index}/process`,
      message: `Invalid Process element in ${parentPath} at index ${index}`,
      key: 'code_system',
      value: data.code_system
    });
  }
  if (!codeSystemCache.has(data.code_system) || !codeSetCache[data.code_system]?.has(data.code)) {
    errors.push({
      instancePath: `/${parentPath}/${index}/process`,
      message: `Invalid Process element in ${parentPath} at index ${index}`,
      key: 'code',
      value: data.code
    });
  }
  return errors;
}

/**
 * Audits the integrity of the `ProcessEvent` element, including duplicate checks.
 * @param data - The `ProcessEvent` array to validate.
 * @returns An array of detected `IntegrityError`s.
 */
export function auditProcessEvent(data?: readonly ProcessEvent[]): IntegrityError[] {
  const parentPath = 'process_event_set';

  const codeInstanceMap = new Map<string, number[]>();
  const errors: IntegrityError[] = [];
  if (!data) return errors;

  data.forEach((pe, index) => {
    if (!pe) return;

    errors.push(...auditEvent(pe.event, index, parentPath), ...auditProcess(pe.process, index));

    const code = pe.process.code;
    const indices = codeInstanceMap.get(code) ?? [];
    indices.push(index);
    codeInstanceMap.set(code, indices);
  });

  codeInstanceMap.forEach((indices, code) => {
    if (indices.length > 1) {
      const list = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' }).format(indices.map(String));
      errors.push({
        instancePath: `/${parentPath}`,
        key: 'process.code',
        params: {
          duplicateCount: indices.length,
          duplicateIndices: indices
        },
        value: code,
        message: `must NOT have duplicate items (items ${list} are identical)`
      });
    }
  });

  return errors;
}
