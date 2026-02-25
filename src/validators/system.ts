import { record_id, system_id } from './schema/index.ts';
import { validateRequestSchema } from '../middlewares/index.ts';

import type { RequestHandler } from 'express';

export const deleteSystemRecordsSchemaValidator: RequestHandler = validateRequestSchema({
  query: {
    type: 'object',
    properties: { record_id, system_id },
    required: ['record_id', 'system_id']
  }
});

export const getSystemRecordsSchemaValidator: RequestHandler = validateRequestSchema({
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
