import express from 'express';
import request from 'supertest';

import { deleteAssetController } from '#src/controllers/index';
import { deleteAssetsSchemaValidator, getAssetsSchemaValidator } from '#src/validators/index';

import router from '#src/routes/v1/asset';

import type { RequestHandler } from 'express';

const app = express();
app.use(router);

vi.mock('#src/controllers/asset', () => ({
  deleteAssetController: vi.fn<RequestHandler>((_req, _res, next) => next())
}));

vi.mock('#src/middlewares/auth', () => ({
  authz: () => vi.fn<RequestHandler>((_req, _res, next) => next())
}));

vi.mock('#src/middlewares/validator', () => ({
  validateRequestIntegrity: () => vi.fn<RequestHandler>((_req, _res, next) => next()),
  validateRequestSchema: () => vi.fn<RequestHandler>((_req, _res, next) => next())
}));

describe('Asset Routes', () => {
  describe('GET /assets', () => {
    it('should return 501', async () => {
      const response = await request(app).get('/assets');
      expect(getAssetsSchemaValidator).toHaveBeenCalled();
      expect(response.status).toBe(501);
    });
  });

  describe('DELETE /assets', () => {
    it('should call the schema validator and controller', async () => {
      await request(app).delete('/assets');
      expect(deleteAssetsSchemaValidator).toHaveBeenCalled();
      expect(deleteAssetController).toHaveBeenCalled();
    });
  });
});
