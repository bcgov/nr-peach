import { pies, getPiesSchemaUri } from './index.ts';
import { Problem } from '../utils/index.ts';
import { validateSchema } from '../validators/index.ts';

import type { NextFunction, Request, Response } from 'express';

/**
 * Middleware function to validate the request body against a schema for process events.
 * @param req - The Express request object.
 * @param res - The Express response object.
 * @param next - The next middleware function in the stack.
 */
export async function putProcessEventsValidator(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // TODO: Figure out middleware pattern to handle header, query, param, and body
  const schemaUri = getPiesSchemaUri(pies.spec.message.processEventSet);
  const { valid, errors } = await validateSchema(schemaUri, req.body);
  if (!valid) {
    new Problem(422, { detail: 'Invalid request body' }, { errors }).send(
      req,
      res
    );
    return;
  }
  next();
}
