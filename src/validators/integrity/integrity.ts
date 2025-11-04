import { auditHeader, auditProcessEvent } from './auditor.ts';

import type {
  IntegrityDictionary,
  IntegrityError,
  IntegrityValidator,
  Record as PiesRecord,
  RecordLinkage as PiesRecordLinkage
} from '../../types/index.d.ts';

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
  processEventSet: (data: PiesRecord) => {
    const errors: IntegrityError[] = [...auditHeader(data), ...auditProcessEvent(data.process_event_set)];

    return { valid: !errors.length, errors: errors.length ? errors : undefined };
  },

  /**
   * Validates a `RecordLinkage` object.
   * @param data - The `RecordLinkage` object to validate.
   * @returns An `IntegrityResult` indicating whether the validation was successful and any errors encountered.
   */
  recordLinkage: (data: PiesRecordLinkage) => {
    const errors: IntegrityError[] = [...auditHeader(data)];

    return { valid: !errors.length, errors: errors.length ? errors : undefined };
  }
};
