import { getPiesSchemaUri, pies, record_id, system_id } from './schema/index.ts';
import { validateRequestSchema } from '../middlewares/index.ts';

import type { RequestHandler } from 'express';

export const deleteRecordLinkagesSchemaValidator: RequestHandler = validateRequestSchema({
  query: {
    type: 'object',
    properties: {
      record_id,
      system_id,
      linked_record_id: record_id,
      linked_system_id: system_id
    },
    required: ['record_id', 'linked_record_id']
  }
});

export const getRecordLinkagesSchemaValidator: RequestHandler = validateRequestSchema({
  query: {
    type: 'object',
    properties: {
      record_id,
      system_id,
      depth: {
        type: 'integer',
        minimum: -1
      }
    },
    required: ['record_id']
  }
});

export const putRecordLinkagesSchemaValidator: RequestHandler = validateRequestSchema({
  body: getPiesSchemaUri(pies.spec.message.recordLinkage)
});
