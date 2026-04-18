import jwt from 'jsonwebtoken';
import { LRUCache } from 'lru-cache';

import { getBearerToken, getJwksClient, normalizeScopes, setAuthHeader } from './helpers/index.ts';
import { Problem } from '#src/utils/index';
import { state } from '#src/state';

import type {
  AuthErrorAttributes,
  AuthErrorCodes,
  AuthRequestHandler,
  AuthMethodRequestHandler,
  SystemSource
} from '#types';

/** A map of authentication error codes to HTTP status codes. */
const authStatusMap: Record<AuthErrorCodes, number> = {
  invalid_request: 400,
  invalid_token: 401,
  insufficient_scope: 403
};

// Create an LRU cache instance with a maximum size of 100 items and a TTL of 5 minutes
export const jwtCache = new LRUCache<string, jwt.JwtPayload>({ allowStale: false, max: 100, ttl: 1000 * 60 * 5 });

/**
 * Middleware for authentication. Checks the auth method (header, query or body) and expects header only to be present.
 * @see https://datatracker.ietf.org/doc/html/rfc6750#section-2
 * @returns An Express `RequestHandler` for authentication method validation.
 */
export function authm(): AuthMethodRequestHandler {
  return function (req, res, next): void {
    if (state.authMode === 'none') return next();

    const attributes: AuthErrorAttributes = { realm: process.env.AUTH_AUDIENCE ?? 'nr-peach' };
    try {
      if (req.query.access_token) throw new Error('Bearer token must not be provided in query parameters.');
      if (req.body?.access_token) throw new Error('Bearer token must not be provided in the request body.');
      if (!req.headers.authorization) throw new Error('Missing bearer token');

      next();
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      attributes.error_description = msg;
      new Problem(401, { detail: msg }, { realm: attributes.realm }).send(req, setAuthHeader(res, attributes));
    }
  };
}

/**
 * Middleware for authentication. Verifies the JWT Token in the Authorization header and ensures it is valid.
 * @see https://datatracker.ietf.org/doc/html/rfc6750
 * @returns An Express `RequestHandler` for authentication.
 */
export function authn(): AuthRequestHandler {
  return async function (req, res, next): Promise<void> {
    if (state.authMode === 'none') return next();

    const attributes: AuthErrorAttributes = { realm: process.env.AUTH_AUDIENCE ?? 'nr-peach' };
    try {
      const token = getBearerToken(req);
      if (!token) {
        attributes.error = 'invalid_request';
        throw new Error('Invalid bearer token');
      }
      res.locals.access_token = token;

      // Check cache first
      if (jwtCache.has(token)) {
        res.locals.access_claims = Object.freeze(jwtCache.get(token));
        return next();
      }

      // jwt.decode is used only to extract kid; claims are not trusted until verified
      const decoded = jwt.decode(token, { complete: true });
      if (!decoded || typeof decoded === 'string') {
        attributes.error = 'invalid_token';
        throw new Error('Unable to decode access token');
      }

      const jwksClient = await getJwksClient();
      const kid = await jwksClient.getSigningKey(decoded.header.kid);
      const claims = jwt.verify(token, kid.getPublicKey(), {
        algorithms: ['RS256'],
        audience: process.env.AUTH_AUDIENCE ?? 'nr-peach',
        issuer: process.env.AUTH_ISSUER
      });

      if (claims && typeof claims !== 'string') {
        const frozenClaims = Object.freeze(claims);
        res.locals.access_claims = frozenClaims;

        if (claims.exp) {
          const remainingMs = (claims.exp - Math.floor(Date.now() / 1000)) * 1000 - 5000;
          if (remainingMs > 0) jwtCache.set(token, frozenClaims, { ttl: remainingMs });
        }
      }

      next();
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      attributes.error_description = msg;
      new Problem(
        authStatusMap[attributes.error ?? 'invalid_token'],
        { detail: msg },
        { realm: attributes.realm }
      ).send(req, setAuthHeader(res, attributes));
    }
  };
}

/**
 * Middleware for authorization. Ensures the JWT token contains the required scope.
 * @see https://datatracker.ietf.org/doc/html/rfc6750
 * @param source - The source of the `system_id` (either 'body' or 'query').
 * @returns An Express `RequestHandler` for authorization.
 */
export function authz(source: SystemSource): AuthRequestHandler {
  return function (req, res, next): void {
    if (state.authMode && state.authMode !== 'authz') return next();

    const attributes: AuthErrorAttributes = { realm: process.env.AUTH_AUDIENCE ?? 'nr-peach' };
    const system_id = req[source].system_id;
    try {
      if (!system_id) {
        attributes.error = 'invalid_request';
        throw new Error(`Unable to determine required system_id scope from ${source}`);
      }
      attributes.scope = system_id;

      const claims = res.locals.access_claims;
      if (!claims) {
        attributes.error = 'invalid_token';
        throw new Error('Missing or invalid access token');
      }

      const scopes = normalizeScopes(claims.scope);
      if (!scopes.includes(system_id)) {
        attributes.error = 'insufficient_scope';
        throw new Error('Access token lacks required scope');
      }

      next();
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      attributes.error_description = msg;
      new Problem(
        authStatusMap[attributes.error ?? 'invalid_token'],
        { detail: msg },
        { realm: attributes.realm, scope: attributes.scope }
      ).send(req, setAuthHeader(res, attributes));
    }
  };
}
