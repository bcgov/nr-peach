import type { SchemaObject } from 'ajv';
import type { IncomingHttpHeaders } from 'node:http';

import type { Record as PiesRecord, RecordLinkage } from './elements.d.ts';

/** Type for validating the integrity of an object's properties. */
export type IntegrityValidator<T> = {
  [K in keyof T]: (value: T[K]) => IntegrityResult;
};

/** Options for validating parts of a request against `IntegrityDictionary` keys. */
export type RequestIntegrityOptions = Partial<
  Record<'body' | 'headers' | 'params' | 'query', keyof IntegrityDictionary>
>;

/** Options for validating different parts of an HTTP request. */
export type RequestSchemaOptions = Partial<{
  body: SchemaObject | string;
  headers: SchemaObject & IncomingHttpHeaders;
  params: SchemaObject;
  query: SchemaObject;
}>;

/** Describes an error encountered during data integrity validation. */
export interface IntegrityError {
  instancePath: string;
  message: string;
  key: string;
  params?: Record<string, unknown>;
  value: unknown;
}

/** Represents the result of an integrity validation process. */
export interface IntegrityResult {
  valid: boolean;
  errors?: IntegrityError[];
}

/** Represents a dictionary containing integrity-related configurations. */
export interface IntegrityDictionary {
  record: PiesRecord;
  recordLinkage: RecordLinkage;
}
