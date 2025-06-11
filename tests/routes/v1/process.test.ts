import express from 'express';
import request from 'supertest';

import {
  deleteProcessEventsController,
  getProcessEventsController,
  postProcessEventsController,
  putProcessEventsController
} from '../../../src/controllers/index.ts';
import {
  deleteProcessEventsValidator,
  getProcessEventsValidator,
  postProcessEventsValidator,
  putProcessEventsValidator
} from '../../../src/validators/index.ts';

import router from '../../../src/routes/v1/process.ts';

import type { NextFunction } from 'express';

const app = express();
app.use(router);

vi.mock('../../../src/controllers/index.ts', () => ({
  deleteProcessEventsController: vi.fn((_req, _res, next: NextFunction): void => next()),
  getProcessEventsController: vi.fn((_req, _res, next: NextFunction): void => next()),
  postProcessEventsController: vi.fn((_req, _res, next: NextFunction): void => next()),
  putProcessEventsController: vi.fn((_req, _res, next: NextFunction): void => next())
}));

vi.mock('../../../src/middlewares/index.ts', () => ({
  validateRequestSchema: () => vi.fn((_req, _res, next: NextFunction): void => next())
}));

beforeEach(() => {
  vi.resetAllMocks();
});

describe('Process Routes', () => {
  describe('GET /process-events', () => {
    it('should call the validator and controller', async () => {
      await request(app).get('/process-events');
      expect(getProcessEventsValidator).toHaveBeenCalled();
      expect(getProcessEventsController).toHaveBeenCalled();
    });
  });

  describe('POST /process-events', () => {
    it('should call the validator and controller', async () => {
      await request(app).post('/process-events').send({});
      expect(postProcessEventsValidator).toHaveBeenCalled();
      expect(postProcessEventsController).toHaveBeenCalled();
    });
  });

  describe('PUT /process-events', () => {
    it('should call the validator and controller', async () => {
      await request(app).put('/process-events').send({});
      expect(putProcessEventsValidator).toHaveBeenCalled();
      expect(putProcessEventsController).toHaveBeenCalled();
    });
  });

  describe('DELETE /process-events', () => {
    it('should call the validator and controller', async () => {
      await request(app).delete('/process-events');
      expect(deleteProcessEventsValidator).toHaveBeenCalled();
      expect(deleteProcessEventsController).toHaveBeenCalled();
    });
  });
});
