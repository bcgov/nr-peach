#!/usr/bin/env node

import { createServer } from 'node:http';

import './src/env.ts';
import { app } from './src/app.ts';
import { state } from './src/state.ts';
import {
  checkDatabaseHealth,
  checkDatabaseMigrations,
  runMigrations,
  runSeeds,
  shutdownDatabase
} from './src/db/index.ts';
import { getJwksClient } from './src/middlewares/helpers/oauth.ts';
import { getLogger } from './src/utils/index.ts';

const automigrate = process.env.APP_AUTOMIGRATE?.toLowerCase() === 'true';
const log = getLogger(import.meta.filename);
const port = normalizePort(process.env.APP_PORT ?? '3000');
const server = createServer(app);

// Prevent unhandled rejections from crashing application
process.on('unhandledRejection', (err: Error): void => {
  if (err?.stack) log.error(err);
});

// Graceful shutdown support
const signals: readonly NodeJS.Signals[] = ['SIGHUP', 'SIGINT', 'SIGTERM', 'SIGUSR1', 'SIGUSR2'];
signals.forEach((signal) => process.once(signal, () => shutdown(signal)));

// Perform preliminary system and database checks
try {
  await validateConfig();
  await startup();
} catch (error) {
  log.error(`Startup failure: ${error instanceof Error ? error.message : String(error)}`);
  shutdown('SIGABRT');
}

// Create HTTP server and listen on provided port, on all network interfaces.
server.listen(port, () => {
  const url = `http://localhost:${port}`;
  const modeText = {
    none: ' in no authentication mode',
    authn: ' in authentication only mode',
    authz: ' in scoped authorization mode'
  }[state.authMode!];
  if (state.ready) log.info(`Server listening at ${url}${modeText}`, { authMode: state.authMode, url: url });
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
function onError(error: Error & { syscall?: string; code: string }): void {
  if (error.syscall !== 'listen') throw error;

  // Handle specific listen errors with friendly messages
  const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;
  switch (error.code) {
    case 'EACCES':
      log.error(`${bind} requires elevated privileges`);
      shutdown('SIGABRT');
      break;
    case 'EADDRINUSE':
      log.error(`${bind} is already in use`);
      shutdown('SIGABRT');
      break;
    default:
      throw error;
  }
}

/**
 * Gracefully shuts down the server and exits the process.
 * @see https://nodejs.org/api/http.html#servercloseallconnections
 * @param signal - Optional termination signal (e.g., 'SIGINT', 'SIGTERM').
 */
function cleanup(signal?: NodeJS.Signals): void {
  state.ready = false;
  log.debug('Stop accepting new connections...');
  server.close(() => {
    log.debug('Shutting down database connections...');
    void shutdownDatabase(() => {
      log.debug('Closing all server connections...');
      server.closeAllConnections();
      log.info('Server shut down');
      if (signal) process.kill(process.pid, signal);
      else process.exit();
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
  cleanup(signal);
}

/**
 * Initializes the server by checking database health and migration maintenance
 * @throws {Error} If database health or migrations fail.
 */
async function startup(): Promise<void> {
  if (state.authMode) {
    if (!(await checkDatabaseHealth())) throw new Error('Database health check failed');
    if (!(await checkDatabaseMigrations())) {
      if (automigrate) {
        if (!(await runMigrations())) throw new Error('Database auto-migrations failed');
        else if (!(await runSeeds())) throw new Error('Database auto-seeding failed');
      } else throw new Error('Database migration check failed');
    }
    state.ready = true;
  }
}

/**
 * Validates the configuration settings and sets the server's auth mode
 * @throws {Error} If configuration settings are invalid or missing.
 */
async function validateConfig(): Promise<void> {
  const authMode = process.env.AUTH_MODE?.trim().toLowerCase();
  if (!authMode) throw new Error('AUTH_MODE must be explicitly set');

  if (authMode !== 'authn' && authMode !== 'authz' && authMode !== 'none') {
    throw new Error(`Invalid AUTH_MODE value: '${authMode}'`);
  }

  state.authMode = authMode;
  if (authMode !== 'none' && !process.env.AUTH_ISSUER) {
    throw new Error(`AUTH_MODE=${authMode} requires AUTH_ISSUER to be set`);
  }

  await getJwksClient();
}
