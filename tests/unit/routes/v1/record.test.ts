import express from 'express';
import request from 'supertest';

import {
  getRecordController,
  postRecordController,
  pruneRecordController,
  putRecordController
} from '../../../../src/controllers/index.ts';
import {
  getRecordSchemaValidator,
  postRecordIntegrityValidator,
  postRecordSchemaValidator,
  pruneRecordSchemaValidator,
  putRecordIntegrityValidator,
  putRecordSchemaValidator
} from '../../../../src/validators/index.ts';

import router from '../../../../src/routes/v1/record.ts';

import type { RequestHandler } from 'express';

const app = express();
app.use(router);

vi.mock('../../../../src/controllers/record.ts', () => ({
  getRecordController: vi.fn<RequestHandler>((_req, _res, next) => next()),
  postRecordController: vi.fn<RequestHandler>((_req, _res, next) => next()),
  pruneRecordController: vi.fn<RequestHandler>((_req, _res, next) => next()),
  putRecordController: vi.fn<RequestHandler>((_req, _res, next) => next())
}));

vi.mock('../../../../src/middlewares/auth.ts', () => ({
  authz: () => vi.fn<RequestHandler>((_req, _res, next) => next())
}));

vi.mock('../../../../src/middlewares/validator.ts', () => ({
  validateRequestIntegrity: () => vi.fn<RequestHandler>((_req, _res, next) => next()),
  validateRequestSchema: () => vi.fn<RequestHandler>((_req, _res, next) => next())
}));

describe('Process Routes', () => {
  describe('DELETE /records', () => {
    it('should call the schema validator and controller', async () => {
      await request(app).delete('/records');
      expect(pruneRecordSchemaValidator).toHaveBeenCalled();
      expect(pruneRecordController).toHaveBeenCalled();
    });
  });

  describe('GET /records', () => {
    it('should call the schema validator and controller', async () => {
      await request(app).get('/records');
      expect(getRecordSchemaValidator).toHaveBeenCalled();
      expect(getRecordController).toHaveBeenCalled();
    });
  });

  describe('POST /records', () => {
    it('should call the schema validator, integrity validator and controller', async () => {
      await request(app).post('/records').send({});
      expect(postRecordSchemaValidator).toHaveBeenCalled();
      expect(postRecordIntegrityValidator).toHaveBeenCalled();
      expect(postRecordController).toHaveBeenCalled();
    });
  });

  describe('PUT /records', () => {
    it('should call the schema validator, integrity validator and controller', async () => {
      await request(app).put('/records').send({});
      expect(putRecordSchemaValidator).toHaveBeenCalled();
      expect(putRecordIntegrityValidator).toHaveBeenCalled();
      expect(putRecordController).toHaveBeenCalled();
    });
  });
});
