import express from 'express';
import request from 'supertest';

import { validationSuccessController } from '#src/controllers/validate';

describe('Validate Controllers', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.post('/some/validate', validationSuccessController);
  });

  describe('POST /some/validate', () => {
    it('should respond with 200', async () => {
      const result = await request(app).post('/some/validate').send({}).expect(200);
      expect(result.ok).toBe(true);
      expect(result.body).toEqual({});
    });
  });
});
