import { getPiesSchemaUri, pies, asset_id, system_id } from './schema/index.ts';
import { validateRequestSchema } from '#src/middlewares/index';

import type { RequestHandler } from 'express';

export const deleteRecordLinkagesSchemaValidator: RequestHandler = validateRequestSchema({
  query: {
    type: 'object',
    properties: {
      asset_id,
      system_id,
      linked_asset_id: asset_id,
      linked_system_id: system_id
    },
    required: ['asset_id', 'linked_asset_id']
  }
});

export const getRecordLinkagesSchemaValidator: RequestHandler = validateRequestSchema({
  query: {
    type: 'object',
    properties: {
      asset_id,
      system_id,
      depth: {
        type: 'integer',
        minimum: -1
      }
    },
    required: ['asset_id']
  }
});

export const putRecordLinkagesSchemaValidator: RequestHandler = validateRequestSchema({
  body: getPiesSchemaUri(pies.spec.message.recordLinkage)
});
