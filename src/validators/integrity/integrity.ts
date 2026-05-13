import { auditHeader, auditOnHoldEvent, auditProcessEvent } from './auditor.ts';

import type {
  IntegrityDictionary,
  IntegrityError,
  IntegrityValidator,
  Record as PiesRecord,
  RecordLinkage
} from '#types';

/** Defines immutable, idempotent integrity definitions mapping keys to values in `IntegrityDictionary`. */
export const IntegrityDefinitions: Record<keyof IntegrityDictionary, keyof IntegrityDictionary> = Object.freeze({
  record: 'record',
  recordLinkage: 'recordLinkage'
});

/** A collection of integrity validators for validating PIES data structures */
export const integrityValidators: IntegrityValidator<IntegrityDictionary> = {
  /**
   * Validates a `Record` object.
   * @param data - The `Record` object to validate.
   * @returns An `IntegrityResult` indicating whether the validation was successful and any errors encountered.
   */
  record: (data: PiesRecord) => {
    const errors: IntegrityError[] = [
      ...auditHeader(data),
      ...auditOnHoldEvent(data.on_hold_event_set),
      ...auditProcessEvent(data.process_event_set)
    ];

    return { valid: !errors.length, errors: errors.length ? errors : undefined };
  },

  /**
   * Validates a `RecordLinkage` object.
   * @param data - The `RecordLinkage` object to validate.
   * @returns An `IntegrityResult` indicating whether the validation was successful and any errors encountered.
   */
  recordLinkage: (data: RecordLinkage) => {
    const errors: IntegrityError[] = [...auditHeader(data)];

    return { valid: !errors.length, errors: errors.length ? errors : undefined };
  }
};
