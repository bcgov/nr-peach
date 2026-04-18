import { Problem } from '#src/utils/index';
import { validateIntegrity, validateSchema } from '#src/validators/index';

import type { ErrorObject, SchemaObject } from 'ajv';
import type { RequestHandler } from 'express';
import type { IntegrityDictionary, IntegrityError, RequestIntegrityOptions, RequestSchemaOptions } from '#types';

/**
 * Middleware ensuring body content type is JSON
 * @returns An Express `RequestHandler` that rejects non-JSON content types.
 */
export function isJsonBody(): RequestHandler {
  return function (req, res, next): void {
    return req.is('application/json') ? next() : new Problem(400, { detail: 'Invalid content type' }).send(req, res);
  };
}

/**
 * Validates the data integrity of the incoming request by checking its body, headers, params, and query.
 * @param opts - An object containing validation schemas for `body`, `query`, `params`, or `headers`.
 * @returns An Express `RequestHandler` that validates the request integrity.
 */
export function validateRequestIntegrity(opts: RequestIntegrityOptions = {}): RequestHandler {
  return function (req, res, next): void {
    const reqErrors: Partial<Record<keyof RequestIntegrityOptions, IntegrityError[]>> = {};

    for (const [key, value] of Object.entries(opts) as [keyof RequestIntegrityOptions, keyof IntegrityDictionary][]) {
      if (value) {
        const { valid, errors } = validateIntegrity(value, req[key] as IntegrityDictionary[keyof IntegrityDictionary]);
        if (!valid && errors) reqErrors[key] = errors;
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
 * Validates the incoming request by checking its body, headers, params, and query.
 * @param opts - An object containing validation schemas for `body`, `query`, `params`, or `headers`.
 * @returns An Express `RequestHandler` that validates the request.
 */
export function validateRequestSchema(opts: RequestSchemaOptions = {}): RequestHandler {
  return async function (req, res, next): Promise<void> {
    const reqErrors: Partial<Record<keyof RequestSchemaOptions, ErrorObject[]>> = {};

    for (const [key, value] of Object.entries(opts) as [keyof RequestSchemaOptions, SchemaObject][]) {
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
