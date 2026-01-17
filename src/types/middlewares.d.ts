/**
 * Represents an error that occurred during authentication.
 * @see https://datatracker.ietf.org/doc/html/rfc6750
 */
export interface AuthErrorAttributes {
  /** The realm associated with the error. */
  realm: string;

  /**
   * The type of error that occurred.
   * @see https://datatracker.ietf.org/doc/html/rfc6750#section-3.1
   */
  error: string;

  /** A description of the error, if provided. */
  error_description?: string;

  /** Additional scope information, if provided. */
  scope?: string;
}

/**
 * Represents the authentication mode for the application.
 *
 * - `'authn'`: The application will perform authentication and signature verification.
 * - `'authz'`: The application will perform scoped authorization and authentication.
 * - `'none'`: The application will perform no authentication nor authorization.
 */
export type AuthMode = 'authn' | 'authz' | 'none';

/**
 * Represents the source of a system_id input, which can either be from the request body or query parameters.
 */
export type SystemSource = 'body' | 'query';
