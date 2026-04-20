import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';

import { state } from '#src/state';
import { authm, authn, authz, jwtCache } from '#src/middlewares/auth';
import * as helpers from '#src/middlewares/helpers/index';

import type { Application, Request, RequestHandler, Response } from 'express';
import type { JwksClient } from 'jwks-rsa';

interface BadAuthResponse {
  body: Record<string, unknown>;
  headers: Record<string, string>;
  status: number;
  text?: string;
}

describe('authm', () => {
  let app: Application;

  beforeEach(() => {
    state.authMode = 'authz';
    app = express();
    app.use(express.json());
    app.use(express.urlencoded());
    app.get('/test', authm(), (_req: Request, res: Response) => res.status(200).send('Success'));
    app.post('/test', authm(), (_req: Request, res: Response) => res.status(200).send('Success'));
  });

  it('should allow all requests when authMode is set to "none"', async () => {
    state.authMode = 'none';

    const response = await request(app).get('/test?access_token=should-be-ignored');

    expect(response.status).toBe(200);
    expect(response.text).toBe('Success');
  });

  it('should allow requests with only the Authorization header', async () => {
    const response = (await request(app).get('/test').set('Authorization', 'Bearer valid-token')) as BadAuthResponse;

    expect(response.status).toBe(200);
    expect(response.text).toBe('Success');
  });

  it('should reject requests with multiple authentication methods', async () => {
    const response = (await request(app)
      .get('/test?access_token=some-token')
      .set('Authorization', 'Bearer valid-token')) as BadAuthResponse;

    expect(response.status).toBe(400);
    expect(response.body.detail).toBe('Multiple authentication methods used.');
    expect(response.headers['www-authenticate']).toEqual(expect.stringContaining('realm="nr-peach"'));
  });

  it('should reject requests with access_token in query parameters', async () => {
    const response = (await request(app).get('/test?access_token=some-token')) as BadAuthResponse;

    expect(response.status).toBe(401);
    expect(response.body.detail).toBe('Unsupported authentication method.');
    expect(response.headers['www-authenticate']).toEqual(expect.stringContaining('realm="nr-peach"'));
  });

  it('should reject requests with access_token in the json body', async () => {
    const response = (await request(app)
      .post('/test')
      .set('Content-Type', 'application/json')
      .send({ access_token: 'some-token' })) as BadAuthResponse;

    expect(response.status).toBe(401);
    expect(response.body.detail).toBe('Unsupported authentication method.');
    expect(response.headers['www-authenticate']).toEqual(expect.stringContaining('realm="nr-peach"'));
    expect(response.headers['www-authenticate']).not.toEqual(expect.stringContaining('error'));
  });

  it('should reject requests with access_token in the urlencoded body', async () => {
    const response = (await request(app)
      .post('/test')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send('access_token=some-token')) as BadAuthResponse;

    expect(response.status).toBe(401);
    expect(response.body.detail).toBe('Unsupported authentication method.');
    expect(response.headers['www-authenticate']).toEqual(expect.stringContaining('realm="nr-peach"'));
    expect(response.headers['www-authenticate']).not.toEqual(expect.stringContaining('error'));
  });

  it('should reject requests missing the Authorization header', async () => {
    const response = (await request(app).get('/test')) as BadAuthResponse;

    expect(response.status).toBe(401);
    expect(response.body.detail).toBe('Missing authorization header');
    expect(response.headers['www-authenticate']).toEqual(expect.stringContaining('realm="nr-peach"'));
    expect(response.headers['www-authenticate']).not.toEqual(expect.stringContaining('error'));
  });

  it('should use the AUTH_AUDIENCE env variable for the realm in the header', async () => {
    const originalAudience = process.env.AUTH_AUDIENCE;
    process.env.AUTH_AUDIENCE = 'test-realm';

    const response = await request(app).get('/test');

    expect(response.headers['www-authenticate']).toContain('realm="test-realm"');
    expect(response.headers['www-authenticate']).not.toEqual(expect.stringContaining('error'));

    process.env.AUTH_AUDIENCE = originalAudience;
  });
});

describe('authn', () => {
  const mockHandler = vi.fn((_req: Request, res: Response) => res.status(200).send('Success'));
  const decodeSpy = vi.spyOn(jwt, 'decode');
  const getBearerTokenSpy = vi.spyOn(helpers, 'getBearerToken');
  const getJwksClientSpy = vi.spyOn(helpers, 'getJwksClient');
  const verifySpy = vi.spyOn(jwt, 'verify');

  let app: Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    jwtCache.clear();
  });

  it('should call next if auth mode is "none"', async () => {
    state.authMode = 'none';

    app.get('/test', authn(), mockHandler as unknown as RequestHandler);

    const response = await request(app).get('/test').send();

    expect(response.status).toBe(200);
    expect(mockHandler).toHaveBeenCalledTimes(1);
  });

  it('should return 401 if token is invalid', async () => {
    state.authMode = 'authn';
    getBearerTokenSpy.mockReturnValue(null);
    decodeSpy.mockReturnValue(null);

    app.get('/test', authn(), mockHandler as unknown as RequestHandler);

    const response = (await request(app).get('/test').send()) as BadAuthResponse;

    expect(response.status).toBe(401);
    expect(response.body.detail).toBe('Invalid bearer token');
    expect(response.body.realm).toBe('nr-peach');
    expect(response.headers['www-authenticate']).toContain('Bearer');
    expect(response.headers['www-authenticate']).toContain('realm="nr-peach');
    expect(response.headers['www-authenticate']).toContain('error="invalid_token"');
    expect(response.headers['www-authenticate']).toContain('error_description="Invalid bearer token"');
    expect(mockHandler).toHaveBeenCalledTimes(0);
  });

  it('should return 401 if token is not decodable', async () => {
    state.authMode = 'authn';
    getBearerTokenSpy.mockReturnValue('invalid-token');
    decodeSpy.mockReturnValue(null);

    app.get('/test', authn(), mockHandler as unknown as RequestHandler);

    const response = (await request(app).get('/test').send()) as BadAuthResponse;

    expect(response.status).toBe(401);
    expect(response.body.detail).toBe('Unable to decode access token');
    expect(response.body.realm).toBe('nr-peach');
    expect(response.headers['www-authenticate']).toContain('Bearer');
    expect(response.headers['www-authenticate']).toContain('realm="nr-peach');
    expect(response.headers['www-authenticate']).toContain('error="invalid_token"');
    expect(response.headers['www-authenticate']).toContain('error_description="Unable to decode access token"');
    expect(mockHandler).toHaveBeenCalledTimes(0);
  });

  it('should call next if token is valid', async () => {
    const getSigningKeySpy = vi.fn().mockResolvedValue({ getPublicKey: vi.fn().mockReturnValue('public-key') });

    state.authMode = 'authn';
    getBearerTokenSpy.mockReturnValue('valid-token');
    decodeSpy.mockReturnValue({ header: { kid: 'key-id' } });
    getJwksClientSpy.mockResolvedValue({ getSigningKey: getSigningKeySpy } as unknown as JwksClient);
    verifySpy.mockReturnValue({ sub: 'user-id' } as unknown as void);

    app.get('/test', authn(), (_req: Request, res: Response) => res.status(200).json(res.locals));

    const response = await request(app).get('/test').send();

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ access_claims: { sub: 'user-id' }, access_token: 'valid-token' });
  });

  it('should return cached claims and skip verification if token is in cache', async () => {
    const token = 'cached-token';
    const cachedClaims = { sub: 'user-123', scope: 'read' };

    // Manually prime the cache
    jwtCache.set(token, cachedClaims);

    state.authMode = 'authn';
    getBearerTokenSpy.mockReturnValue(token);

    // If cache works, jwt.verify and getJwksClient should NEVER be called
    app.get('/test', authn(), (_req: Request, res: Response) => {
      res.status(200).json(res.locals);
    });

    const response = await request(app).get('/test').send();

    expect(response.status).toBe(200);
    expect((response.body as { access_claims: jwt.JwtPayload }).access_claims).toEqual(cachedClaims);
    expect(verifySpy).not.toHaveBeenCalled();
    expect(getJwksClientSpy).not.toHaveBeenCalled();
  });

  it('should store claims in cache after successful verification', async () => {
    const token = 'new-token';
    const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour in future
    const freshClaims = { sub: 'user-456', exp: futureExp };

    const getSigningKeySpy = vi.fn().mockResolvedValue({
      getPublicKey: vi.fn().mockReturnValue('public-key')
    });

    state.authMode = 'authn';
    getBearerTokenSpy.mockReturnValue(token);
    decodeSpy.mockReturnValue({ header: { kid: 'key-id' } });
    getJwksClientSpy.mockResolvedValue({ getSigningKey: getSigningKeySpy } as unknown as JwksClient);
    verifySpy.mockReturnValue(freshClaims as unknown as void);

    app.get('/test', authn(), (_req: Request, res: Response) => res.sendStatus(200));

    await request(app).get('/test').send();

    // Verify the cache was updated
    const cachedValue = jwtCache.get(token);
    expect(cachedValue).toEqual(freshClaims);
    expect(jwtCache.has(token)).toBe(true);
  });

  it('should not cache claims if exp is missing or in the past', async () => {
    const token = 'no-cache-token';
    const expiredClaims = { sub: 'user-789', exp: Math.floor(Date.now() / 1000) - 100 };

    const getSigningKeySpy = vi.fn().mockResolvedValue({
      getPublicKey: vi.fn().mockReturnValue('public-key')
    });

    state.authMode = 'authn';
    getBearerTokenSpy.mockReturnValue(token);
    decodeSpy.mockReturnValue({ header: { kid: 'key-id' } });
    getJwksClientSpy.mockResolvedValue({ getSigningKey: getSigningKeySpy } as unknown as JwksClient);
    verifySpy.mockReturnValue(expiredClaims as unknown as void);

    app.get('/test', authn(), (_req: Request, res: Response) => res.sendStatus(200));

    await request(app).get('/test').send();

    // Cache should be empty because remainingMs would be <= 0
    expect(jwtCache.has(token)).toBe(false);
  });
});

describe('authz', () => {
  const mockHandler = vi.fn((_req: Request, res: Response) => res.status(200).send('Success'));

  let app: Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  it('should call next if auth mode is not "authz"', async () => {
    state.authMode = 'none';

    app.get('/test', authz('query'), mockHandler as unknown as RequestHandler);

    const response = await request(app).get('/test').send();

    expect(response.status).toBe(200);
    expect(mockHandler).toHaveBeenCalledTimes(1);
  });

  it('should return 400 if system_id is missing', async () => {
    state.authMode = 'authz';

    app.get('/test', authz('query'), mockHandler as unknown as RequestHandler);

    const response = (await request(app).get('/test').send()) as BadAuthResponse;

    expect(response.status).toBe(400);
    expect(response.body.detail).toBe('Unable to determine required system_id scope from query');
    expect(response.body.realm).toBe('nr-peach');
    expect(response.headers['www-authenticate']).toContain('Bearer');
    expect(response.headers['www-authenticate']).toContain('realm="nr-peach');
    expect(response.headers['www-authenticate']).toContain('error="invalid_request"');
    expect(response.headers['www-authenticate']).toContain(
      'error_description="Unable to determine required system_id scope from query"'
    );
    expect(mockHandler).toHaveBeenCalledTimes(0);
  });

  it('should return 401 if claims are missing', async () => {
    state.authMode = 'authz';

    app.get('/test', authz('query'), mockHandler as unknown as RequestHandler);

    const response = (await request(app).get('/test').query({ system_id: 'some-scope' }).send()) as BadAuthResponse;

    expect(response.status).toBe(401);
    expect(response.body.detail).toBe('Missing or invalid access token');
    expect(response.body.realm).toBe('nr-peach');
    expect(response.body.scope).toBe('some-scope');
    expect(response.headers['www-authenticate']).toContain('Bearer');
    expect(response.headers['www-authenticate']).toContain('realm="nr-peach');
    expect(response.headers['www-authenticate']).toContain('error="invalid_token"');
    expect(response.headers['www-authenticate']).toContain('error_description="Missing or invalid access token"');
    expect(response.headers['www-authenticate']).toContain('scope="some-scope');
    expect(mockHandler).toHaveBeenCalledTimes(0);
  });

  it('should return 403 if token lacks required scope', async () => {
    state.authMode = 'authz';

    app.get(
      '/test',
      (_req, res, next) => {
        res.locals.access_claims = { scope: 'other-scope' };
        next();
      },
      authz('query'),
      mockHandler as unknown as RequestHandler
    );

    const response = (await request(app).get('/test').query({ system_id: 'required-scope' }).send()) as BadAuthResponse;

    expect(response.status).toBe(403);
    expect(response.body.detail).toBe('Access token lacks required scope');
    expect(response.body.realm).toBe('nr-peach');
    expect(response.body.scope).toBe('required-scope');
    expect(response.headers['www-authenticate']).toContain('Bearer');
    expect(response.headers['www-authenticate']).toContain('realm="nr-peach"');
    expect(response.headers['www-authenticate']).toContain('error="insufficient_scope"');
    expect(response.headers['www-authenticate']).toContain('error_description="Access token lacks required scope"');
    expect(response.headers['www-authenticate']).toContain('scope="required-scope"');
    expect(mockHandler).toHaveBeenCalledTimes(0);
  });

  it('should call next if token has required scope', async () => {
    state.authMode = 'authz';

    app.get(
      '/test',
      (_req, res, next) => {
        res.locals.access_claims = { scope: 'required-scope' };
        next();
      },
      authz('query'),
      mockHandler as unknown as RequestHandler
    );

    const response = (await request(app).get('/test').query({ system_id: 'required-scope' }).send()) as {
      body: Record<string, unknown>;
      status: number;
    };

    expect(response.status).toBe(200);
    expect(mockHandler).toHaveBeenCalledTimes(1);
  });
});
