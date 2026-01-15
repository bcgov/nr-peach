import { config } from 'dotenv';
import jwksRsa from 'jwks-rsa';

import { getLogger } from '../../utils/index.ts';

import type { Request, Response } from 'express';
import type { AuthErrorAttributes, AuthMode } from '../../types/index.d.ts';

// Load environment variables, prioritizing .env over .env.default
config({ path: ['.env', '.env.default'], quiet: true });

const log = getLogger(import.meta.filename);

export const jwksClient = jwksRsa({
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 600000, // 10 minutes
  jwksRequestsPerMinute: 10,
  jwksUri: process.env.AUTH_JWKS_URI ?? '',
  rateLimit: true,
  timeout: 30000 // 30 seconds
});

/**
 * Determines the authentication mode based on environment variables.
 *
 * The function checks the `AUTH_MODE` environment variable and validates
 * the presence of `AUTH_ISSUER` and `AUTH_JWKS_URI`. If either `AUTH_ISSUER`
 * or `AUTH_JWKS_URI` is missing, the authentication mode is downgraded to 'none'.
 * Otherwise, it returns the mode if it matches one of the allowed values: 'authn', 'authz', or 'none'.
 * @returns The authentication mode, which can be 'authn', 'authz', or 'none'.
 */
export function getAuthMode(): AuthMode {
  const mode = process.env.AUTH_MODE?.toLowerCase();
  if (!process.env.AUTH_ISSUER || !process.env.AUTH_JWKS_URI) {
    log.warn('AUTH_MODE downgraded to none: missing AUTH_ISSUER or AUTH_JWKS_URI environment variables');
    return 'none';
  }
  return mode === 'authn' || mode === 'authz' || mode === 'none' ? mode : 'none';
}

/**
 * Extracts the Bearer token from the Authorization header of the request.
 * @param req - The Express request object.
 * @returns The Bearer token as a string, or null if not present.
 */
export function getBearerToken(req: Request): string | null {
  const auth = req.headers.authorization;
  return auth?.toLowerCase().startsWith('bearer ') ? auth.substring(7) : null;
}

/**
 * Normalizes the scope into an array of strings.
 * @param scope - The scope as a string, an array of strings, or undefined.
 * @returns An array of scope strings.
 */
export function normalizeScopes(scope: string | string[] | undefined): string[] {
  if (Array.isArray(scope)) return scope;
  return scope?.split(' ').filter(Boolean) ?? [];
}

/**
 * Sets the WWW-Authenticate header in the response to provide authentication error details.
 * @param res - The Express response object.
 * @param attributes - An object containing key-value pairs for the authentication error details.
 * @returns The modified response object with the set WWW-Authenticate header.
 */
export function setAuthHeader(res: Response, attributes: AuthErrorAttributes): Response {
  const headerValue = `Bearer ${Object.entries(attributes)
    .map(([k, v]) => `${k}="${v}"`)
    .join(', ')}`;
  return res.set('WWW-Authenticate', headerValue);
}
