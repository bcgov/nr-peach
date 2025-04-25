import { Ajv } from 'ajv';
import formats from 'ajv-formats';

import { getLogger } from '../utils/log.ts';

import type { AnySchemaObject, Plugin } from 'ajv';
import type { FormatsPluginOptions } from 'ajv-formats';

const log = getLogger(import.meta.filename);
const schemaCache: Record<string, AnySchemaObject> = {};

/**
 * Loads a schema from the given URI and returns it as an AnySchemaObject.
 * @param schema The URI of the schema to load
 * @returns The loaded schema as an AnySchemaObject
 */
export async function loadSchema(schema: string): Promise<AnySchemaObject> {
  const cached = schema in schemaCache;
  log.verbose('loadSchema', { cached, schema });

  if (!cached) {
    const res = await fetch(schema);
    if (!res.ok) throw new Error(`Failed to fetch schema from ${schema}`);

    const schemaObject = (await res.json()) as AnySchemaObject;
    schemaCache[schema] = schemaObject;
  }

  return schemaCache[schema];
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
): Promise<{ valid: boolean; errors?: unknown }> {
  const ajv = new Ajv({ allErrors: true, loadSchema });
  // TS workaround: https://github.com/ajv-validator/ajv-formats/issues/85#issuecomment-2377962689
  const addFormats = formats as unknown as Plugin<FormatsPluginOptions>;
  addFormats(ajv);

  const def = typeof schema === 'string' ? await loadSchema(schema) : schema;
  const validate = await ajv.compileAsync(def);
  const valid = validate(data) as boolean;
  return { valid: valid, errors: validate.errors ?? undefined };
}
