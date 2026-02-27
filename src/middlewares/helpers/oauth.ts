import jwksRsa from 'jwks-rsa';

import { getLogger } from '../../utils/index.ts';

import type { Request, Response } from 'express';
import type { JwksClient } from 'jwks-rsa';
import type { AuthErrorAttributes } from '../../types/index.d.ts';

const log = getLogger(import.meta.filename);

let jwksClientPromise: Promise<JwksClient> | null = null;
let jwksUriPromise: Promise<string> | null = null;

/**
 * Extracts a valid bearer token from the Authorization header of the request.
 * @see https://datatracker.ietf.org/doc/html/rfc6750#section-2.1
 * @param req - The Express request object.
 * @returns The valid bearer token as a string, undefined if not present, or null if invalid.
 */
export function getBearerToken(req: Request): string | undefined | null {
  const auth = req.headers.authorization;
  if (auth === undefined) return undefined;

  const parts = auth.trim().split(' ');
  const [scheme, token] = parts;
  if (parts.length !== 2 || scheme !== 'Bearer') return null;

  return /^[A-Za-z0-9\-._~+/]+=*$/.test(token) ? token : null; // RFC 6750 Section 2.1
}

/**
 * Yields an instance of the JWKS client using the provided configuration
 * @returns An instance of the JWKS client
 */
export async function getJwksClient(): Promise<JwksClient> {
  if (jwksClientPromise) {
    log.debug('Fetching JWKS Client (cached)');
    return jwksClientPromise;
  }

  // Promise lock to prevent multiple concurrent lookups.
  jwksClientPromise = (async () => {
    log.debug('Fetching JWKS Client...');
    return jwksRsa({
      cache: true,
      cacheMaxEntries: 5,
      cacheMaxAge: 600000, // 10 minutes
      jwksRequestsPerMinute: 10,
      jwksUri: await getJwksUri(),
      rateLimit: true,
      timeout: 30000 // 30 seconds
    });
  })();

  return jwksClientPromise;
}

/**
 * Yields the JWKS URI from an OpenID Provider's configuration information.
 * @see https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderConfig
 * @returns The jwks_uri string from the configuration
 * @throws {Error} If fetch fails or jwks_uri is unresolvable
 */
export async function getJwksUri(): Promise<string> {
  if (jwksUriPromise) {
    log.debug('Fetching JWKS URI (cached)');
    return jwksUriPromise;
  }

  // Promise lock to prevent multiple concurrent lookups.
  jwksUriPromise = (async () => {
    log.debug('Fetching JWKS URI...');
    const issuer = process.env.AUTH_ISSUER;
    if (!issuer) throw new Error('AUTH_ISSUER is not set');

    const configurationUrl = new URL(
      '.well-known/openid-configuration',
      issuer.endsWith('/') ? issuer : `${issuer}/`
    ).toString();
    const res = await fetch(configurationUrl);
    if (!res.ok) throw new Error(`Failed to load OIDC Provider configuration: ${res.status} ${res.statusText}`);

    const configuration = (await res.json()) as { jwks_uri?: string };
    if (typeof configuration.jwks_uri !== 'string') {
      throw new TypeError('`jwks_uri` missing or invalid in OIDC Provider configuration');
    }

    return configuration.jwks_uri;
  })();

  return jwksUriPromise;
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
 * @see https://datatracker.ietf.org/doc/html/rfc6750#section-3
 * @see https://datatracker.ietf.org/doc/html/rfc7230#section-3.2.4
 * @param res - The Express response object.
 * @param attributes - An object containing key-value pairs for the authentication error details.
 * @returns The modified response object with the set WWW-Authenticate header.
 */
export function setAuthHeader(res: Response, attributes: AuthErrorAttributes): Response {
  const headerValue = `Bearer ${Object.entries(attributes)
    // Drop undefined pairs and non-US-ASCII encoded values (RFC 7230 Section 3.2.4)
    .filter(([k, v]) => k && v && /^[\u0020-\u007E]*$/.test(v as string))
    // Escape double quotes and backslashes in values
    .map(([k, v]) => {
      const value = (v as string).replaceAll('\\', String.raw`\\`).replaceAll('"', String.raw`\"`);
      return `${k}="${value}"`;
    })
    .join(', ')}`;
  return res.set('WWW-Authenticate', headerValue);
}
