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

import type { NextFunction } from 'express';

const app = express();
app.use(router);

vi.mock('../../../../src/controllers/record.ts', () => ({
  getRecordController: vi.fn((_req, _res, next: NextFunction): void => next()),
  postRecordController: vi.fn((_req, _res, next: NextFunction): void => next()),
  pruneRecordController: vi.fn((_req, _res, next: NextFunction): void => next()),
  putRecordController: vi.fn((_req, _res, next: NextFunction): void => next())
}));

vi.mock('../../../../src/middlewares/validator.ts', () => ({
  validateRequestIntegrity: () => vi.fn((_req, _res, next: NextFunction): void => next()),
  validateRequestSchema: () => vi.fn((_req, _res, next: NextFunction): void => next())
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
