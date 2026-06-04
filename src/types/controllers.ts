import type { JwtPayload } from 'jsonwebtoken';
import type { ParsedQs } from 'qs';

/** Represents the local context in which a request is processed by the application. */
export interface LocalContext {
  /** JWT claims associated with the current token. */
  access_claims?: JwtPayload & { azp?: string; scope?: string | string[] };

  /** The authentication bearer token used for the request. */
  access_token?: string;

  /** Content Security Policy nonce scoped to the response */
  cspNonce?: string;
}

/** An object that represents a typical query for a system record. */
export interface SystemRecordQuery extends ParsedQs {
  /** The ID of the record to be queried. */
  record_id: string;

  /** The ID of the system to which the record belongs. */
  system_id?: string;
}
