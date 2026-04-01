import { load } from 'js-yaml';
import { readFileSync } from 'node:fs';

import { getDocHTML, getSpec } from '../../../src/docs/docs.ts';
import { state } from '../../../src/state.ts';

vi.mock('js-yaml', () => ({
  load: vi.fn()
}));

vi.mock('node:fs', () => ({
  readFileSync: vi.fn()
}));

vi.mock('../../../src/state.ts', () => ({
  state: { authMode: 'authn' }
}));

describe('getDocHTML', () => {
  it('should return a valid HTML string with the default version', () => {
    const result = getDocHTML();

    expect(result).toContain('<!DOCTYPE html>');
    expect(result).toContain('<html>');
    expect(result).toContain(
      '<title>NR Permitting Exchange, Aggregation and Collection Hub (PEACH) API - Documentation v1</title>'
    );
    // eslint-disable-next-line quotes
    expect(result).toContain("<redoc spec-url='/docs/openapi.yaml' />");
    expect(result).toContain('<script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>');
  });

  it('should return a valid HTML string with a custom version', () => {
    const version = 'v2';
    const result = getDocHTML(version);

    expect(result).toContain('<!DOCTYPE html>');
    expect(result).toContain('<html>');
    expect(result).toContain(
      `<title>NR Permitting Exchange, Aggregation and Collection Hub (PEACH) API - Documentation ${version}</title>`
    );
    // eslint-disable-next-line quotes
    expect(result).toContain("<redoc spec-url='/docs/openapi.yaml' />");
    expect(result).toContain('<script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>');
  });
});

describe('getSpec', () => {
  const mockSpec = {
    components: {
      securitySchemes: {
        OpenID: {
          openIdConnectUrl: 'default'
        }
      }
    },
    security: [],
    servers: [{ url: 'default' }]
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(readFileSync).mockReturnValue('yaml');
    vi.mocked(load).mockReturnValue(structuredClone(mockSpec));
    state.authMode = 'authn';
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should return the spec with updated server url', () => {
    const spec = getSpec();
    expect(readFileSync).toHaveBeenCalledWith('src/docs/openapi.yaml', 'utf8');
    expect(load).toHaveBeenCalledWith('yaml');
    expect(spec.servers?.[0]?.url).toBe('/api/v1');
  });

  it('should update openIdConnectUrl if AUTH_ISSUER is set', () => {
    vi.stubEnv('AUTH_ISSUER', 'https://auth.example.com');
    const spec = getSpec();
    expect(spec.components.securitySchemes?.OpenID.openIdConnectUrl).toBe(
      'https://auth.example.com/.well-known/openid-configuration'
    );
  });

  it('should remove security if authMode is none', () => {
    state.authMode = 'none';
    const spec = getSpec();
    expect(spec.security).toBeUndefined();
    expect(spec.components.securitySchemes).toBeUndefined();
  });
});
