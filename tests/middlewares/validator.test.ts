import express from 'express';
import request from 'supertest';

import { validateRequestIntegrity, validateRequestSchema } from '../../src/middlewares/validator.ts';
import Problem from '../../src/utils/problem.ts';
import * as validators from '../../src/validators/index.ts';

import type { Application, Request, RequestHandler, Response } from 'express';

describe('validateRequestIntegrity', () => {
  const mockHandler = vi.fn((_req: Request, res: Response) => res.status(200).send('Success'));
  const sendSpy = vi.spyOn(Problem.prototype, 'send');
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
      validateRequestIntegrity({ body: validators.IntegrityDefinitions.processEventSet }),
      mockHandler as unknown as RequestHandler
    );

    const response = await request(app).post('/test').send({ name: 'John Doe' });

    expect(response.status).toBe(200);
    expect(mockHandler).toHaveBeenCalledTimes(1);
    expect(sendSpy).toHaveBeenCalledTimes(0);
    expect(validateIntegritySpy).toHaveBeenCalledWith(validators.IntegrityDefinitions.processEventSet, {
      name: 'John Doe'
    });
  });

  it('should validate headers if schema is provided', async () => {
    validateIntegritySpy.mockReturnValue({ valid: true });

    app.get(
      '/test',
      validateRequestIntegrity({ headers: validators.IntegrityDefinitions.processEventSet }),
      mockHandler as unknown as RequestHandler
    );

    const response = await request(app).get('/test').set('authorization', 'Bearer token');

    expect(response.status).toBe(200);
    expect(mockHandler).toHaveBeenCalledTimes(1);
    expect(sendSpy).toHaveBeenCalledTimes(0);
    expect(validateIntegritySpy).toHaveBeenCalledWith(
      validators.IntegrityDefinitions.processEventSet,
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
      validateRequestIntegrity({ body: validators.IntegrityDefinitions.processEventSet }),
      mockHandler as unknown as RequestHandler
    );

    const response = await request(app).post('/test').send({});

    expect(response.status).toBe(422);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.detail).toContain('body');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.errors.body).toBeTruthy();
    expect(mockHandler).toHaveBeenCalledTimes(0);
    // expect(sendSpy).toHaveBeenCalledTimes(1); // TODO: Figure out why this is not called
    expect(validateIntegritySpy).toHaveBeenCalledWith(validators.IntegrityDefinitions.processEventSet, {});
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
        body: validators.IntegrityDefinitions.processEventSet,
        query: validators.IntegrityDefinitions.recordLinkage
      }),
      mockHandler as unknown as RequestHandler
    );

    const response = await request(app).post('/test').query({}).send({});

    expect(response.status).toBe(422);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.detail).toContain('body');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.detail).toContain('query');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.errors.body).toBeTruthy();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.errors.query).toBeTruthy();
    expect(mockHandler).toHaveBeenCalledTimes(0);
    // expect(sendSpy).toHaveBeenCalledTimes(1); // TODO: Figure out why this is not called
    expect(validateIntegritySpy).toHaveBeenNthCalledWith(1, validators.IntegrityDefinitions.processEventSet, {});
    expect(validateIntegritySpy).toHaveBeenNthCalledWith(2, validators.IntegrityDefinitions.recordLinkage, {});
  });
});

describe('validateRequestSchema', () => {
  const mockHandler = vi.fn((_req: Request, res: Response) => res.status(200).send('Success'));
  const sendSpy = vi.spyOn(Problem.prototype, 'send');
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
    expect(sendSpy).toHaveBeenCalledTimes(0);
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
    expect(sendSpy).toHaveBeenCalledTimes(0);
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

    const response = await request(app).post('/test').send({});

    expect(response.status).toBe(422);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.detail).toContain('body');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.errors.body).toBeTruthy();
    expect(mockHandler).toHaveBeenCalledTimes(0);
    expect(sendSpy).toHaveBeenCalledTimes(1);
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

    const response = await request(app).post('/test').query({}).send({});

    expect(response.status).toBe(422);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.detail).toContain('body');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.detail).toContain('query');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.errors.body).toBeTruthy();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(response.body.errors.query).toBeTruthy();
    expect(mockHandler).toHaveBeenCalledTimes(0);
    expect(sendSpy).toHaveBeenCalledTimes(1);
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
