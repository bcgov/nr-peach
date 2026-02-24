import express from 'express';
import request from 'supertest';

import { deleteSystemRecordController } from '../../../../src/controllers/index.ts';
import {
  deleteRecordsSchemaValidator,
  getRecordsSchemaValidator,
  getSystemsSchemaValidator
} from '../../../../src/validators/index.ts';

import router from '../../../../src/routes/v1/system.ts';

import type { RequestHandler } from 'express';

const app = express();
app.use(router);

vi.mock('../../../../src/controllers/record.ts', () => ({
  deleteSystemRecordController: vi.fn<RequestHandler>((_req, _res, next) => next())
}));

vi.mock('../../../../src/middlewares/auth.ts', () => ({
  authz: () => vi.fn<RequestHandler>((_req, _res, next) => next())
}));

vi.mock('../../../../src/middlewares/validator.ts', () => ({
  validateRequestIntegrity: () => vi.fn<RequestHandler>((_req, _res, next) => next()),
  validateRequestSchema: () => vi.fn<RequestHandler>((_req, _res, next) => next())
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
    it('should call the schema validator and controller', async () => {
      await request(app).delete('/system-records');
      expect(deleteRecordsSchemaValidator).toHaveBeenCalled();
      expect(deleteSystemRecordController).toHaveBeenCalled();
    });
  });
});
