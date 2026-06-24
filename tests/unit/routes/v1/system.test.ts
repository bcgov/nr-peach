import express from 'express';
import request from 'supertest';

import { getSystemsSchemaValidator } from '#src/validators/index';

import router from '#src/routes/v1/system';

import type { RequestHandler } from 'express';

const app = express();
app.use('/systems', router);

vi.mock('#src/middlewares/validator', () => ({
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
});
