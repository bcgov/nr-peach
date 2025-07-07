#!/usr/bin/env node --experimental-transform-types

import { config } from 'dotenv';
import http from 'node:http';
import { isMainThread } from 'node:worker_threads';

import { app } from './src/app.ts';
import { state } from './src/state.ts';
import { checkDatabaseHealth, checkDatabaseMigrations, shutdownDatabase } from './src/db/index.ts';
import { getLogger } from './src/utils/index.ts';

// Load environment variables, prioritizing .env over .env.default
config({ path: ['.env', '.env.default'], quiet: true });
const log = getLogger(import.meta.filename);
const port = normalizePort(process.env.APP_PORT ?? '3000');

// Create HTTP server and listen on provided port, on all network interfaces.
// eslint-disable-next-line @typescript-eslint/no-misused-promises
const server = http.createServer(app);
server.listen(port, () => {
  log.info(`Server running on http://localhost:${port}`);
});
server.on('error', onError);

if (isMainThread) {
  // Prevent unhandled rejections from crashing application
  process.on('unhandledRejection', (err: Error): void => {
    if (err?.stack) log.error(err);
  });

  // Graceful shutdown support
  ['SIGTERM', 'SIGINT', 'SIGUSR1', 'SIGUSR2'].forEach((signal) => {
    process.on(signal, () => shutdown(signal as NodeJS.Signals));
  });
  process.on('exit', () => log.info('Exiting...'));
}

// Perform preliminary database checks
void startup();

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
 * Gracefully shuts down the server and exits the process.
 * @see https://nodejs.org/api/http.html#servercloseallconnections
 */
function cleanup(): void {
  state.ready = false;
  log.debug('Stop accepting new connections...');
  server.close(() => {
    log.debug('Shutting down database connections...');
    void shutdownDatabase(() => {
      log.debug('Closing all server connections...');
      server.closeAllConnections();
      log.info('Server shut down');
      process.exit(0);
    });
  });
}

/**
 * Handles application shutdown on termination signals.
 * @param signal - Received termination signal (e.g., 'SIGINT', 'SIGTERM').
 */
function shutdown(signal: NodeJS.Signals): void {
  state.shutdown = true;
  log.info(`Received ${signal} signal. Shutting down...`);
  cleanup();
}

/**
 * Initializes the server by performing database health and migration checks.
 */
async function startup(): Promise<void> {
  try {
    if (!(await checkDatabaseHealth())) throw new Error('Health check failed');
    if (!(await checkDatabaseMigrations())) throw new Error('Migration check failed');
    state.ready = true;
  } catch (error) {
    log.error('Error during startup:', error);
    shutdown('SIGABRT');
  }
}
