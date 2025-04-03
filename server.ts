#!/usr/bin/env node

import { config } from 'dotenv';
import express from 'express';
import http from 'http';

// import getLogger from '../src/components/log';

config(); // Load environment variables
const app = express();
const port = normalizePort(process.env.PORT || '3000');

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

// const log = getLogger(module.filename);
const log = console; // TODO Swap to getLogger

/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val: string): string | number | boolean {
  const port = parseInt(val, 10);

  if (isNaN(port)) return val; // named pipe
  if (port >= 0) return port; // port number

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */
function onError(error: { syscall: string; code: string }): void {
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
      throw error;
  }
}

/**
 * Create HTTP server and listen on provided port, on all network interfaces.
 */
const server = http.createServer(app);
server.listen(port, (): void => {
  log.info(`Server running on http://localhost:${port}`)
});
server.on('error', onError);
