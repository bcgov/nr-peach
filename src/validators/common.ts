import type { AnySchemaObject } from 'ajv';

export const record_id: AnySchemaObject = { type: 'string' };

export const system_id: AnySchemaObject = {
  type: 'string',
  pattern: '^ITSM-\\d{4,5}$'
};
