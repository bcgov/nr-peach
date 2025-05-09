import express from 'express';
import request from 'supertest';

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

vi.mock('../../../src/middlewares/index.ts', () => ({
  validateRequest: () => vi.fn((_req, _res, next: NextFunction): void => next())
}));

describe('Process Routes', () => {
  describe('GET /process-events', () => {
    it('should return 501', async () => {
      const response = await request(app).get('/process-events');
      expect(getProcessEventsValidator).toHaveBeenCalled();
      expect(response.status).toBe(501);
    });
  });

  describe('POST /process-events', () => {
    it('should return 501', async () => {
      const response = await request(app).post('/process-events').send({});
      expect(postProcessEventsValidator).toHaveBeenCalled();
      expect(response.status).toBe(501);
    });
  });

  describe('PUT /process-events', () => {
    it('should return 501', async () => {
      const response = await request(app).put('/process-events').send({});
      expect(putProcessEventsValidator).toHaveBeenCalled();
      expect(response.status).toBe(501);
    });
  });

  describe('DELETE /process-events', () => {
    it('should return 501', async () => {
      const response = await request(app).delete('/process-events');
      expect(deleteProcessEventsValidator).toHaveBeenCalled();
      expect(response.status).toBe(501);
    });
  });
});
