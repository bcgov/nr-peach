import { Ajv } from 'ajv';
import formats from 'ajv-formats';

import { getLogger } from '../utils/log.ts';

import type { AnySchemaObject, Plugin } from 'ajv';
import type { FormatsPluginOptions } from 'ajv-formats';

const log = getLogger(import.meta.filename);

/**
 * Loads a schema from the given URI and returns it as an AnySchemaObject.
 * @param uri The URI of the schema to load
 * @returns The loaded schema as an AnySchemaObject
 */
export async function loadSchema(uri: string): Promise<AnySchemaObject> {
  log.verbose(uri);
  const res = await fetch(uri);
  if (!res.ok) throw new Error(`Failed to fetch schema from ${uri}`);
  return (await res.json()) as AnySchemaObject;
}

/**
 * Compiles the schema and validates data.
 * @param schema The schema to compile and validate against
 * @param data The data to validate
 * @returns Validation result
 */
export async function validateSchema(
  schema: string | AnySchemaObject,
  data: unknown
) {
  const ajv = new Ajv({ allErrors: true, loadSchema });
  // TS workaround: https://github.com/ajv-validator/ajv-formats/issues/85#issuecomment-2377962689
  const addFormats = formats as unknown as Plugin<FormatsPluginOptions>;
  addFormats(ajv);

  const def = typeof schema === 'string' ? await loadSchema(schema) : schema;
  const validator = await ajv.compileAsync(def);
  return validator(data);
}
