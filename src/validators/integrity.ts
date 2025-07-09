import { isValidCodeSystem, isValidCoding } from '../services/index.ts';
import { getUUIDv7Timestamp } from '../utils/index.ts';

import type {
  Event,
  Header,
  IntegrityDictionary,
  IntegrityError,
  IntegrityResult,
  IntegrityValidator,
  Process,
  ProcessEvent,
  ProcessEventSet,
  RecordLinkage
} from '../types/index.d.ts';

/** Defines immutable, idempotent integrity definitions mapping keys to values in `IntegrityDictionary`. */
export const IntegrityDefinitions: Record<keyof IntegrityDictionary, keyof IntegrityDictionary> = Object.freeze({
  processEventSet: 'processEventSet',
  recordLinkage: 'recordLinkage'
});

/** A collection of integrity validators for validating PIES data structures */
export const integrityValidators: IntegrityValidator<IntegrityDictionary> = {
  /**
   * Validates a `ProcessEventSet` object by checking the `code_system` and `code` fields in each `process_event`.
   * @param data - The `ProcessEventSet` object to validate.
   * @returns An `IntegrityResult` indicating whether the validation was successful and any errors encountered.
   */
  processEventSet: (data: ProcessEventSet) => {
    const errors: IntegrityError[] = [];

    checkHeader(data, errors);
    checkProcessEvent(data.process_event, errors);

    return { valid: !errors.length, errors: errors.length ? errors : undefined };
  },

  /**
   * Validates a `RecordLinkage` object.
   * @param data - The `RecordLinkage` object to validate.
   * @returns An `IntegrityResult` indicating whether the validation was successful and any errors encountered.
   */
  recordLinkage: (data: RecordLinkage) => {
    const errors: IntegrityError[] = [];

    checkHeader(data, errors);

    return { valid: !errors.length, errors: errors.length ? errors : undefined };
  }
};

/**
 * Checks the integrity of the `Event` element.
 * @param data - The `Event` object to validate.
 * @param index - The index of the `ProcessEvent` in the array being validated.
 * @param errors - An array to which any detected `IntegrityError` will be appended.
 */
export function checkEvent(data: Event, index: number, errors: IntegrityError[]) {
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
}

/**
 * Checks the integrity of the `Header` element.
 * @param data - The `Header` object to validate.
 * @param errors - An array to which any detected `IntegrityError` will be appended.
 */
export function checkHeader(data: Header, errors: IntegrityError[]) {
  const trxTimestamp = getUUIDv7Timestamp(data.transaction_id);
  if (trxTimestamp === undefined || trxTimestamp > Date.now()) {
    errors.push({
      instancePath: '/transaction_id',
      message: 'Invalid Header element',
      key: 'transaction_id',
      value: data.transaction_id
    });
  }
}

/**
 * Checks the integrity of the `Process` element.
 * @param data - The `Process` object to validate.
 * @param index - The index of the `ProcessEvent` in the array being validated.
 * @param errors - An array to which any detected `IntegrityError` will be appended.
 */
export function checkProcess(data: Process, index: number, errors: IntegrityError[]) {
  if (!isValidCodeSystem(data.code_system)) {
    errors.push({
      instancePath: `/process_event/${index}/process`,
      message: `Invalid Process in ProcessEvent element at index ${index}`,
      key: 'code_system',
      value: data.code_system
    });
  }
  if (!isValidCoding(data.code_system, data.code)) {
    errors.push({
      instancePath: `/process_event/${index}/process`,
      message: `Invalid Process in ProcessEvent element at index ${index}`,
      key: 'code',
      value: data.code
    });
  }
}

/**
 * Checks the integrity of the `ProcessEvent` element.
 * @param data - The `ProcessEvent` object to validate.
 * @param errors - An array to which any detected `IntegrityError` will be appended.
 */
export function checkProcessEvent(data: readonly ProcessEvent[], errors: IntegrityError[]) {
  data.forEach((pe, index) => {
    checkEvent(pe.event, index, errors);
    checkProcess(pe.process, index, errors);
  });
}

/**
 * Validates the integrity of the provided data based on the specified type.
 * @template K - A key of the `IntegrityMap` that specifies the type of validation to perform.
 * @param type - The type of integrity validation to apply, corresponding to a key in `IntegrityMap`.
 * @param data - The data to validate, which must match the type associated with the specified key in `IntegrityMap`.
 * @returns An `IntegrityResult` indicating the outcome of the validation.
 */
export function validateIntegrity<K extends keyof IntegrityDictionary>(
  type: K,
  data: IntegrityDictionary[K]
): IntegrityResult {
  return integrityValidators[type](data);
}
