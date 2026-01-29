import { Router } from 'express';
import helmet from 'helmet';
import { dump, load } from 'js-yaml';
import { readFileSync } from 'node:fs';

import { state } from '../state.ts';
import { getDocHTML } from '../docs/index.ts';

import type { Request, Response } from 'express';

interface OpenAPISpec {
  security?: [];
  servers: { url: string }[];
  components: {
    securitySchemes?: {
      OpenID: {
        openIdConnectUrl?: string;
      };
    };
  };
}

const router = Router();

/** OpenAPI Docs */
router.get(
  '/',
  helmet.contentSecurityPolicy({
    directives: {
      'connect-src': [
        "'self'", // eslint-disable-line quotes
        'https://raw.githubusercontent.com'
      ],
      // @ts-expect-error ts(2322)
      'img-src': [
        "'self'", // eslint-disable-line quotes
        'data:',
        (_req: Request, res: Response): string => `'nonce-${res.locals.cspNonce}'`,
        'https://cdn.redoc.ly'
      ],
      // @ts-expect-error ts(2322)
      'media-src': [
        "'self'", // eslint-disable-line quotes
        'data:',
        (_req: Request, res: Response): string => `'nonce-${res.locals.cspNonce}'`
      ],
      'script-src': [
        'blob:',
        "'unsafe-eval'" // eslint-disable-line quotes
      ],
      'script-src-elem': [
        'https://cdn.redoc.ly',
        "'unsafe-inline'" // eslint-disable-line quotes
      ]
    }
  }),
  (_req: Request, res: Response): void => {
    res.send(getDocHTML());
  }
);

/** OpenAPI YAML Spec */
router.get('/openapi.yaml', (_req: Request, res: Response): void => {
  res.status(200).type('application/yaml').send(dump(getSpec()));
});

/** OpenAPI JSON Spec */
router.get('/openapi.json', (_req: Request, res: Response): void => {
  res.status(200).json(getSpec());
});

/**
 * Gets the OpenAPI specification and updates security related fields based on the environment.
 * @returns The OpenAPI specification as an object
 */
function getSpec(): OpenAPISpec {
  const rawSpec = readFileSync('src/docs/openapi.yaml', 'utf8');
  const spec = load(rawSpec) as OpenAPISpec;
  spec.servers[0].url = '/api/v1';
  if (process.env.AUTH_ISSUER) {
    // eslint-disable-next-line max-len
    spec.components.securitySchemes!.OpenID.openIdConnectUrl = `${process.env.AUTH_ISSUER}/.well-known/openid-configuration`;
  }
  if (state.authMode && state.authMode === 'none') {
    delete spec.security;
    delete spec.components.securitySchemes;
  }
  return spec;
}

export default router;
