import { load } from 'js-yaml';
import { readFileSync } from 'node:fs';

import { state } from '../state.ts';

/** A partial OpenAPI specification schema structure */
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

/**
 * Generates a ReDocs HTML string for the documentation page of the NR
 * Permitting Exchange, Aggregation and Collection Hub (PEACH) API.
 * @param version - The version of the API documentation to display. Defaults to 'v1'.
 * @returns The HTML string for the documentation page.
 */
export function getDocHTML(version = 'v1'): string {
  return `<!DOCTYPE html>
  <html>
    <head>
      <title>NR Permitting Exchange, Aggregation and Collection Hub (PEACH) API - Documentation ${version}</title>
      <!-- Needed for adaptive design -->
      <meta charset="utf-8"/>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <link rel="icon" type="image/x-icon" href="/favicon.ico">
      <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">

      <!-- ReDoc doesn't change outer page styles -->
      <style>body { margin: 0; padding: 0; }</style>
    </head>
    <body>
      <redoc spec-url='/docs/openapi.yaml' />
      <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
    </body>
  </html>`;
}

/**
 * Gets the OpenAPI specification and updates security related fields based on the environment.
 * @returns The OpenAPI specification as an object
 */
export function getSpec(): OpenAPISpec {
  const rawSpec = readFileSync('src/docs/openapi.yaml', 'utf8');
  const spec = load(rawSpec) as OpenAPISpec;
  if (spec.servers?.[0]) spec.servers[0].url = '/api/v1';
  if (process.env.AUTH_ISSUER && spec.components.securitySchemes?.OpenID) {
    // eslint-disable-next-line max-len
    spec.components.securitySchemes.OpenID.openIdConnectUrl = `${process.env.AUTH_ISSUER}/.well-known/openid-configuration`;
  }
  if (state.authMode && state.authMode === 'none') {
    delete spec.security;
    delete spec.components.securitySchemes;
  }
  return spec;
}
