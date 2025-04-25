import { Ajv } from 'ajv';
import formats from 'ajv-formats';

import { getLogger } from '../utils/log.ts';

import type { AnySchemaObject, Plugin } from 'ajv';
import type { FormatsPluginOptions } from 'ajv-formats';

const log = getLogger(import.meta.filename);
const schemaCache: Record<string, AnySchemaObject> = {};

/**
 * Loads a JSON schema from the provided URI.
 * Uses the cache if available; otherwise, fetches from the URI.
 * @param schema The schema URI.
 * @returns A promise resolving to an AnySchemaObject.
 * @throws If the schema cannot be loaded.
 */
export async function loadSchema(schema: string): Promise<AnySchemaObject> {
  const cached = schema in schemaCache;
  log.verbose('loadSchema', { cached, schema });

  if (!cached) {
    try {
      const res = await fetch(schema);
      if (!res.ok) throw new Error(`Failed to fetch schema ${schema}`);
      schemaCache[schema] = (await res.json()) as AnySchemaObject;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new Error(`Failed to load schema ${schema}`);
    }
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
