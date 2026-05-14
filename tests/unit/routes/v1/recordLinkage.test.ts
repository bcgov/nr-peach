import express from 'express';
import request from 'supertest';

import { validationSuccessController } from '#src/controllers/index';
import {
  deleteRecordLinkagesSchemaValidator,
  getRecordLinkagesSchemaValidator,
  putRecordLinkagesSchemaValidator
} from '#src/validators/index';

import router from '#src/routes/v1/recordLinkage';

import type { RequestHandler } from 'express';

const app = express();
app.use(router);

vi.mock('#src/controllers/validate', () => ({
  validationSuccessController: vi.fn<RequestHandler>((_req, _res, next) => next())
}));

vi.mock('#src/middlewares/auth', () => ({
  authz: () => vi.fn<RequestHandler>((_req, _res, next) => next()),
  isJsonBody: () => vi.fn<RequestHandler>((_req, _res, next) => next())
}));

vi.mock('#src/middlewares/validator', () => ({
  validateRequestIntegrity: () => vi.fn<RequestHandler>((_req, _res, next) => next()),
  validateRequestSchema: () => vi.fn<RequestHandler>((_req, _res, next) => next())
}));

describe('Record Linkage Validation Routes', () => {
  describe('PUT /record-linkages/validate', () => {
    it('should call the schema validator and controller', async () => {
      await request(app).put('/record-linkages/validate').send({});
      expect(validationSuccessController).toHaveBeenCalled();
    });
  });
});

describe('Record Linkage Routes', () => {
  describe('GET /record-linkages', () => {
    it('should return 501', async () => {
      const response = await request(app).get('/record-linkages');
      expect(getRecordLinkagesSchemaValidator).toHaveBeenCalled();
      expect(response.status).toBe(501);
    });
  });

  describe('PUT /record-linkages', () => {
    it('should return 501', async () => {
      const response = await request(app).put('/record-linkages').send({});
      expect(putRecordLinkagesSchemaValidator).toHaveBeenCalled();
      expect(response.status).toBe(501);
    });
  });

  describe('DELETE /record-linkages', () => {
    it('should return 501', async () => {
      const response = await request(app).delete('/record-linkages');
      expect(deleteRecordLinkagesSchemaValidator).toHaveBeenCalled();
      expect(response.status).toBe(501);
    });
  });
});
