import { IntegrityDefinitions } from './integrity/index.ts';
import { getPiesSchemaUri, pies, record_id, system_id } from './schema/index.ts';
import { validateRequestIntegrity, validateRequestSchema } from '#src/middlewares/index';

import type { RequestHandler } from 'express';

export const getRecordSchemaValidator: RequestHandler = validateRequestSchema({
  query: {
    type: 'object',
    properties: { record_id, system_id },
    required: ['record_id']
  }
});

export const postRecordIntegrityValidator: RequestHandler = validateRequestIntegrity({
  body: IntegrityDefinitions.record
});

export const postRecordSchemaValidator: RequestHandler = validateRequestSchema({
  body: getPiesSchemaUri(pies.spec.message.record)
});

export const pruneRecordSchemaValidator: RequestHandler = validateRequestSchema({
  query: {
    type: 'object',
    properties: { record_id, system_id },
    required: ['record_id']
  }
});

export const putRecordIntegrityValidator: RequestHandler = validateRequestIntegrity({
  body: IntegrityDefinitions.record
});

export const putRecordSchemaValidator: RequestHandler = validateRequestSchema({
  body: getPiesSchemaUri(pies.spec.message.record)
});
