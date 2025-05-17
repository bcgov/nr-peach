import express from 'express';
import request from 'supertest';

import { app, errorHandler } from '../src/app.ts';
import { state } from '../src/state.ts';
import { Problem } from '../src/utils/index.ts';

describe('App', () => {
  beforeEach(() => {
    state.ready = true;
    state.shutdown = false;
  });

  it('should return 503 if the server is shutting down', async () => {
    state.shutdown = true;
    const response = await request(app).get('/');
    expect(response.status).toBe(503);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.detail).toBe('Server is shutting down');
  });

  it('should return 503 if the server is not ready', async () => {
    state.ready = false;
    const response = await request(app).get('/');
    expect(response.status).toBe(503);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.detail).toBe('Server is not ready');
  });

  it('should return robots.txt with disallow all', async () => {
    const response = await request(app).get('/robots.txt');
    expect(response.status).toBe(200);
    expect(response.text).toBe('User-agent: *\nDisallow: /');
  });

  it('should return 404 for unknown routes', async () => {
    const response = await request(app).get('/unknown-route');
    expect(response.status).toBe(404);
  });

  it('should return 500 for Problem errors', async () => {
    const testApp = express();
    testApp.get('/error', () => {
      throw new Problem(500, { detail: 'Test Error' });
    });
    testApp.use(errorHandler);

    const response = await request(testApp).get('/error');
    expect(response.status).toBe(500);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.detail).toBe('Test Error');
  });

  it('should return 500 for generic errors', async () => {
    const testApp = express();
    testApp.get('/error', () => {
      throw new Error('Test Error');
    });
    testApp.use(errorHandler);

    const response = await request(testApp).get('/error');
    expect(response.status).toBe(500);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.detail).toBe('Test Error');
  });
});
