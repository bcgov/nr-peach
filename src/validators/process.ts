import { IntegrityDefinitions } from './integrity/index.ts';
import { getPiesSchemaUri, pies, record_id, system_id } from './schema/index.ts';
import { validateRequestIntegrity, validateRequestSchema } from '../middlewares/index.ts';

import type { RequestHandler } from 'express';

export const deleteProcessEventsSchemaValidator: RequestHandler = validateRequestSchema({
  query: {
    type: 'object',
    properties: { record_id, system_id },
    required: ['record_id']
  }
});

export const getProcessEventsSchemaValidator: RequestHandler = validateRequestSchema({
  query: {
    type: 'object',
    properties: { record_id, system_id },
    required: ['record_id']
  }
});

export const postProcessEventsIntegrityValidator: RequestHandler = validateRequestIntegrity({
  body: IntegrityDefinitions.processEventSet
});

export const postProcessEventsSchemaValidator: RequestHandler = validateRequestSchema({
  body: getPiesSchemaUri(pies.spec.message.processEventSet)
});

export const putProcessEventsIntegrityValidator: RequestHandler = validateRequestIntegrity({
  body: IntegrityDefinitions.processEventSet
});

export const putProcessEventsSchemaValidator: RequestHandler = validateRequestSchema({
  body: getPiesSchemaUri(pies.spec.message.processEventSet)
});
