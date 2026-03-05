import { Ajv } from 'ajv';

import { integrityValidators } from './integrity/index.ts';
import { createAjvInstance, getPiesSchemaUri, loadSchema, pies } from './schema/index.ts';
import { getLogger } from '../utils/index.ts';

import type { AnySchemaObject, AnyValidateFunction, ErrorObject } from 'ajv/dist/core.js';
import type { IntegrityDictionary, IntegrityResult } from '../types/index.d.ts';

const log = getLogger(import.meta.filename);
const stringSchemaCache: Record<string, Ajv> = {};
const objectSchemaCache = new WeakMap<AnySchemaObject, Promise<AnyValidateFunction<unknown>>>();

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
 * Validates data against a JSON schema using asynchronous compilation and caching.
 * @remarks
 * This function optimizes performance by:
 * 1. Caching Ajv instances for string-identified schemas.
 * 2. Caching compilation promises for schema objects to prevent redundant processing.
 * @param schema - The validation blueprint. Can be a string identifier (URI/ID) or a schema object.
 * @param data - The payload to validate. Treated as `unknown` to ensure type-safe handling.
 * @returns A promise resolving to a validation result:
 * - `valid`: true if the data satisfies the schema.
 * - `errors`: An array of `ErrorObject` if validation fails, otherwise undefined.
 * @throws {Error} Will throw if the schema cannot be loaded or if compilation fails.
 */
export async function validateSchema(
  schema: AnySchemaObject | string,
  data: unknown
): Promise<{ valid: boolean; errors?: ErrorObject[] }> {
  let validate: AnyValidateFunction<unknown>;
  if (typeof schema === 'string') {
    const cached = schema in stringSchemaCache;
    log.verbose('validateSchema', { cached, schema });

    if (cached) {
      validate = stringSchemaCache[schema].getSchema(schema)!;
    } else {
      const ajv = createAjvInstance();

      const def = await loadSchema(schema);
      validate = await ajv.compileAsync(def);
      stringSchemaCache[schema] = ajv;
    }
  } else {
    let validatePromise = objectSchemaCache.get(schema);
    if (!validatePromise) {
      const ajv = createAjvInstance();
      validatePromise = ajv.compileAsync(schema);
      objectSchemaCache.set(schema, validatePromise);
    }
    validate = await validatePromise;
  }

  const valid = !!validate(data);
  return { valid: valid, errors: validate.errors ?? undefined };
}
