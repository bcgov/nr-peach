import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { randomBytes } from 'node:crypto';
import favicon from 'serve-favicon';

import router from './routes/index.ts';

import { state } from './state.ts';
import { getLogger, httpLogger, Problem } from './utils/index.ts';

import type { NextFunction, Request, Response } from 'express';

const log = getLogger(import.meta.filename);

export const app = express();
app.disable('x-powered-by');
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded());
app.use(favicon('src/public/favicon.ico'));
app.use((_req: Request, res: Response, next: NextFunction): void => {
  res.locals.cspNonce = randomBytes(32).toString('hex');
  helmet();
  next();
});

// Skip if running tests
if (process.env.NODE_ENV !== 'test') app.use(httpLogger);

// Block requests until service is ready
app.use((req: Request, res: Response, next: NextFunction): void => {
  if (state.shutdown) {
    new Problem(503, { detail: 'Server is shutting down' }).send(req, res);
  } else if (!state.ready) {
    new Problem(503, { detail: 'Server is not ready' }).send(req, res);
  } else {
    next();
  }
});

// Disallow all scraping
app.get('/robots.txt', (_req: Request, res: Response): void => {
  res.type('text/plain');
  res.send('User-agent: *\nDisallow: /');
});

// Root level router
app.use(router);

// Handle 404
app.use((req: Request, res: Response): void => {
  new Problem(404).send(req, res);
});

/**
 * Handles errors that occur during the request-response lifecycle.
 * Logs the error stack if available and sends an appropriate response
 * to the client based on the type of error.
 * @param err - The error object that was thrown.
 * @param req - The HTTP request object.
 * @param res - The HTTP response object.
 * @param _next - The next middleware function in the stack (unused).
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction // eslint-disable-line @typescript-eslint/no-unused-vars
): void {
  if (err.stack) log.error(err);

  if (err instanceof Problem) {
    err.send(req, res);
  } else {
    new Problem(500, { detail: err.message ?? err.toString() }).send(req, res);
  }
}

// Handle 500
app.use(errorHandler);
