import { Problem } from '../utils/index.ts';
import { validateIntegrity, validateSchema } from '../validators/index.ts';

import type { AnySchemaObject, ErrorObject } from 'ajv/dist/core.js';
import type { RequestHandler } from 'express';
import type { IncomingHttpHeaders } from 'node:http';
import type { IntegrityDictionary, IntegrityResult } from '../validators/integrity.js';

// TODO: Move to types/validator.d.ts
export type RequestIntegrityOptions = Partial<
  Record<'body' | 'headers' | 'params' | 'query', keyof IntegrityDictionary>
>;
export type RequestSchemaOptions = Partial<{
  body: AnySchemaObject | string;
  headers: AnySchemaObject & IncomingHttpHeaders;
  params: AnySchemaObject;
  query: AnySchemaObject;
}>;

/**
 * Validates the data integrity of the incoming request by checking its body, headers, params, and query.
 * @param opts - An object containing validation schemas for `body`, `query`, `params`, or `headers`.
 * @returns An Express `RequestHandler` that validates the request integrity.
 */
export function validateRequestIntegrity(opts: RequestIntegrityOptions = {}): RequestHandler {
  return function (req, res, next): void {
    const reqErrors: Partial<Record<keyof RequestIntegrityOptions, IntegrityResult>> = {};

    for (const [key, value] of Object.entries(opts) as [keyof RequestIntegrityOptions, keyof IntegrityDictionary][]) {
      if (value) {
        const { valid, errors } = validateIntegrity(value, req[key] as IntegrityDictionary[keyof IntegrityDictionary]);
        if (!valid && errors) reqErrors[key] = { valid, errors };
      }
    }

    if (Object.keys(reqErrors).length) {
      new Problem(
        422,
        {
          detail: `Request integrity validation failed in ${Object.keys(reqErrors).join(', ')}`
        },
        { errors: reqErrors }
      ).send(req, res);
    } else next();
  };
}

/**
 * Validates the incoming rest by checking its body, headers, params, and query.
 * @param opts An object containing validation schemas for `body`, `query`, `params`, or `headers`.
 * @returns An Express `RequestHandler` that validates the request.
 */
export function validateRequestSchema(opts: RequestSchemaOptions = {}): RequestHandler {
  return async function (req, res, next): Promise<void> {
    const reqErrors: Partial<Record<keyof RequestSchemaOptions, ErrorObject[]>> = {};

    for (const [key, value] of Object.entries(opts) as [keyof RequestSchemaOptions, AnySchemaObject][]) {
      if (value) {
        const { valid, errors } = await validateSchema(value, req[key]);
        if (!valid && errors) reqErrors[key] = errors;
      }
    }

    if (Object.keys(reqErrors).length) {
      new Problem(
        422,
        {
          detail: `Request schema validation failed in ${Object.keys(reqErrors).join(', ')}`
        },
        { errors: reqErrors }
      ).send(req, res);
    } else next();
  };
}
