import type { RequestHandler } from 'express';
import type { LocalContext } from './controllers.d.ts';

/**
 * Represents an error that occurred during authentication.
 * @see https://datatracker.ietf.org/doc/html/rfc6750#section-3
 */
export interface AuthErrorAttributes {
  /** The realm associated with the error. */
  realm: string;

  /** The type of authentication error that occurred. */
  error?: AuthErrorCodes;

  /** A description of the error, if provided. */
  error_description?: string;

  /** Additional scope information, if provided. */
  scope?: string;
}

/**
 * Defines the possible error codes for authentication errors.
 * @see https://datatracker.ietf.org/doc/html/rfc6750#section-3.1
 */
export type AuthErrorCodes = 'invalid_request' | 'invalid_token' | 'insufficient_scope';

/** Defines Express RequestHandlers for authentication method identification middleware. */
export type AuthMethodRequestHandler = GenericRequestHandler<'access_token'>;

/**
 * Represents the authentication mode for the application.
 *
 * - `'authn'`: The application will perform authentication and signature verification.
 * - `'authz'`: The application will perform scoped authorization and authentication.
 * - `'none'`: The application will perform no authentication nor authorization.
 */
export type AuthMode = 'authn' | 'authz' | 'none';

/** Defines Express RequestHandlers for authentication and authorization middleware. */
export type AuthRequestHandler = GenericRequestHandler<'system_id'>;

/** A templated Express RequestHandler which accepts a named parameter to extend on */
export type GenericRequestHandler<T extends string, U = string> = RequestHandler<
  Record<string, string>, // Params
  unknown, // ResBody
  TokenBody<T, U>, // ReqBody
  TokenBody<T, U>, // Query
  LocalContext // Locals
>;

/** Represents the source of a system_id input, which can either be from the request body or query parameters. */
export type SystemSource = 'body' | 'query';

/**
 * Represents a constrained optional record type extension
 *
 * - TKey: The string literal for the token property name (such as 'access_token').
 * - TValue: The type of the token value (defaults to string).
 */
export type TokenBody<TKey extends string, TValue = string> = Partial<Record<TKey, TValue>>;
