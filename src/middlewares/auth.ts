import { config } from 'dotenv';
import jwt from 'jsonwebtoken';

import { getAuthMode, getBearerToken, jwksClient, setAuthHeader } from './helpers/index.ts';
import { Problem } from '../utils/index.ts';

import type { RequestHandler, Response } from 'express';
import type { AuthErrorAttributes, LocalContext } from '../types/index.d.ts';

// Load environment variables, prioritizing .env over .env.default
config({ path: ['.env', '.env.default'], quiet: true });

/**
 * Middleware for authentication. Verifies the JWT Token in the Authorization header and ensures it is valid.
 * @see https://datatracker.ietf.org/doc/html/rfc6750
 * @returns An Express `RequestHandler` for authentication.
 */
export function authn(): RequestHandler {
  return async function (req, res: Response<unknown, LocalContext>, next): Promise<void> {
    if (getAuthMode() === 'none') return next();

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
        issuer: process.env.AUTH_ISSUER ?? ''
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
