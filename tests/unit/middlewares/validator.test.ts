import express from 'express';
import request from 'supertest';

import { isJsonBody, validateRequestIntegrity, validateRequestSchema } from '#src/middlewares/validator';
import * as validators from '#src/validators/index';
import { IntegrityDefinitions } from '#src/validators/integrity/integrity';

import type { Application, Request, RequestHandler, Response } from 'express';

interface BadValidationResponse {
  body: { detail: string; errors: Record<string, unknown> };
  status: number;
}

describe('isJsonBody', () => {
  const mockHandler = vi.fn((_req: Request, res: Response) => res.status(200).send('Success'));
  let app: Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  it('should call next() when Content-Type is application/json', async () => {
    app.post('/test', isJsonBody(), mockHandler as unknown as RequestHandler);

    const response = await request(app).post('/test').set('Content-Type', 'application/json').send({ data: 'test' });

    expect(response.status).toBe(200);
    expect(response.text).toBe('Success');
    expect(mockHandler).toHaveBeenCalledTimes(1);
  });

  it('should return 400 when Content-Type is missing', async () => {
    app.post('/test', isJsonBody(), mockHandler as unknown as RequestHandler);

    // .send() in supertest often sets JSON by default,
    // so we use .set() to ensure it's empty or different
    const response = (await request(app)
      .post('/test')
      .set('Content-Type', '')
      .send('plain text')) as BadValidationResponse;

    expect(response.status).toBe(400);
    expect(response.body.detail).toBe('Invalid content type');
    expect(mockHandler).toHaveBeenCalledTimes(0);
  });

  it('should return 400 when Content-Type is text/plain', async () => {
    app.post('/test', isJsonBody(), mockHandler as unknown as RequestHandler);

    const response = (await request(app)
      .post('/test')
      .set('Content-Type', 'text/plain')
      .send('some text')) as BadValidationResponse;

    expect(response.status).toBe(400);
    expect(response.body.detail).toBe('Invalid content type');
    expect(mockHandler).toHaveBeenCalledTimes(0);
  });

  it('should handle charset variations in application/json', async () => {
    app.post('/test', isJsonBody(), mockHandler as unknown as RequestHandler);

    // Express's req.is() handles 'application/json; charset=utf-8' correctly
    const response = await request(app)
      .post('/test')
      .set('Content-Type', 'application/json; charset=utf-8')
      .send({ data: 'test' });

    expect(response.status).toBe(200);
    expect(mockHandler).toHaveBeenCalledTimes(1);
  });
});

describe('validateRequestIntegrity', () => {
  const mockHandler = vi.fn((_req: Request, res: Response) => res.status(200).send('Success'));
  const validateIntegritySpy = vi.spyOn(validators, 'validateIntegrity');

  let app: Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  it('should call next if all integrity validations pass', async () => {
    validateIntegritySpy.mockReturnValue({ valid: true });

    app.post(
      '/test',
      validateRequestIntegrity({ body: IntegrityDefinitions.record }),
      mockHandler as unknown as RequestHandler
    );

    const response = await request(app).post('/test').send({ name: 'John Doe' });

    expect(response.status).toBe(200);
    expect(mockHandler).toHaveBeenCalledTimes(1);
    expect(validateIntegritySpy).toHaveBeenCalledWith(IntegrityDefinitions.record, {
      name: 'John Doe'
    });
  });

  it('should validate headers if schema is provided', async () => {
    validateIntegritySpy.mockReturnValue({ valid: true });

    app.get(
      '/test',
      validateRequestIntegrity({ headers: IntegrityDefinitions.record }),
      mockHandler as unknown as RequestHandler
    );

    const response = await request(app).get('/test').set('authorization', 'Bearer token');

    expect(response.status).toBe(200);
    expect(mockHandler).toHaveBeenCalledTimes(1);
    expect(validateIntegritySpy).toHaveBeenCalledWith(
      IntegrityDefinitions.record,
      expect.objectContaining({
        authorization: 'Bearer token'
      })
    );
  });

  it('should return 422 if integrity validation fails', async () => {
    validateIntegritySpy.mockReturnValue({
      valid: false,
      errors: [{ message: 'Invalid body', instancePath: 'instancePath', key: 'key', value: 'value' }]
    });

    app.post(
      '/test',
      validateRequestIntegrity({ body: IntegrityDefinitions.record }),
      mockHandler as unknown as RequestHandler
    );

    const response = (await request(app).post('/test').send({})) as BadValidationResponse;

    expect(response.status).toBe(422);
    expect(response.body.detail).toContain('body');
    expect(response.body.errors.body).toBeTruthy();
    expect(mockHandler).toHaveBeenCalledTimes(0);
    expect(validateIntegritySpy).toHaveBeenCalledWith(IntegrityDefinitions.record, {});
  });

  it('should return 422 and handle multiple integrity validation errors', async () => {
    validateIntegritySpy
      .mockReturnValueOnce({
        valid: false,
        errors: [{ message: 'Invalid body', instancePath: 'instancePath', key: 'key', value: 'value' }]
      })
      .mockReturnValueOnce({
        valid: false,
        errors: [{ message: 'Missing query', instancePath: 'instancePath', key: 'key', value: 'value' }]
      });

    app.post(
      '/test',
      validateRequestIntegrity({
        body: IntegrityDefinitions.record,
        query: IntegrityDefinitions.recordLinkage
      }),
      mockHandler as unknown as RequestHandler
    );

    const response = (await request(app).post('/test').query({}).send({})) as BadValidationResponse;

    expect(response.status).toBe(422);
    expect(response.body.detail).toContain('body');
    expect(response.body.detail).toContain('query');
    expect(response.body.errors.body).toBeTruthy();
    expect(response.body.errors.query).toBeTruthy();
    expect(mockHandler).toHaveBeenCalledTimes(0);
    expect(validateIntegritySpy).toHaveBeenNthCalledWith(1, IntegrityDefinitions.record, {});
    expect(validateIntegritySpy).toHaveBeenNthCalledWith(2, IntegrityDefinitions.recordLinkage, {});
  });
});

describe('validateRequestSchema', () => {
  const mockHandler = vi.fn((_req: Request, res: Response) => res.status(200).send('Success'));
  const validateSchemaSpy = vi.spyOn(validators, 'validateSchema');

  let app: Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  it('should call next if all validations pass', async () => {
    validateSchemaSpy.mockResolvedValue({ valid: true });

    app.post(
      '/test',
      validateRequestSchema({
        body: {
          type: 'object',
          properties: { name: { type: 'string' } },
          required: ['name']
        }
      }),
      mockHandler as unknown as RequestHandler
    );

    const response = await request(app).post('/test').send({ name: 'John Doe' });

    expect(response.status).toBe(200);
    expect(mockHandler).toHaveBeenCalledTimes(1);
    expect(validateSchemaSpy).toHaveBeenCalledWith(
      {
        type: 'object',
        properties: { name: { type: 'string' } },
        required: ['name']
      },
      { name: 'John Doe' }
    );
  });

  it('should validate query parameters if schema is provided', async () => {
    validateSchemaSpy.mockResolvedValue({ valid: true });

    app.get(
      '/test',
      validateRequestSchema({
        query: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id']
        }
      }),
      mockHandler as unknown as RequestHandler
    );

    const response = await request(app).get('/test').query({ id: '123' });

    expect(response.status).toBe(200);
    expect(mockHandler).toHaveBeenCalledTimes(1);
    expect(validateSchemaSpy).toHaveBeenCalledWith(
      {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id']
      },
      { id: '123' }
    );
  });

  it('should return 422 if validation fails', async () => {
    validateSchemaSpy.mockResolvedValue({
      valid: false,
      errors: [
        {
          message: 'Invalid body',
          keyword: '',
          instancePath: '',
          schemaPath: '',
          params: {}
        }
      ]
    });

    app.post(
      '/test',
      validateRequestSchema({
        body: {
          type: 'object',
          properties: { name: { type: 'string' } },
          required: ['name']
        }
      }),
      mockHandler as unknown as RequestHandler
    );

    const response = (await request(app).post('/test').send({})) as BadValidationResponse;

    expect(response.status).toBe(422);
    expect(response.body.detail).toContain('body');
    expect(response.body.errors.body).toBeTruthy();
    expect(mockHandler).toHaveBeenCalledTimes(0);
    expect(validateSchemaSpy).toHaveBeenCalledWith(
      {
        type: 'object',
        properties: { name: { type: 'string' } },
        required: ['name']
      },
      {}
    );
  });

  it('should return 422 and handle multiple validation errors', async () => {
    validateSchemaSpy
      .mockResolvedValueOnce({
        valid: false,
        errors: [
          {
            message: 'Invalid body',
            keyword: '',
            instancePath: '',
            schemaPath: '',
            params: {}
          }
        ]
      })
      .mockResolvedValueOnce({
        valid: false,
        errors: [
          {
            message: 'Missing query',
            keyword: '',
            instancePath: '',
            schemaPath: '',
            params: {}
          }
        ]
      });

    app.post(
      '/test',
      validateRequestSchema({
        body: {
          type: 'object',
          properties: { name: { type: 'string' } },
          required: ['name']
        },
        query: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id']
        }
      }),
      mockHandler as unknown as RequestHandler
    );

    const response = (await request(app).post('/test').query({}).send({})) as BadValidationResponse;

    expect(response.status).toBe(422);
    expect(response.body.detail).toContain('body');
    expect(response.body.detail).toContain('query');
    expect(response.body.errors.body).toBeTruthy();
    expect(response.body.errors.query).toBeTruthy();
    expect(mockHandler).toHaveBeenCalledTimes(0);
    expect(validateSchemaSpy).toHaveBeenNthCalledWith(
      1,
      {
        type: 'object',
        properties: { name: { type: 'string' } },
        required: ['name']
      },
      {}
    );
    expect(validateSchemaSpy).toHaveBeenNthCalledWith(
      2,
      {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id']
      },
      {}
    );
  });
});
