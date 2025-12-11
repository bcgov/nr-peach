import type { AnySchemaObject } from 'ajv/dist/core.js';

export const record_id: AnySchemaObject = { type: 'string' };

export const system_id: AnySchemaObject = {
  type: 'string',
  pattern: String.raw`^ITSM-\d{4,5}$`
};
