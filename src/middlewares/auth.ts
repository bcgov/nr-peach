import jwt from 'jsonwebtoken';

import { getBearerToken, jwksClient, normalizeScopes, setAuthHeader } from './helpers/index.ts';
import { Problem } from '../utils/index.ts';
import { state } from '../state.ts';

import type { Request, RequestHandler, Response } from 'express';
import type { AuthErrorAttributes, AuthErrorCodes, LocalContext, SystemSource } from '../types/index.d.ts';

/** Default authentication error attributes */
const attributes: AuthErrorAttributes = { realm: process.env.AUTH_AUDIENCE ?? 'nr-peach', error: 'invalid_token' };

/** A map of authentication error codes to HTTP status codes. */
const authStatusMap: Record<AuthErrorCodes, number> = {
  invalid_request: 400,
  invalid_token: 401,
  insufficient_scope: 403
};

/**
 * Middleware for authentication. Verifies the JWT Token in the Authorization header and ensures it is valid.
 * @see https://datatracker.ietf.org/doc/html/rfc6750
 * @returns An Express `RequestHandler` for authentication.
 */
export function authn(): RequestHandler {
  return async function (req, res: Response<unknown, LocalContext>, next): Promise<void> {
    if (state.authMode && state.authMode === 'none') return next();

    try {
      const token = getBearerToken(req);
      if (token === undefined) {
        attributes.error = 'invalid_token';
        throw new Error('Missing bearer token');
      }
      if (token === null) {
        attributes.error = 'invalid_request';
        throw new Error('Invalid bearer token');
      }
      res.locals.token = token;

      // jwt.decode is used only to extract kid; claims are not trusted until verified
      const decoded = jwt.decode(token, { complete: true });
      if (!decoded || typeof decoded === 'string') {
        attributes.error = 'invalid_request';
        throw new Error('Unable to decode access token');
      }

      const kid = await jwksClient.getSigningKey(decoded.header.kid);
      const claims = jwt.verify(token, kid.getPublicKey(), {
        algorithms: ['RS256'],
        audience: process.env.AUTH_AUDIENCE ?? 'nr-peach',
        issuer: process.env.AUTH_ISSUER
      });
      if (claims && typeof claims !== 'string') res.locals.claims = Object.freeze(claims);

      next();
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      attributes.error_description = msg;
      new Problem(authStatusMap[attributes.error], { detail: msg }, { realm: attributes.realm }).send(
        req,
        setAuthHeader(res, attributes)
      );
    }
  };
}

/**
 * Middleware for authorization. Ensures the JWT token contains the required scope.
 * @see https://datatracker.ietf.org/doc/html/rfc6750
 * @param source - The source of the `system_id` (either 'body' or 'query').
 * @returns An Express `RequestHandler` for authorization.
 */
export function authz(source: SystemSource): RequestHandler {
  return function (
    req: Request<Record<string, string>, unknown, { system_id?: string }, { system_id?: string }>,
    res: Response<unknown, LocalContext>,
    next
  ): void {
    if (state.authMode && state.authMode !== 'authz') return next();

    const system_id = req[source].system_id;
    try {
      if (!system_id) {
        attributes.error = 'invalid_request';
        throw new Error(`Unable to determine required system_id scope from ${source}`);
      }
      attributes.scope = system_id;

      const claims = res.locals.claims;
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
        authStatusMap[attributes.error],
        { detail: msg },
        { realm: attributes.realm, scope: attributes.scope }
      ).send(req, setAuthHeader(res, attributes));
    }
  };
}
