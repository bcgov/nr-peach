import express from 'express';
import request from 'supertest';

import { app, errorHandler } from '../src/app.ts';
import { state } from '../src/state.ts';
import * as db from '../src/db/index.ts';
import { Problem } from '../src/utils/index.ts';

import type { Request, Response } from 'express';

const checkDatabaseHealthSpy = vi.spyOn(db, 'checkDatabaseHealth');

describe('App', () => {
  beforeEach(() => {
    state.ready = true;
    state.shutdown = false;
  });

  it('should return 503 if the server is shutting down', async () => {
    state.shutdown = true;
    const response = await request(app).get('/');
    expect(response.status).toBe(503);
    expect((response.body as { detail: string }).detail).toBe('Server is shutting down');
  });

  it('should return 200 if the server is not ready and db health is good', async () => {
    state.ready = false;
    checkDatabaseHealthSpy.mockResolvedValueOnce(true);

    const response = await request(app).get('/');
    expect(response.status).toBe(200);
  });

  it('should return 503 if the server is not ready and db health is bad', async () => {
    state.ready = false;
    checkDatabaseHealthSpy.mockResolvedValueOnce(false);

    const response = await request(app).get('/');
    expect(response.status).toBe(503);
    expect((response.body as { detail: string }).detail).toBe('Server is not ready');
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

  describe('errorHandler', () => {
    let req: Request;
    let res: Response;

    beforeEach(() => {
      req = {} as Request;
      res = {
        end: vi.fn(),
        json: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        status: vi.fn().mockReturnThis(),
        writeHead: vi.fn().mockReturnThis()
      } as Partial<Response> as Response;
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should return 418 for specific Problem errors', async () => {
      const testApp = express();
      testApp.get('/error', () => {
        throw new Problem(418, { detail: 'Test Error' });
      });
      testApp.use(errorHandler);

      const response = await request(testApp).get('/error');
      expect(response.status).toBe(418);
      expect((response.body as { detail: string }).detail).toBe('Test Error');
      expect(state.ready).toBe(true);
    });

    it('should return 500 for generic errors', async () => {
      const testApp = express();
      testApp.get('/error', () => {
        throw new Error('Test Error');
      });
      testApp.use(errorHandler);
      checkDatabaseHealthSpy.mockResolvedValueOnce(true);

      const response = await request(testApp).get('/error');
      expect(response.status).toBe(500);
      expect((response.body as { detail: string }).detail).toBe('Test Error');
      expect(state.ready).toBe(true);
    });

    it('should send 503 if db is unhealthy for non-Problem errors', async () => {
      checkDatabaseHealthSpy.mockResolvedValueOnce(false);
      const err = new Error('Some error');

      await errorHandler(err, req, res, vi.fn());
      expect(state.ready).toBe(false);
    });

    it('should send 500 if db is healthy for non-Problem errors', async () => {
      checkDatabaseHealthSpy.mockResolvedValueOnce(true);
      const err = new Error('Another error');

      await errorHandler(err, req, res, vi.fn());
      expect(state.ready).toBe(true);
    });
  });
});
