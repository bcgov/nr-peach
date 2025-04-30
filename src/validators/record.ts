import { getPiesSchemaUri, pies, record_id, system_id } from './index.ts';
import { validateRequest } from '../middlewares/index.ts';

import type { RequestHandler } from 'express';

export const deleteRecordLinkagesValidator: RequestHandler = validateRequest({
  query: {
    properties: {
      record_id,
      system_id,
      linked_record_id: record_id,
      linked_system_id: system_id
    },
    required: ['record_id', 'linked_record_id']
  }
});

export const getRecordLinkagesValidator: RequestHandler = validateRequest({
  query: {
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

export const putRecordLinkagesValidator: RequestHandler = validateRequest({
  body: getPiesSchemaUri(pies.spec.message.recordLinkage)
});
