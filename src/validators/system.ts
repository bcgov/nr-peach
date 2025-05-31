import { record_id, system_id } from './index.ts';
import { validateRequest } from '../middlewares/index.ts';

import type { RequestHandler } from 'express';

export const deleteRecordsValidator: RequestHandler = validateRequest({
  query: {
    type: 'object',
    properties: { record_id, system_id },
    required: ['record_id']
  }
});

export const getRecordsValidator: RequestHandler = validateRequest({
  query: {
    type: 'object',
    properties: { record_id, system_id },
    required: ['record_id']
  }
});

export const getSystemsValidator: RequestHandler = validateRequest({
  query: {
    type: 'object',
    properties: { system_id },
    required: ['system_id']
  }
});
