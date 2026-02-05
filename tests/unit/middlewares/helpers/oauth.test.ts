import { getBearerToken, normalizeScopes, setAuthHeader } from '../../../../src/middlewares/helpers/oauth.ts';

import type { Request, Response } from 'express';
import type { JwksClient } from 'jwks-rsa';
import type { AuthErrorAttributes } from '../../../../src/types/index.d.ts';

describe('getBearerToken', () => {
  it('extracts the Bearer token from the Authorization header', () => {
    const req = {
      headers: {
        authorization: 'Bearer exampletokenvalue'
      }
    } as Request;

    const result = getBearerToken(req);

    expect(result).toBe('exampletokenvalue');
  });

  it('returns undefined if the Authorization header is not present', () => {
    const req = {
      headers: {}
    } as Request;

    const result = getBearerToken(req);

    expect(result).toBeUndefined();
  });

  it('returns null if the Authorization header does not start with "Bearer"', () => {
    const req = {
      headers: {
        authorization: 'Basic exampletokenvalue'
      }
    } as Request;

    const result = getBearerToken(req);

    expect(result).toBeNull();
  });

  it('returns null if the Authorization header does not start with "Bearer"', () => {
    const req = {
      headers: {
        authorization: 'Bearer invalidtokenvalue!'
      }
    } as Request;

    const result = getBearerToken(req);

    expect(result).toBeNull();
  });
});

// Note: This is a semi-brittle test suite that hits both getJwksClient and getJwksUri
describe('getJwksClient', () => {
  let getJwksClient: () => Promise<JwksClient>;

  beforeEach(async () => {
    vi.resetModules();
    vi.unstubAllGlobals();
    delete (global as Record<string, unknown>).jwksClientPromise;
    getJwksClient = (await import('../../../../src/middlewares/helpers/oauth.ts')).getJwksClient;
    process.env.AUTH_ISSUER = 'https://auth.example.com/';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('creates a JWKS client with the correct configuration', async () => {
    const mockUri = 'https://auth.example.com/.well-known/jwks.json';

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValueOnce({ jwks_uri: mockUri })
    });

    const client = await getJwksClient();

    expect(client).toBeDefined();
    expect(global.fetch).toHaveBeenCalledWith('https://auth.example.com/.well-known/openid-configuration');
  });

  it('returns cached promise on subsequent calls', async () => {
    const mockUri = 'https://auth.example.com/.well-known/jwks.json';

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValueOnce({ jwks_uri: mockUri })
    });

    const client1 = await getJwksClient();
    const client2 = await getJwksClient();

    expect(client1).toBe(client2);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('throws an error if getJwksUri fails', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    });

    await expect(getJwksClient()).rejects.toThrow('Failed to load OIDC Provider configuration');
  });
});

describe('getJwksUri', () => {
  let getJwksUri: () => Promise<string>;

  beforeEach(async () => {
    vi.resetModules();
    vi.unstubAllGlobals();
    delete (global as Record<string, unknown>).jwksUriPromise;
    getJwksUri = (await import('../../../../src/middlewares/helpers/oauth.ts')).getJwksUri;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetches the jwks_uri from the OIDC Provider configuration', async () => {
    const mockUri = 'https://auth.example.com/.well-known/jwks.json';
    process.env.AUTH_ISSUER = 'https://auth.example.com';

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValueOnce({ jwks_uri: mockUri })
    });

    const result = await getJwksUri();

    expect(result).toBe(mockUri);
    expect(global.fetch).toHaveBeenCalledWith('https://auth.example.com/.well-known/openid-configuration');
  });

  it('returns cached promise on subsequent calls', async () => {
    const mockUri = 'https://auth.example.com/.well-known/jwks.json';
    process.env.AUTH_ISSUER = 'https://auth.example.com';

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValueOnce({ jwks_uri: mockUri })
    });

    const result1 = await getJwksUri();
    const result2 = await getJwksUri();

    expect(result1).toBe(mockUri);
    expect(result2).toBe(mockUri);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('handles issuer URL with trailing slash', async () => {
    const mockUri = 'https://auth.example.com/.well-known/jwks.json';
    process.env.AUTH_ISSUER = 'https://auth.example.com/';

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValueOnce({ jwks_uri: mockUri })
    });

    const result = await getJwksUri();

    expect(result).toBe(mockUri);
    expect(global.fetch).toHaveBeenCalledWith('https://auth.example.com/.well-known/openid-configuration');
  });

  it('throws an error when AUTH_ISSUER is not set', async () => {
    delete process.env.AUTH_ISSUER;

    await expect(getJwksUri()).rejects.toThrow('AUTH_ISSUER is not set');
  });

  it('throws an error when fetch fails', async () => {
    process.env.AUTH_ISSUER = 'https://auth.example.com';

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found'
    });

    await expect(getJwksUri()).rejects.toThrow('Failed to load OIDC Provider configuration: 404 Not Found');
  });

  it('throws an error when jwks_uri is missing in the configuration', async () => {
    process.env.AUTH_ISSUER = 'https://auth.example.com';

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValueOnce({})
    });

    await expect(getJwksUri()).rejects.toThrow('`jwks_uri` missing in OIDC Provider configuration');
  });
});

describe('normalizeScopes', () => {
  it('returns an array of scopes when given a space-separated string', () => {
    const scope = 'read write execute';

    const result = normalizeScopes(scope);

    expect(result).toEqual(['read', 'write', 'execute']);
  });

  it('returns the same array when given an array of scopes', () => {
    const scope = ['read', 'write', 'execute'];

    const result = normalizeScopes(scope);

    expect(result).toEqual(scope);
  });

  it('returns an empty array when given undefined', () => {
    const result = normalizeScopes(undefined);

    expect(result).toEqual([]);
  });
});

describe('setAuthHeader', () => {
  it('sets the WWW-Authenticate header with the provided attributes', () => {
    const res = {
      set: vi.fn()
    } as unknown as Response;

    const attributes: AuthErrorAttributes = {
      realm: 'nr-peach',
      error: 'invalid_token',
      error_description: 'The access token is invalid'
    };

    setAuthHeader(res, attributes);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(res.set).toHaveBeenCalledWith(
      'WWW-Authenticate',
      'Bearer realm="nr-peach", error="invalid_token", error_description="The access token is invalid"'
    );
  });

  it('sets the WWW-Authenticate header without empty attributes', () => {
    const res = {
      set: vi.fn()
    } as unknown as Response;

    const attributes: AuthErrorAttributes = {
      realm: 'nr-peach',
      error: 'invalid_token',
      error_description: 'The access token is invalid',
      scope: ''
    };

    setAuthHeader(res, attributes);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(res.set).toHaveBeenCalledWith(
      'WWW-Authenticate',
      'Bearer realm="nr-peach", error="invalid_token", error_description="The access token is invalid"'
    );
  });

  it('sets the WWW-Authenticate header with only US-ASCII encoded string values', () => {
    const res = {
      set: vi.fn()
    } as unknown as Response;

    const attributes: AuthErrorAttributes = {
      realm: 'nr-peach',
      error: 'invalid_token',
      error_description: 'Non-US-ASCII characters like éñüøß exist'
    };

    setAuthHeader(res, attributes);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(res.set).toHaveBeenCalledWith('WWW-Authenticate', 'Bearer realm="nr-peach", error="invalid_token"');
  });

  it('sets the WWW-Authenticate header with proper string escaping', () => {
    const res = {
      set: vi.fn()
    } as unknown as Response;

    const attributes: AuthErrorAttributes = {
      realm: 'nr-peach',
      error: 'invalid_token',
      error_description: 'Quote " and backslash \\ are escaped'
    };

    setAuthHeader(res, attributes);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(res.set).toHaveBeenCalledWith(
      'WWW-Authenticate',
      'Bearer realm="nr-peach", error="invalid_token", error_description="Quote \\" and backslash \\\\ are escaped"'
    );
  });
});
