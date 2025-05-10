import express from 'express';
import request from 'supertest';

import {
  deleteRecordsValidator,
  getRecordsValidator,
  getSystemsValidator
} from '../../../src/validators/index.ts';

import router from '../../../src/routes/v1/system.ts';

import type { NextFunction } from 'express';

const app = express();
app.use(router);

vi.mock('../../../src/middlewares/index.ts', () => ({
  validateRequest: () => vi.fn((_req, _res, next: NextFunction): void => next())
}));

describe('System Routes', () => {
  describe('GET /systems', () => {
    it('should return 501', async () => {
      const response = await request(app).get('/systems');
      expect(getSystemsValidator).toHaveBeenCalled();
      expect(response.status).toBe(501);
    });
  });

  describe('GET /system-records', () => {
    it('should return 501', async () => {
      const response = await request(app).get('/system-records');
      expect(getRecordsValidator).toHaveBeenCalled();
      expect(response.status).toBe(501);
    });
  });

  describe('DELETE /system-records', () => {
    it('should return 501', async () => {
      const response = await request(app).delete('/system-records');
      expect(deleteRecordsValidator).toHaveBeenCalled();
      expect(response.status).toBe(501);
    });
  });
});
