import { IntegrityDefinitions } from './integrity/index.ts';
import { getPiesSchemaUri, pies, record_id, system_id } from './schema/index.ts';
import { validateRequestIntegrity, validateRequestSchema } from '../middlewares/index.ts';

import type { RequestHandler } from 'express';

export const deleteRecordSchemaValidator: RequestHandler = validateRequestSchema({
  query: {
    type: 'object',
    properties: { record_id, system_id },
    required: ['record_id']
  }
});

export const getRecordSchemaValidator: RequestHandler = validateRequestSchema({
  query: {
    type: 'object',
    properties: { record_id, system_id },
    required: ['record_id']
  }
});

export const postRecordIntegrityValidator: RequestHandler = validateRequestIntegrity({
  body: IntegrityDefinitions.processEventSet
});

export const postRecordSchemaValidator: RequestHandler = validateRequestSchema({
  body: getPiesSchemaUri(pies.spec.message.record)
});

export const putRecordIntegrityValidator: RequestHandler = validateRequestIntegrity({
  body: IntegrityDefinitions.processEventSet
});

export const putRecordSchemaValidator: RequestHandler = validateRequestSchema({
  body: getPiesSchemaUri(pies.spec.message.record)
});
