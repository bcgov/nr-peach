import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';

import { authn } from '../../../src/middlewares/auth.ts';
import * as helpers from '../../../src/middlewares/helpers/index.ts';

import type { Application, Request, RequestHandler, Response } from 'express';

describe('authn', () => {
  const mockHandler = vi.fn((_req: Request, res: Response) => res.status(200).send('Success'));
  const decodeSpy = vi.spyOn(jwt, 'decode');
  const getAuthModeSpy = vi.spyOn(helpers, 'getAuthMode');
  const getBearerTokenSpy = vi.spyOn(helpers, 'getBearerToken');
  const getSigningKeySpy = vi.spyOn(helpers.jwksClient, 'getSigningKey');
  const verifySpy = vi.spyOn(jwt, 'verify');

  let app: Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  it('should call next if auth mode is "none"', async () => {
    getAuthModeSpy.mockReturnValue('none');

    app.get('/test', authn(), mockHandler as unknown as RequestHandler);

    const response = await request(app).get('/test').send();

    expect(response.status).toBe(200);
    expect(mockHandler).toHaveBeenCalledTimes(1);
  });

  it('should return 401 if token is missing', async () => {
    getAuthModeSpy.mockReturnValue('authn');
    getBearerTokenSpy.mockReturnValue(null);

    app.get('/test', authn(), mockHandler as unknown as RequestHandler);

    const response = (await request(app).get('/test').send()) as { body: Record<string, unknown>; status: number };

    expect(response.status).toBe(401);
    expect(response.body.detail).toBe('Missing or malformed bearer token');
    expect(response.body.realm).toBe('nr-peach');
    expect(mockHandler).toHaveBeenCalledTimes(0);
  });

  it('should return 401 if token is invalid', async () => {
    getAuthModeSpy.mockReturnValue('authn');
    getBearerTokenSpy.mockReturnValue('invalid-token');
    decodeSpy.mockReturnValue(null);

    app.get('/test', authn(), mockHandler as unknown as RequestHandler);

    const response = (await request(app).get('/test').send()) as { body: Record<string, unknown>; status: number };

    expect(response.status).toBe(401);
    expect(response.body.detail).toBe('Unable to decode access token');
    expect(response.body.realm).toBe('nr-peach');
    expect(mockHandler).toHaveBeenCalledTimes(0);
  });

  it('should call next if token is valid', async () => {
    getAuthModeSpy.mockReturnValue('authn');
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
