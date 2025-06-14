import { record_id, system_id } from './common.ts';
import { validateRequestSchema } from '../middlewares/index.ts';

import type { RequestHandler } from 'express';

export const deleteRecordsSchemaValidator: RequestHandler = validateRequestSchema({
  query: {
    type: 'object',
    properties: { record_id, system_id },
    required: ['record_id']
  }
});

export const getRecordsSchemaValidator: RequestHandler = validateRequestSchema({
  query: {
    type: 'object',
    properties: { record_id, system_id },
    required: ['record_id']
  }
});

export const getSystemsSchemaValidator: RequestHandler = validateRequestSchema({
  query: {
    type: 'object',
    properties: { system_id },
    required: ['system_id']
  }
});
