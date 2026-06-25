import { record_id, system_id } from './schema/index.ts';
import { validateRequestSchema } from '#src/middlewares/index';

import type { RequestHandler } from 'express';

export const deleteAssetsSchemaValidator: RequestHandler = validateRequestSchema({
  query: {
    type: 'object',
    properties: { record_id, system_id },
    required: ['record_id', 'system_id']
  }
});

export const getAssetsSchemaValidator: RequestHandler = validateRequestSchema({
  query: {
    type: 'object',
    properties: { record_id, system_id },
    required: ['record_id']
  }
});
