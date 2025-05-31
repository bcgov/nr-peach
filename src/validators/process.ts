import { getPiesSchemaUri, pies, record_id, system_id } from './index.ts';
import { validateRequest } from '../middlewares/index.ts';

import type { RequestHandler } from 'express';

export const deleteProcessEventsValidator: RequestHandler = validateRequest({
  query: {
    type: 'object',
    properties: { record_id, system_id },
    required: ['record_id']
  }
});

export const getProcessEventsValidator: RequestHandler = validateRequest({
  query: {
    type: 'object',
    properties: { record_id, system_id },
    required: ['record_id']
  }
});

export const postProcessEventsValidator: RequestHandler = validateRequest({
  body: getPiesSchemaUri(pies.spec.message.processEventSet)
});

export const putProcessEventsValidator: RequestHandler = validateRequest({
  body: getPiesSchemaUri(pies.spec.message.processEventSet)
});
