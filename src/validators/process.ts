import { getPiesSchemaUri, pies, record_id, system_id } from './index.ts';
import { validateRequestSchema } from '../middlewares/index.ts';

import type { RequestHandler } from 'express';

export const deleteProcessEventsValidator: RequestHandler = validateRequestSchema({
  query: {
    type: 'object',
    properties: { record_id, system_id },
    required: ['record_id']
  }
});

export const getProcessEventsValidator: RequestHandler = validateRequestSchema({
  query: {
    type: 'object',
    properties: { record_id, system_id },
    required: ['record_id']
  }
});

export const postProcessEventsValidator: RequestHandler = validateRequestSchema({
  body: getPiesSchemaUri(pies.spec.message.processEventSet)
});

export const putProcessEventsValidator: RequestHandler = validateRequestSchema({
  body: getPiesSchemaUri(pies.spec.message.processEventSet)
});
