import type { SchemaObject } from 'ajv';

export const record_id: SchemaObject = { type: 'string' };

export const system_id: SchemaObject = {
  type: 'string',
  pattern: String.raw`^ITSM-\d{4,5}$`
};
