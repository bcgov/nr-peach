import { createLogger, format, transports } from 'winston';

import { dynamicMeta, getLogger, httpLogger, NullTransport } from '../../src/utils/log.ts';

import type { Request, Response } from 'express';

describe('Logger', () => {
  describe('dynamicMeta', () => {
    it('should return the correct metadata for a request and response', () => {
      const req = {
        httpVersion: '1.1',
        ip: '127.0.0.1',
        method: 'GET',
        path: '/test',
        query: { key: 'value' },
        get: vi.fn((header) => {
          if (header === 'user-agent') return 'test-agent';
          return undefined;
        })
      } as unknown as Request;

      const res = {
        get: vi.fn((header) => {
          if (header === 'content-length') return '123';
          return undefined;
        }),
        responseTime: 200,
        statusCode: 200
      } as unknown as Response & { responseTime?: number };

      const meta = dynamicMeta(req, res);

      expect(meta).toEqual({
        contentLength: '123',
        httpVersion: '1.1',
        ip: '127.0.0.1',
        method: 'GET',
        path: '/test',
        query: { key: 'value' },
        responseTime: 200,
        statusCode: 200,
        userAgent: 'test-agent'
      });
    });

    it('should handle missing query and responseTime gracefully', () => {
      const req = {
        httpVersion: '1.1',
        ip: '127.0.0.1',
        method: 'POST',
        path: '/test',
        query: {},
        get: vi.fn((header) => {
          if (header === 'user-agent') return 'test-agent';
          return undefined;
        })
      } as unknown as Request;

      const res = {
        get: vi.fn((header) => {
          if (header === 'content-length') return '456';
          return undefined;
        }),
        statusCode: 404
      } as unknown as Response & { responseTime?: number };

      const meta = dynamicMeta(req, res);

      expect(meta).toEqual({
        contentLength: '456',
        httpVersion: '1.1',
        ip: '127.0.0.1',
        method: 'POST',
        path: '/test',
        query: undefined,
        responseTime: undefined,
        statusCode: 404,
        userAgent: 'test-agent'
      });
    });

    it('should return undefined for userAgent if not provided', () => {
      const req = {
        httpVersion: '1.1',
        ip: '127.0.0.1',
        method: 'PUT',
        path: '/test',
        query: {},
        get: vi.fn(() => undefined)
      } as unknown as Request;

      const res = {
        get: vi.fn(() => undefined),
        statusCode: 500
      } as unknown as Response & { responseTime?: number };

      const meta = dynamicMeta(req, res);

      expect(meta).toEqual({
        contentLength: undefined,
        httpVersion: '1.1',
        ip: '127.0.0.1',
        method: 'PUT',
        path: '/test',
        query: undefined,
        responseTime: undefined,
        statusCode: 500,
        userAgent: undefined
      });
    });
  });
  describe('getLogger', () => {
    it('should return a logger instance without a filename', () => {
      const logger = getLogger(undefined);
      expect(logger).toHaveProperty('info');
      expect(logger).toHaveProperty('error');
    });

    it('should return a child logger with a filename', () => {
      const logger = getLogger('/path/to/file.ts');
      expect(logger).toHaveProperty('info');
      expect(logger).toHaveProperty('error');
    });
  });

  describe('httpLogger', () => {
    it('should be defined and configured correctly', () => {
      expect(httpLogger).toBeDefined();
    });
  });

  describe('NullTransport', () => {
    it('should call the callback without logging', () => {
      const callback = vi.fn();
      const nullTransport = new NullTransport({});
      nullTransport.log(
        {
          level: '',
          message: ''
        },
        callback
      );
      expect(callback).toHaveBeenCalledOnce();
    });
  });

  describe('Logger Config', () => {
    let logger: ReturnType<typeof createLogger>;

    beforeEach(() => {
      logger = createLogger({
        exitOnError: false,
        format: format.combine(format.errors({ stack: true }), format.timestamp(), format.simple()),
        level: 'http'
      });
    });

    it('should include timestamp and errors in the format', () => {
      const formats = logger.format;
      expect(formats).toBeDefined();
    });

    it('should add Console transport in non-test environments', () => {
      if (process.env.NODE_ENV !== 'test') {
        logger.add(new transports.Console({ handleExceptions: true }));
        expect(logger.transports.some((t) => t instanceof transports.Console)).toBe(true);
      }
    });

    it('should add NullTransport in test environments', () => {
      if (process.env.NODE_ENV === 'test') {
        logger.add(new NullTransport({}));
        expect(logger.transports.some((t) => t instanceof NullTransport)).toBe(true);
      }
    });
  });
});
