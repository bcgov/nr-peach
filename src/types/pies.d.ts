/**
 * This file was partially stubbed by quicktype using the PIES JSON Schema as a source.
 * @see https://app.quicktype.io/
 * @see https://bcgov.github.io/nr-pies/docs/category/message-types
 */
// TODO: Consider using a CLI invokable tool that can convert from JSON Schema to TypeScript interfaces.
// TODO: Is this the right place to put this file? Should we consider namespacing this under `@bcgov/nr-pies`?

/**
 * Represents an event concept. It allows either a date or a datetime, but not a mix of
 * both. One of the start properties is required, but the end properties are optional.
 */
export interface Event {
  /**
   * The end date of the event in YYYY-MM-DD format. This is optional if `start_date` is used.
   */
  end_date?: Date;
  /**
   * The end datetime of the event in ISO 8601 format. This is optional if `start_datetime` is
   * used.
   */
  end_datetime?: Date;
  /**
   * The start date of the event in YYYY-MM-DD format.
   */
  start_date?: Date;
  /**
   * The start datetime of the event in ISO 8601 format (e.g., 2024-12-01T10:00:00Z).
   */
  start_datetime?: Date;
}

export interface Header {
  /**
   * The specific kind of PIES message data type this message represents.
   */
  kind: Kind;
  /**
   * The record or primary key representing what the data this message is directly associated
   * to.
   */
  record_id: string;
  /**
   * The kind of record the source system stores this record as (i.e. Permit, Project,
   * Submission or Tracking).
   */
  record_kind: RecordKind;
  /**
   * A valid NRIDS IT Service Management code which identifies the source system, service or
   * asset that the data originates from.
   */
  system_id: string;
  /**
   * A unique UUIDv7 assigned for this specific message.
   */
  transaction_id: string;
  /**
   * The PIES specification version this message complies to. Value shall be a valid semantic
   * version formatted string.
   */
  version: string;
}

/**
 * The specific kind of PIES message data type this message represents.
 */
export type Kind = 'RecordLinkage' | 'ProcessEventSet';

/**
 * Represents a process tracking concept.
 *
 * A representation of a defined concept using a symbol from a defined Code System.
 */
export interface Process {
  /**
   * An optional description of the current condition or update of an application or
   * authorization. Additional details about the current state are frequently conveyed (e.g.,
   * 'Pending Review', 'Under Inspection'). Statuses may be defined by the line of business.
   */
  status?: string;
  /**
   * An optional codified representation of the status attribute. Status codes may be defined
   * by the line of business.
   */
  status_code?: string;
  /**
   * An optional description of the status if present.
   */
  status_description?: string;
  code: string;
  /**
   * A human-readable display name for the code value, intended for readability and not
   * computation.
   */
  code_display?: string;
  /**
   * An ordered set of code symbols, where the last element must match the code attribute. The
   * set must contain at least one symbol, preserve order, and not include duplicates.
   */
  code_set: string[];
  /**
   * An identifying URI string representing the source code system for the code value.
   */
  code_system: string;
}

/**
 * Represents a process concept at a specific event in time.
 */
export interface ProcessEvent {
  event: Event;
  process: Process;
}

/**
 * Represents a set of process concept at a specific event in time for a specific record.
 */
export interface ProcessEventSet extends Header {
  /**
   * An array of process events that are part of this set.
   */
  process_event: ProcessEvent[];
}

/**
 * The kind of record the source system stores this record as (i.e. Permit, Project,
 * Submission or Tracking).
 */
export type RecordKind = 'Permit' | 'Project' | 'Submission' | 'Tracking';

/**
 * Represents an assertion for a specific record to be related or linked together.
 */
export interface RecordLinkage extends Header {
  /**
   * The record or primary key representing what record should be linked with the primary
   * header record.
   */
  linked_record_id: string;
  /**
   * The kind of record the source system stores this linked record as (i.e. Permit, Project,
   * Submission or Tracking).
   */
  linked_record_kind: RecordKind;
  /**
   * A valid NRIDS IT Service Management code which identifies the source system, service or
   * asset that the linked data originates from.
   */
  linked_system_id: string;
}
