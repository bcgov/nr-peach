import { integrityValidators } from './integrity/index.ts';
import { createAjvInstance, ensureSchemaId, getPiesSchemaUri, loadSchema, pies } from './schema/index.ts';
import { getLogger } from '../utils/index.ts';

import type { AnySchemaObject, AnyValidateFunction, ErrorObject } from 'ajv/dist/core.js';
import type { IntegrityDictionary, IntegrityResult } from '../types/index.d.ts';

const ajv = createAjvInstance();

const log = getLogger(import.meta.filename);
const inFlightCompilations = new Map<string, Promise<AnyValidateFunction<unknown>>>();

// Only pre-cache schemas in production to avoid bombarding Github API in development
if (process.env.NODE_ENV === 'production') await preCachePiesSchema();

/**
 * Pre-caches all PIES JSON schemas and their dependencies by validating each schema URI.
 * @returns A promise that resolves when all schemas have been pre-cached.
 */
export async function preCachePiesSchema(): Promise<{ valid: boolean; errors?: ErrorObject[] }[]> {
  log.debug('Pre-caching PIES JSON schemas');

  const start = Date.now();
  return await Promise.all(
    Object.values(pies.spec.message)
      .map((kind) => getPiesSchemaUri(kind)) // Pre-cache all PIES message schemas and dependencies
      .map((uri) => validateSchema(uri, null)) // Ignore the result, just pre-cache schemas
  ).finally(() => {
    const end = Date.now();
    log.info({ duration: end - start }, 'PIES JSON schemas are pre-cached');
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
 * Validates data against a JSON schema using async compilation, deterministic hashing, and request deduplication.
 * @remarks
 * This function optimizes performance and reliability through three layers:
 * 1. **Persistent Cache**: Uses Ajv's internal registry for schemas with a known `$id` or URI.
 * 2. **Deterministic Hashing**: Anonymous schema objects are automatically assigned a
 * stable `$id` based on their content, preventing redundant compilations of identical structures.
 * 3. **Concurrency Lock**: Uses an `in-flight` promise map to ensure that multiple
 * simultaneous requests for the same new schema trigger only one compilation/load task.
 * @param schema - The validation blueprint. Can be a string identifier (URI/ID) or a schema object.
 * Objects without an `$id` will have one auto-generated.
 * @param data - The payload to validate. Treated as `unknown` for type safety.
 * @returns A promise resolving to a validation result:
 * - `valid`: true if the data satisfies the schema.
 * - `errors`: An array of `ErrorObject` if validation fails, otherwise undefined.
 * @throws {Error} Will throw if `loadSchema` fails to fetch a remote definition or
 * if the schema contains syntax errors.
 */
export async function validateSchema(
  schema: AnySchemaObject | string,
  data: unknown
): Promise<{ valid: boolean; errors?: ErrorObject[] }> {
  const isString = typeof schema === 'string';
  const definition = isString ? null : ensureSchemaId(schema);
  const schemaId = isString ? schema : definition!.$id!;

  let validate = ajv.getSchema(schemaId);

  if (!validate) {
    // Check if another request is already compiling this
    let promise = inFlightCompilations.get(schemaId);
    if (!promise) {
      promise = (async (): Promise<AnyValidateFunction<unknown>> => {
        try {
          const finalDef = definition ?? (await loadSchema(schemaId));
          return await ajv.compileAsync(finalDef);
        } finally {
          inFlightCompilations.delete(schemaId);
        }
      })();
      inFlightCompilations.set(schemaId, promise);
    }

    validate = await promise;
  }

  const valid = !!validate(data);
  return { valid: valid, errors: validate.errors?.slice() };
}
