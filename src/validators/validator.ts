import { Ajv } from 'ajv';

import { integrityValidators } from './integrity/index.ts';
import { createAjvInstance, getPiesSchemaUri, loadSchema, pies } from './schema/index.ts';
import { getLogger } from '../utils/index.ts';

import type { AnySchemaObject, AnyValidateFunction, ErrorObject } from 'ajv/dist/core.js';
import type { IntegrityDictionary, IntegrityResult } from '../types/index.d.ts';

const log = getLogger(import.meta.filename);
const ajvCache: Record<string, Ajv> = {};

// Only pre-cache schemas in production to avoid bombarding Github API in development
if (process.env.NODE_ENV === 'production') await preCachePiesSchema();

/**
 * Pre-caches all PIES JSON schemas and their dependencies by validating each schema URI.
 * @returns A promise that resolves when all schemas have been pre-cached.
 */
export async function preCachePiesSchema(): Promise<{ valid: boolean; errors?: ErrorObject[] }[]> {
  log.verbose('Pre-caching PIES JSON schemas...');

  const start = Date.now();
  return await Promise.all(
    Object.values(pies.spec.message)
      .map((kind) => getPiesSchemaUri(kind)) // Pre-cache all PIES message schemas and dependencies
      .map((uri) => validateSchema(uri, null)) // Ignore the result, just pre-cache schemas
  ).finally(() => {
    const end = Date.now();
    log.info('PIES JSON schemas are pre-cached', { duration: end - start });
  });
}

/**
 * Validates the integrity of the provided data based on the specified type.
 * @template K - A key of the `IntegrityMap` that specifies the type of validation to perform.
 * @param type - The type of integrity validation to apply, corresponding to a key in `IntegrityMap`.
 * @param data - The data to validate, which must match the type associated with the specified key in `IntegrityMap`.
 * @returns An `IntegrityResult` indicating the outcome of the validation.
 */
export function validateIntegrity<K extends keyof IntegrityDictionary>(
  type: K,
  data: IntegrityDictionary[K]
): IntegrityResult {
  return integrityValidators[type](data);
}

/**
 * Validates data against a JSON schema.
 * Caches string-identified schemas for reuse; compiles non-string schemas directly.
 * @param schema The schema to validate against (string identifier or schema object).
 * @param data The data to validate.
 * @returns A promise that resolves to an object containing:
 * - `valid`: A boolean indicating whether the data is valid according to the schema.
 * - `errors`: An optional property containing validation errors if the data is invalid.
 */
export async function validateSchema(
  schema: AnySchemaObject | string,
  data: unknown
): Promise<{ valid: boolean; errors?: ErrorObject[] }> {
  let validate: AnyValidateFunction<unknown>;
  if (typeof schema === 'string') {
    const cached = schema in ajvCache;
    log.verbose('validateSchema', { cached, schema });

    if (cached) {
      validate = ajvCache[schema].getSchema(schema)!;
    } else {
      const ajv = createAjvInstance();

      const def = await loadSchema(schema);
      validate = await ajv.compileAsync(def);
      ajvCache[schema] = ajv;
    }
  } else {
    const ajv = createAjvInstance();
    validate = await ajv.compileAsync(schema);
  }

  const valid = !!validate(data);
  return { valid: valid, errors: validate.errors ?? undefined };
}
