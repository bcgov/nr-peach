import { config } from 'dotenv';
import { logger } from 'express-winston';
// import { jwt } = from 'jsonwebtoken'; // TODO: Revisit when we look at authentication
import { parse } from 'node:path';
import { createLogger, format, transports } from 'winston';
import Transport from 'winston-transport';

import type { Request, RequestHandler, Response } from 'express';
import type { LogEntry, Logger } from 'winston';
import type { TransportStreamOptions } from 'winston-transport';

// Load environment variables, prioritizing .env over .env.default
config({ path: ['.env', '.env.default'], quiet: true });

const DEFAULT_LOG_LEVEL = 'http';

/**
 * Class representing a winston transport writing to null
 * Typically only used in test environments
 */
export class NullTransport extends Transport {
  /**
   * Constructor
   * @param opts Winston Transport options
   */
  constructor(opts: TransportStreamOptions) {
    super(opts);
  }

  /**
   * The transport logger
   * @param _info Object to log
   * @param callback Callback function
   */
  log(_info: LogEntry, callback: () => void) {
    callback();
  }
}

/**
 * Main Winston Logger
 * @returns {object} Winston Logger
 */
const log = createLogger({
  exitOnError: false,
  format: format.combine(
    format.errors({ stack: true }), // Force errors to show stacktrace
    format.timestamp(), // Add ISO timestamp to each entry
    process.env.NODE_ENV === 'production' ? format.json() : format.prettyPrint({ colorize: true })
  ),
  level: process.env.APP_LOGLEVEL ?? DEFAULT_LOG_LEVEL
});

if (process.env.NODE_ENV !== 'test') {
  log.add(new transports.Console({ handleExceptions: true }));
} else {
  log.add(new NullTransport({}));
}

if (process.env.APP_LOGFILE) {
  log.add(
    new transports.File({
      filename: process.env.APP_LOGFILE,
      handleExceptions: true
    })
  );
}

log.info('Logger initialized', { loglevel: log.level });

/**
 * Returns a Winston Logger or Child Winston Logger
 * @param filename Optional module filename path to annotate logs with
 * @returns A child logger with appropriate metadata if `filename` is defined.
 * Otherwise returns a standard logger.
 */
export function getLogger(filename?: string): Logger {
  return filename ? log.child({ component: parse(filename).name }) : log;
}
/**
 * Parses express information to insert into log output
 * @param req Express request object
 * @param res Express response object
 * @returns Dynamic meta object
 */
export function dynamicMeta(req: Request, res: Response & { responseTime?: number }): Record<string, unknown> {
  return {
    contentLength: res.get('content-length'),
    httpVersion: req.httpVersion,
    ip: req.ip,
    method: req.method,
    path: req.path,
    query: Object.keys(req.query).length ? req.query : undefined,
    responseTime: res.responseTime,
    statusCode: res.statusCode,
    userAgent: req.get('user-agent')
  };
}

/**
 * Returns an express-winston middleware function for http logging
 * @returns An express-winston middleware function
 */
export const httpLogger: RequestHandler = logger({
  colorize: false,
  dynamicMeta: dynamicMeta,
  expressFormat: true, // Use express style message strings
  level: 'http',
  meta: true, // Must be true for dynamicMeta to execute
  metaField: null, // Set to null for all attributes to be at top level object
  requestWhitelist: [], // Suppress default value output
  responseWhitelist: [], // Suppress default value output
  // Skip logging kube-probe requests
  skip: (req) => !!req.get('user-agent')?.includes('kube-probe'),
  winstonInstance: log
});
