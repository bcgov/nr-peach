import { Problem } from '../utils/index.ts';
import { validateSchema } from '../validators/index.ts';

import type { AnySchemaObject } from 'ajv';
import type { ErrorObject } from 'ajv/dist/core.js';
import type { Request, RequestHandler } from 'express';
import type { IncomingHttpHeaders } from 'node:http';

export interface RequestValidationOptions {
  body?: string | AnySchemaObject;
  headers?: IncomingHttpHeaders;
  params?: AnySchemaObject;
  query?: AnySchemaObject;
}

/**
 * Validates the incoming request by checking its body, headers, params, and query.
 * @param opts An object containing validation schemas for `body`, `query`, `params`, or `headers`.
 * @returns An Express `RequestHandler` that validates the request.
 */
export function validateRequest(
  opts: RequestValidationOptions = {}
): RequestHandler {
  return async function (req, res, next): Promise<void> {
    const reqErrors: Partial<
      Record<keyof RequestValidationOptions, ErrorObject[]>
    > = {};

    for (const [key, value] of Object.entries(opts) as [
      keyof RequestValidationOptions,
      string | AnySchemaObject
    ][]) {
      if (value) {
        const { valid, errors } = await validateSchema(
          value,
          req[key as keyof Request]
        );
        if (!valid && errors) reqErrors[key] = errors;
      }
    }

    if (Object.keys(reqErrors).length) {
      new Problem(
        422,
        {
          detail: `Request validation failed in ${Object.keys(reqErrors).join(', ')}`
        },
        { errors: reqErrors }
      ).send(req, res);
    } else next();
  };
}
