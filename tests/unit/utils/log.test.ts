import { pinoHttp } from 'pino-http';

import { getLogger } from '../../../src/utils/log.ts';

import type { Request, Response } from 'express';
import type { Options } from 'pino-http';

// Mocks must be hoisted or defined before imports
const { childMock, pinoInstanceMock } = vi.hoisted(() => {
  const child = vi.fn();
  const info = vi.fn();
  const instance = { child, info, level: 'info' };
  // Ensure child returns a logger instance to prevent errors in the module under test
  child.mockReturnValue(instance);
  return { childMock: child, infoMock: info, pinoInstanceMock: instance };
});

vi.mock('pino', () => ({
  default: vi.fn(() => pinoInstanceMock)
}));

vi.mock('pino-http', () => ({
  pinoHttp: vi.fn()
}));

beforeEach(() => {
  // Restore default behavior cleared by mockReset: true in vitest config
  childMock.mockReturnValue(pinoInstanceMock);
});

describe('getLogger', () => {
  it('should create a child logger with the correct module name', () => {
    const logger = getLogger('/path/to/test-module.ts');

    expect(childMock).toHaveBeenCalledWith({ module: 'test-module' });
    expect(logger).toBe(pinoInstanceMock);
  });
});

describe('httpLogger', () => {
  // Retrieve the options passed to pinoHttp when the module was loaded
  const options = (vi.mocked(pinoHttp).mock.calls[0]?.[0] ?? {}) as Options;

  it('should initialize pinoHttp with options', () => {
    expect(options).toBeDefined();
    expect(options.logger).toBeDefined();
  });

  describe('customLogLevel', () => {
    const customLogLevel = options.customLogLevel!;

    it('should return "debug" for health check user agents', () => {
      const req = {
        get: (header: string) => (header === 'user-agent' ? 'kube-probe/1.2' : '')
      } as Request;
      const res = { statusCode: 200 } as Response;

      expect(customLogLevel(req, res, undefined)).toBe('debug');
    });

    it('should return "error" for status codes >= 500', () => {
      const req = { get: () => 'Mozilla/5.0' } as unknown as Request;
      const res = { statusCode: 500 } as Response;

      expect(customLogLevel(req, res, undefined)).toBe('error');
    });

    it('should return "error" if an error is present', () => {
      const req = { get: () => 'Mozilla/5.0' } as unknown as Request;
      const res = { statusCode: 200 } as Response;
      const err = new Error('Test error');

      expect(customLogLevel(req, res, err)).toBe('error');
    });

    it('should return "warn" for status codes >= 400 and < 500', () => {
      const req = { get: () => 'Mozilla/5.0' } as unknown as Request;
      const res = { statusCode: 404 } as Response;

      expect(customLogLevel(req, res, undefined)).toBe('warn');
    });

    it('should return "info" for success status codes', () => {
      const req = { get: () => 'Mozilla/5.0' } as unknown as Request;
      const res = { statusCode: 200 } as Response;

      expect(customLogLevel(req, res, undefined)).toBe('info');
    });
  });

  describe('serializers', () => {
    it('should serialize request correctly', () => {
      const req = {
        method: 'GET',
        url: '/test',
        params: { id: '1' },
        query: { q: 'search' },
        headers: { 'user-agent': 'TestAgent' }
      } as unknown as Request;

      const reqSerializer = options.serializers?.req as (req: Request) => Record<string, unknown>;
      const serialized = reqSerializer(req);

      expect(serialized).toEqual({
        method: 'GET',
        params: { id: '1' },
        query: { q: 'search' },
        url: '/test',
        userAgent: 'TestAgent'
      });
    });

    it('should serialize request without params or query if empty', () => {
      const req = {
        method: 'POST',
        url: '/submit',
        params: {},
        query: {},
        headers: {}
      } as unknown as Request;

      const reqSerializer = options.serializers?.req as (req: Request) => Record<string, unknown>;
      const serialized = reqSerializer(req);

      expect(serialized).toEqual({
        method: 'POST',
        params: undefined,
        query: undefined,
        url: '/submit',
        userAgent: undefined
      });
    });

    it('should serialize response correctly', () => {
      const res = { statusCode: 201 } as unknown as Response;
      const resSerializer = options.serializers?.res as (res: Response) => Record<string, unknown>;
      const serialized = resSerializer(res);

      expect(serialized).toEqual({ statusCode: 201 });
    });

    it('should serialize error correctly', () => {
      const err = new Error('Something went wrong');
      const errSerializer = options.serializers?.err as (err: Error) => Record<string, unknown>;
      const serialized = errSerializer(err);

      // In test env, LOG_LEVEL defaults to 'silent' (via ternary) unless overridden,
      // but stack serialization logic depends on APP_LOGLEVEL.
      // The mocked module code executes with process.env at import time.
      expect(serialized).toEqual({
        type: 'Error',
        message: 'Something went wrong',
        stack: undefined // APP_LOGLEVEL is likely not 'trace' in test defaults
      });
    });
  });

  describe('customProps', () => {
    it('should extract claims if present', () => {
      const req = { httpVersion: '1.1', ip: '127.0.0.1', path: '/api' } as Request;
      const res = {
        locals: { claims: { azp: 'client-id', sub: 'user-id' } }
      } as unknown as Response;

      const customProps = options.customProps!;
      const props = customProps(req, res);

      expect(props).toEqual({
        claims: { azp: 'client-id', sub: 'user-id' },
        httpVersion: '1.1',
        ip: '127.0.0.1',
        path: '/api'
      });
    });

    it('should handle missing claims gracefully', () => {
      const req = { httpVersion: '1.1', ip: '127.0.0.1', path: '/api' } as Request;
      const res = { locals: {} } as unknown as Response;

      const customProps = options.customProps!;
      const props = customProps(req, res);

      expect(props).toEqual({
        claims: undefined,
        httpVersion: '1.1',
        ip: '127.0.0.1',
        path: '/api'
      });
    });
  });

  describe('messages', () => {
    it('should format custom error message', () => {
      const req = { method: 'GET', url: '/error' } as Request;
      const res = { statusCode: 500 } as Response;
      const err = new Error('Fail');

      const customErrorMessage = options.customErrorMessage!;
      expect(customErrorMessage(req, res, err)).toBe('GET /error 500 - Fail');
    });

    it('should format custom success message', () => {
      const req = { method: 'POST', url: '/success' } as Request;
      const res = { statusCode: 200 } as Response;

      const customSuccessMessage = options.customSuccessMessage!;
      expect(customSuccessMessage(req, res, 150)).toBe('POST /success 200 150ms');
    });
  });
});
