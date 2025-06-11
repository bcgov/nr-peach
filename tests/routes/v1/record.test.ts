import express from 'express';
import request from 'supertest';

import {
  deleteRecordLinkagesValidator,
  getRecordLinkagesValidator,
  putRecordLinkagesValidator
} from '../../../src/validators/index.ts';

import router from '../../../src/routes/v1/record.ts';

import type { NextFunction } from 'express';

const app = express();
app.use(router);

vi.mock('../../../src/middlewares/index.ts', () => ({
  validateRequestSchema: () => vi.fn((_req, _res, next: NextFunction): void => next())
}));

describe('Record Linkage Routes', () => {
  describe('GET /record-linkages', () => {
    it('should return 501', async () => {
      const response = await request(app).get('/record-linkages');
      expect(getRecordLinkagesValidator).toHaveBeenCalled();
      expect(response.status).toBe(501);
    });
  });

  describe('PUT /record-linkages', () => {
    it('should return 501', async () => {
      const response = await request(app).put('/record-linkages').send({});
      expect(putRecordLinkagesValidator).toHaveBeenCalled();
      expect(response.status).toBe(501);
    });
  });

  describe('DELETE /record-linkages', () => {
    it('should return 501', async () => {
      const response = await request(app).delete('/record-linkages');
      expect(deleteRecordLinkagesValidator).toHaveBeenCalled();
      expect(response.status).toBe(501);
    });
  });
});
