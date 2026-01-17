import type { JwtPayload } from 'jsonwebtoken';
import type { ParsedQs } from 'qs';

/** Represents the local context in which a request is processed by the application. */
export interface LocalContext {
  /** JWT claims associated with the current token. */
  claims?: JwtPayload;

  /** The authentication bearer token used for the request. */
  token?: string;
}

/** An object that represents a typical query for a system record. */
export interface SystemRecordQuery extends ParsedQs {
  /** The ID of the record to be queried. */
  record_id: string;

  /** The ID of the system to which the record belongs. */
  system_id?: string;
}
