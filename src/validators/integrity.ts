import { isValidCodeSystem, isValidCoding } from '../services/coding.ts';

import type {
  IntegrityDictionary,
  IntegrityError,
  IntegrityResult,
  IntegrityValidator,
  ProcessEventSet,
  RecordLinkage
} from '../types/index.js';

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
    data.process_event.forEach((pe, index) => {
      const { process } = pe;
      if (!isValidCodeSystem(process.code_system)) {
        errors.push({
          instancePath: `/process_event/${index}/process`,
          message: `Invalid Process in ProcessEvent element at index ${index}`,
          key: 'code_system',
          value: process.code_system
        });
      }
      if (!isValidCoding(process.code_system, process.code)) {
        errors.push({
          instancePath: `/process_event/${index}/process`,
          message: `Invalid Process in ProcessEvent element at index ${index}`,
          key: 'code',
          value: process.code
        });
      }
    });
    return { valid: !errors.length, errors: errors.length ? errors : undefined };
  },
  // Nothing specific to validate above JSON schema validation for now

  /**
   * Validates a `RecordLinkage` object.
   * @param data - The `RecordLinkage` object to validate.
   * @returns An `IntegrityResult` indicating whether the validation was successful and any errors encountered.
   */
  recordLinkage: (data: RecordLinkage) => {
    return { valid: !!data, errors: undefined };
  }
};

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
