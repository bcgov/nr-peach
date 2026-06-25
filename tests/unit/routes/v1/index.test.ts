import express from 'express';
import request from 'supertest';

import router from '#src/routes/v1/index';

import type { RequestHandler } from 'express';

const app = express();
app.use(router);

vi.mock('#src/middlewares/auth', () => ({
  authm: () => vi.fn<RequestHandler>((_req, _res, next) => next()),
  authn: () => vi.fn<RequestHandler>((_req, _res, next) => next()),
  authz: () => vi.fn<RequestHandler>((_req, _res, next) => next()),
  isJsonBody: () => vi.fn<RequestHandler>((_req, _res, next) => next())
}));

vi.mock('#src/middlewares/validator', () => ({
  validateRequestIntegrity: () => vi.fn<RequestHandler>((_req, _res, next) => next()),
  validateRequestSchema: () => vi.fn<RequestHandler>((_req, _res, next) => next())
}));

describe('GET /', () => {
  it('should return a 200 status and a list of endpoints', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('endpoints');
    expect((response.body as { endpoints: string[] }).endpoints).toEqual(
      expect.arrayContaining(['/assets', '/records', '/record-linkages', '/systems'])
    );
    expect((response.body as { endpoints: string[] }).endpoints).toHaveLength(4);
  });
});
