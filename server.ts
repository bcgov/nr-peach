#!/usr/bin/env node

import { config } from 'dotenv';
import http from 'node:http';

import { app, state } from './src/app.ts';
import { getLogger } from './src/utils/log.ts';

// Load environment variables, prioritizing .env over .env.default
config({ path: ['.env', '.env.default'] });
const log = getLogger(import.meta.filename);
const port = normalizePort(process.env.APP_PORT ?? '3000');

// Prevent unhandled errors from crashing application
process.on('unhandledRejection', (err: Error): void => {
  if (err?.stack) log.error(err);
});

// Graceful shutdown support
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('SIGUSR1', shutdown);
process.on('SIGUSR2', shutdown);
process.on('exit', (): void => {
  log.info('Exiting...');
});

/**
 * Create HTTP server and listen on provided port, on all network interfaces.
 */
const server = http.createServer(app); // eslint-disable-line @typescript-eslint/no-misused-promises
server.listen(port, (): void => {
  log.info(`Server running on http://localhost:${port}`);
});
server.on('error', onError);

/**
 * Normalize a port into a number, string, or false.
 * @param val Port string value
 * @returns A number, string or false
 */
function normalizePort(val: string): string | number | boolean {
  const port = parseInt(val, 10);

  if (isNaN(port)) return val; // named pipe
  if (port >= 0) return port; // port number

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 * @param error Error event
 * @param error.syscall System call
 * @param error.code Error code
 */
function onError(error: { syscall?: string; code: string }): void {
  // eslint-disable-next-line @typescript-eslint/only-throw-error
  if (error.syscall !== 'listen') throw error;

  // Handle specific listen errors with friendly messages
  const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;
  switch (error.code) {
    case 'EACCES':
      log.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      log.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error; // eslint-disable-line @typescript-eslint/only-throw-error
  }
}

/**
 * Shuts down this application.
 */
function shutdown(): void {
  log.info('Received kill signal. Shutting down...');
  state.shutdown = true;
  cleanup();
  // TODO: See if we want to wait 3 seconds before starting cleanup?
  // if (!state.shutdown) setTimeout(cleanup, 3000);
}

/**
 * Cleans up connections in this application.
 */
function cleanup(): void {
  log.info('Service no longer accepting traffic');
  process.exit();
}
