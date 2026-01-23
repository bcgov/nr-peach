import { config } from 'dotenv';
import jwt from 'jsonwebtoken';

import { getBearerToken, jwksClient, normalizeScopes, setAuthHeader } from './helpers/index.ts';
import { Problem } from '../utils/index.ts';
import { state } from '../state.ts';

import type { Request, RequestHandler, Response } from 'express';
import type { JwtPayload } from 'jsonwebtoken';
import type { AuthErrorAttributes, LocalContext, SystemSource } from '../types/index.d.ts';

// Load environment variables, prioritizing .env over .env.default
config({ path: ['.env', '.env.default'], quiet: true });

/**
 * Middleware for authentication. Verifies the JWT Token in the Authorization header and ensures it is valid.
 * @see https://datatracker.ietf.org/doc/html/rfc6750
 * @returns An Express `RequestHandler` for authentication.
 */
export function authn(): RequestHandler {
  return async function (req, res: Response<unknown, LocalContext>, next): Promise<void> {
    if (state.authMode === 'none') return next();

    try {
      const token = getBearerToken(req);
      if (!token) throw new Error('Missing or malformed bearer token');
      res.locals.token = token;

      // jwt.decode is used only to extract kid; claims are not trusted until verified
      const decoded = jwt.decode(token, { complete: true });
      if (!decoded || typeof decoded === 'string') throw new Error('Unable to decode access token');

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
      const attributes: AuthErrorAttributes = {
        realm: process.env.AUTH_AUDIENCE ?? 'nr-peach',
        error: 'invalid_token',
        error_description: msg
      };
      new Problem(401, { detail: msg }, { realm: attributes.realm }).send(req, setAuthHeader(res, attributes));
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
    if (state.authMode !== 'authz') return next();

    const attributes: AuthErrorAttributes = { realm: process.env.AUTH_AUDIENCE ?? 'nr-peach', error: 'invalid_token' };
    const system_id = req[source].system_id;
    try {
      if (!system_id) throw new Error('Unable to determine required scope');

      attributes.scope = system_id;
      const claims = res.locals.claims;
      if (!claims) throw new Error('Missing or invalid access token');

      attributes.error = 'insufficient_scope';
      const scopes = normalizeScopes((claims as JwtPayload & { scope?: string | string[] }).scope);
      if (!scopes.includes(system_id)) throw new Error('Access token lacks required scope');

      next();
    } catch (error) {
      const status = attributes.error === 'invalid_token' ? 401 : 403;
      const msg = error instanceof Error ? error.message : String(error);
      attributes.error_description = msg;
      new Problem(status, { detail: msg }, { realm: attributes.realm, scope: attributes.scope }).send(
        req,
        setAuthHeader(res, attributes)
      );
    }
  };
}
