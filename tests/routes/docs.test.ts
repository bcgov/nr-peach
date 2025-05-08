import express from 'express';
import request from 'supertest';

import router from '../../src/routes/docs.ts';

const app = express();
app.use(router);

describe('Docs Router', () => {
  describe('GET /', () => {
    it('should return OpenAPI documentation HTML', async () => {
      const response = await request(app).get('/');
      expect(response.status).toBe(200);
      expect(response.text).toContain('<!DOCTYPE html>');
    });
  });

  describe('GET /openapi.yaml', () => {
    it('should return OpenAPI YAML spec', async () => {
      const response = await request(app).get('/openapi.yaml');
      expect(response.status).toBe(200);
      expect(response.type).toBe('application/yaml');
      expect(response.text).toContain('openapi:');
    });
  });

  describe('GET /openapi.json', () => {
    it('should return OpenAPI JSON spec', async () => {
      const response = await request(app).get('/openapi.json');
      expect(response.status).toBe(200);
      expect(response.type).toBe('application/json');
      expect(response.body).toHaveProperty('openapi');
    });
  });
});
