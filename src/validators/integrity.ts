import { isValidCodeSystem, isValidCoding } from '../services/coding.ts';

import type { ProcessEventSet, RecordLinkage } from '../types/index.js';

export type IntegrityValidator<T> = { [K in keyof T]: (data: T[K]) => IntegrityResult };
export interface IntegrityError {
  instancePath: string;
  message: string;
  key: string;
  value: unknown;
}
export interface IntegrityResult {
  valid: boolean;
  errors?: IntegrityError[];
}
export interface IntegrityDictionary {
  processEventSet: ProcessEventSet;
  recordLinkage: RecordLinkage;
}

export const IntegrityDefinitions: Record<keyof IntegrityDictionary, keyof IntegrityDictionary> = Object.freeze({
  processEventSet: 'processEventSet',
  recordLinkage: 'recordLinkage'
});

/** Integrity validation functions for verifying the correctness of specific data structures. */
export const integrityValidators: IntegrityValidator<IntegrityDictionary> = {
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
    return { valid: !!errors.length, errors: errors.length ? errors : undefined };
  },
  // Nothing specific to validate above JSON schema validation for now
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  recordLinkage: (data: RecordLinkage) => ({ valid: true, errors: undefined })
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
