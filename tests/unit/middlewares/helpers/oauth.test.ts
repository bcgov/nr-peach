import { getBearerToken, normalizeScopes, setAuthHeader } from '../../../../src/middlewares/helpers/oauth.ts';

import type { Request, Response } from 'express';

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

  it('returns null if the Authorization header is missing', () => {
    const req = {
      headers: {}
    } as Request;

    const result = getBearerToken(req);

    expect(result).toBeNull();
  });

  it('returns null if the Authorization header does not start with "Bearer "', () => {
    const req = {
      headers: {
        authorization: 'Basic exampletokenvalue'
      }
    } as Request;

    const result = getBearerToken(req);

    expect(result).toBeNull();
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

    const attributes = {
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
});
