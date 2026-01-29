import express from 'express';
import request from 'supertest';

import {
  deleteRecordLinkagesSchemaValidator,
  getRecordLinkagesSchemaValidator,
  putRecordLinkagesSchemaValidator
} from '../../../../src/validators/index.ts';

import router from '../../../../src/routes/v1/recordLinkage.ts';

import type { RequestHandler } from 'express';

const app = express();
app.use(router);

vi.mock('../../../../src/middlewares/auth.ts', () => ({
  authz: () => vi.fn<RequestHandler>((_req, _res, next) => next())
}));

vi.mock('../../../../src/middlewares/validator.ts', () => ({
  validateRequestIntegrity: () => vi.fn<RequestHandler>((_req, _res, next) => next()),
  validateRequestSchema: () => vi.fn<RequestHandler>((_req, _res, next) => next())
}));

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
