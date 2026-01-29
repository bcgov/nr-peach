import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';

import { state } from '../../../src/state.ts';
import { authn, authz } from '../../../src/middlewares/auth.ts';
import * as helpers from '../../../src/middlewares/helpers/index.ts';

import type { Application, Request, RequestHandler, Response } from 'express';

interface BadAuthResponse {
  body: Record<string, unknown>;
  headers: Record<string, string>;
  status: number;
}

describe('authn', () => {
  const mockHandler = vi.fn((_req: Request, res: Response) => res.status(200).send('Success'));
  const decodeSpy = vi.spyOn(jwt, 'decode');
  const getBearerTokenSpy = vi.spyOn(helpers, 'getBearerToken');
  const getSigningKeySpy = vi.spyOn(helpers.jwksClient, 'getSigningKey');
  const verifySpy = vi.spyOn(jwt, 'verify');

  let app: Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  it('should call next if auth mode is "none"', async () => {
    state.authMode = 'none';

    app.get('/test', authn(), mockHandler as unknown as RequestHandler);

    const response = await request(app).get('/test').send();

    expect(response.status).toBe(200);
    expect(mockHandler).toHaveBeenCalledTimes(1);
  });

  it('should return 401 if token is not present', async () => {
    state.authMode = 'authn';
    getBearerTokenSpy.mockReturnValue(undefined);

    app.get('/test', authn(), mockHandler as unknown as RequestHandler);

    const response = (await request(app).get('/test').send()) as BadAuthResponse;

    expect(response.status).toBe(401);
    expect(response.body.detail).toBe('Missing bearer token');
    expect(response.body.realm).toBe('nr-peach');
    expect(response.headers['www-authenticate']).toContain('Bearer');
    expect(response.headers['www-authenticate']).toContain('realm="nr-peach');
    expect(response.headers['www-authenticate']).toContain('error="invalid_token"');
    expect(response.headers['www-authenticate']).toContain('error_description="Missing bearer token"');
    expect(mockHandler).toHaveBeenCalledTimes(0);
  });

  it('should return 400 if token is invalid', async () => {
    state.authMode = 'authn';
    getBearerTokenSpy.mockReturnValue(null);
    decodeSpy.mockReturnValue(null);

    app.get('/test', authn(), mockHandler as unknown as RequestHandler);

    const response = (await request(app).get('/test').send()) as BadAuthResponse;

    expect(response.status).toBe(400);
    expect(response.body.detail).toBe('Invalid bearer token');
    expect(response.body.realm).toBe('nr-peach');
    expect(response.headers['www-authenticate']).toContain('Bearer');
    expect(response.headers['www-authenticate']).toContain('realm="nr-peach');
    expect(response.headers['www-authenticate']).toContain('error="invalid_request"');
    expect(response.headers['www-authenticate']).toContain('error_description="Invalid bearer token"');
    expect(mockHandler).toHaveBeenCalledTimes(0);
  });

  it('should return 400 if token is not decodable', async () => {
    state.authMode = 'authn';
    getBearerTokenSpy.mockReturnValue('invalid-token');
    decodeSpy.mockReturnValue(null);

    app.get('/test', authn(), mockHandler as unknown as RequestHandler);

    const response = (await request(app).get('/test').send()) as BadAuthResponse;

    expect(response.status).toBe(400);
    expect(response.body.detail).toBe('Unable to decode access token');
    expect(response.body.realm).toBe('nr-peach');
    expect(response.headers['www-authenticate']).toContain('Bearer');
    expect(response.headers['www-authenticate']).toContain('realm="nr-peach');
    expect(response.headers['www-authenticate']).toContain('error="invalid_request"');
    expect(response.headers['www-authenticate']).toContain('error_description="Unable to decode access token"');
    expect(mockHandler).toHaveBeenCalledTimes(0);
  });

  it('should call next if token is valid', async () => {
    state.authMode = 'authn';
    getBearerTokenSpy.mockReturnValue('valid-token');
    decodeSpy.mockReturnValue({ header: { kid: 'key-id' } });
    // @ts-expect-error ts(2345)
    getSigningKeySpy.mockResolvedValue({ getPublicKey: vi.fn().mockReturnValue('public-key') });
    // @ts-expect-error ts(2345)
    verifySpy.mockReturnValue({ sub: 'user-id' });

    app.get('/test', authn(), (_req: Request, res: Response) => res.status(200).json(res.locals));

    const response = await request(app).get('/test').send();

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ claims: { sub: 'user-id' }, token: 'valid-token' });
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
        res.locals.claims = { scope: 'other-scope' };
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
        res.locals.claims = { scope: 'required-scope' };
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
