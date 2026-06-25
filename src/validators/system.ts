import { system_id } from './schema/index.ts';
import { validateRequestSchema } from '#src/middlewares/index';

import type { RequestHandler } from 'express';

export const getSystemsSchemaValidator: RequestHandler = validateRequestSchema({
  query: {
    type: 'object',
    properties: { system_id },
    required: ['system_id']
  }
});
