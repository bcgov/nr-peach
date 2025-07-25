import express from 'express';
import request from 'supertest';

import {
  deleteProcessEventsController,
  getProcessEventsController,
  postProcessEventsController,
  putProcessEventsController
} from '../../../../src/controllers/index.ts';
import {
  deleteProcessEventsSchemaValidator,
  getProcessEventsSchemaValidator,
  postProcessEventsIntegrityValidator,
  postProcessEventsSchemaValidator,
  putProcessEventsIntegrityValidator,
  putProcessEventsSchemaValidator
} from '../../../../src/validators/index.ts';

import router from '../../../../src/routes/v1/process.ts';

import type { NextFunction } from 'express';

const app = express();
app.use(router);

vi.mock('../../../../src/controllers/process.ts', () => ({
  deleteProcessEventsController: vi.fn((_req, _res, next: NextFunction): void => next()),
  getProcessEventsController: vi.fn((_req, _res, next: NextFunction): void => next()),
  postProcessEventsController: vi.fn((_req, _res, next: NextFunction): void => next()),
  putProcessEventsController: vi.fn((_req, _res, next: NextFunction): void => next())
}));

vi.mock('../../../../src/middlewares/validator.ts', () => ({
  validateRequestIntegrity: () => vi.fn((_req, _res, next: NextFunction): void => next()),
  validateRequestSchema: () => vi.fn((_req, _res, next: NextFunction): void => next())
}));

describe('Process Routes', () => {
  describe('DELETE /process-events', () => {
    it('should call the schema validator and controller', async () => {
      await request(app).delete('/process-events');
      expect(deleteProcessEventsSchemaValidator).toHaveBeenCalled();
      expect(deleteProcessEventsController).toHaveBeenCalled();
    });
  });

  describe('GET /process-events', () => {
    it('should call the schema validator and controller', async () => {
      await request(app).get('/process-events');
      expect(getProcessEventsSchemaValidator).toHaveBeenCalled();
      expect(getProcessEventsController).toHaveBeenCalled();
    });
  });

  describe('POST /process-events', () => {
    it('should call the schema validator, integrity validator and controller', async () => {
      await request(app).post('/process-events').send({});
      expect(postProcessEventsSchemaValidator).toHaveBeenCalled();
      expect(postProcessEventsIntegrityValidator).toHaveBeenCalled();
      expect(postProcessEventsController).toHaveBeenCalled();
    });
  });

  describe('PUT /process-events', () => {
    it('should call the schema validator, integrity validator and controller', async () => {
      await request(app).put('/process-events').send({});
      expect(putProcessEventsSchemaValidator).toHaveBeenCalled();
      expect(putProcessEventsIntegrityValidator).toHaveBeenCalled();
      expect(putProcessEventsController).toHaveBeenCalled();
    });
  });
});
