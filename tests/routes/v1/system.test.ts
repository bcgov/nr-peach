import express from 'express';
import request from 'supertest';

import {
  deleteRecordsSchemaValidator,
  getRecordsSchemaValidator,
  getSystemsSchemaValidator
} from '../../../src/validators/index.ts';

import router from '../../../src/routes/v1/system.ts';

import type { NextFunction } from 'express';

const app = express();
app.use(router);

vi.mock('../../../src/middlewares/validator.ts', () => ({
  validateRequestIntegrity: () => vi.fn((_req, _res, next: NextFunction): void => next()),
  validateRequestSchema: () => vi.fn((_req, _res, next: NextFunction): void => next())
}));

describe('System Routes', () => {
  describe('GET /systems', () => {
    it('should return 501', async () => {
      const response = await request(app).get('/systems');
      expect(getSystemsSchemaValidator).toHaveBeenCalled();
      expect(response.status).toBe(501);
    });
  });

  describe('GET /system-records', () => {
    it('should return 501', async () => {
      const response = await request(app).get('/system-records');
      expect(getRecordsSchemaValidator).toHaveBeenCalled();
      expect(response.status).toBe(501);
    });
  });

  describe('DELETE /system-records', () => {
    it('should return 501', async () => {
      const response = await request(app).delete('/system-records');
      expect(deleteRecordsSchemaValidator).toHaveBeenCalled();
      expect(response.status).toBe(501);
    });
  });
});
