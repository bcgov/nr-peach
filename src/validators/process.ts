import { pies, getPiesSchemaUri } from './index.ts';
import { validateRequest } from '../middlewares/index.ts';

import type { RequestHandler } from 'express';

// TODO: Consider creating a "common" attribute schema library
export const deleteProcessEventsValidator: RequestHandler = validateRequest({
  query: {
    properties: {
      record_id: { type: 'string' },
      system_id: { type: 'string', pattern: '^ITSM-\\d{4,5}$' }
    },
    required: ['record_id']
  }
});

export const getProcessEventsValidator: RequestHandler = validateRequest({
  query: {
    properties: {
      record_id: { type: 'string' },
      system_id: { type: 'string', pattern: '^ITSM-\\d{4,5}$' }
    },
    required: ['record_id']
  }
});

export const postProcessEventsValidator: RequestHandler = validateRequest({
  body: getPiesSchemaUri(pies.spec.message.processEventSet)
});

export const putProcessEventsValidator: RequestHandler = validateRequest({
  body: getPiesSchemaUri(pies.spec.message.processEventSet)
});
