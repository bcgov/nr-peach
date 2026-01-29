import express from 'express';
import request from 'supertest';

import { state } from '../../../src/state.ts';
import router from '../../../src/routes/index.ts';

import type { RequestHandler } from 'express';

const app = express();
app.use(router);

vi.mock('../../../src/middlewares/validator.ts', () => ({
  validateRequestIntegrity: () => vi.fn<RequestHandler>((_req, _res, next) => next()),
  validateRequestSchema: () => vi.fn<RequestHandler>((_req, _res, next) => next())
}));

describe('GET /', () => {
  it('should return the root endpoints', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        endpoints: ['/api', '/docs', '/live', '/ready']
      })
    );
  });

  it('should return the git revision', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        gitRev: state.gitRev
      })
    );
  });
});

describe('GET /api', () => {
  it('should return the API endpoints', async () => {
    const response = await request(app).get('/api');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ endpoints: ['/v1'] });
  });
});

describe('GET /live', () => {
  it('should return 200 with status "ok"', async () => {
    const response = await request(app).get('/live');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ detail: 'Server is ok' });
  });
});

describe('GET /ready', () => {
  beforeEach(() => {
    state.ready = false;
  });

  it('should return 200 when state.ready is true', async () => {
    state.ready = true;
    const response = await request(app).get('/ready');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ detail: 'Server is ready' });
  });

  it('should return 503 when state.ready is false', async () => {
    state.ready = false;
    const response = await request(app).get('/ready');
    expect(response.status).toBe(503);
    expect(response.body).toEqual(expect.objectContaining({ detail: 'Server is not ready' }));
  });
});

describe('GET /teapot', () => {
  it('should return 418', async () => {
    const response = await request(app).get('/teapot');
    expect(response.status).toBe(418);
    expect(response.body).toEqual(expect.objectContaining({ title: "I'm a Teapot" })); // eslint-disable-line quotes
  });
});
