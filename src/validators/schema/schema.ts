import { Ajv } from 'ajv';
import formats from 'ajv-formats';
import stringify from 'fast-json-stable-stringify';
import { createHash } from 'node:crypto';

import { getLogger } from '#src/utils/index';

import type { SchemaObject, Options } from 'ajv';
import type { FormatsPlugin } from 'ajv-formats';

const log = getLogger(import.meta.filename);
const schemaCache: Record<string, SchemaObject> = {};

/**
 * Creates and configures an instance of Ajv (Another JSON Schema Validator).
 * @param opts - Optional configuration options to customize the Ajv instance.
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
  const addFormats = formats as unknown as FormatsPlugin;
  return addFormats(ajv);
}

/**
 * Ensures a schema has a unique $id. If missing, generates a deterministic hash based on the schema content.
 * @param schema - A JSON Schema object.
 * @returns The schema with a defined $id attribute.
 */
export function ensureSchemaId(schema: SchemaObject): SchemaObject {
  if (schema.$id) return schema;

  const hash = createHash('sha1').update(stringify(schema)).digest('hex');
  return { $id: `schema:${hash}`, ...schema };
}

/**
 * Loads a JSON schema from a given URI or retrieves it from the cache if already loaded.
 * @param schema - The URI of the schema to load.
 * @returns A promise that resolves to the loaded schema object.
 * @throws An error if the schema cannot be fetched or loaded.
 */
export async function loadSchema(schema: string): Promise<SchemaObject> {
  const cached = schema in schemaCache;
  log.trace({ cached, schema }, 'Loading JSON schema');

  if (!cached) {
    try {
      const res = await fetch(schema);
      if (!res.ok) throw new Error(`Failed to fetch schema ${schema}`);
      schemaCache[schema] = (await res.json()) as SchemaObject;
    } catch (error) {
      log.error({ error }, 'loadSchema');
      throw new Error(`Failed to load schema ${schema}`, { cause: error });
    }
  }

  return schemaCache[schema]!;
}
