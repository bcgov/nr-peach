import { Ajv } from 'ajv';
import formats from 'ajv-formats';

import { getLogger } from '../../utils/index.ts';

import type { AnySchemaObject, Options, Plugin } from 'ajv/dist/core.js';
import type { FormatsPluginOptions } from 'ajv-formats';

const log = getLogger(import.meta.filename);
const schemaCache: Record<string, AnySchemaObject> = {};

/**
 * Creates and configures an instance of Ajv (Another JSON Schema Validator).
 * @param opts Optional configuration options to customize the Ajv instance.
 *             These options are merged with the default configuration.
 *             For example, you can pass options like `strict: false` to
 *             modify Ajv's behavior.
 * @returns A configured Ajv instance with all errors enabled and typical formats applied.
 */
export function createAjvInstance(opts?: Options): Ajv {
  const ajv = new Ajv({
    allErrors: true,
    /**
     * Type Coersion
     * @see https://ajv.js.org/guide/modifying-data.html#coercing-data-types
     */
    coerceTypes: true,
    loadSchema,
    ...opts
  });
  // TS workaround: https://github.com/ajv-validator/ajv-formats/issues/85#issuecomment-2377962689
  const addFormats = formats as unknown as Plugin<FormatsPluginOptions>;
  return addFormats(ajv);
}

/**
 * Loads a JSON schema from a given URI or retrieves it from the cache if already loaded.
 * @param schema The URI of the schema to load.
 * @returns A promise that resolves to the loaded schema object.
 * @throws {unknown} An error if the schema cannot be fetched or loaded.
 */
export async function loadSchema(schema: string): Promise<AnySchemaObject> {
  const cached = schema in schemaCache;
  log.verbose('loadSchema', { cached, schema });

  if (!cached) {
    try {
      const res = await fetch(schema);
      if (!res.ok) throw new Error(`Failed to fetch schema ${schema}`);
      schemaCache[schema] = (await res.json()) as AnySchemaObject;
    } catch (error) {
      log.error('loadSchema', { error });
      throw new Error(`Failed to load schema ${schema}`);
    }
  }

  return schemaCache[schema];
}
