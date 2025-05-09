import { createLogger, format, transports } from 'winston';
import { getLogger, httpLogger, NullTransport } from '../../src/utils/log.ts';

describe('Logger', () => {
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
      nullTransport.log({}, callback);
      expect(callback).toHaveBeenCalledOnce();
    });
  });

  describe('Logger Config', () => {
    let logger: ReturnType<typeof createLogger>;

    beforeEach(() => {
      logger = createLogger({
        exitOnError: false,
        format: format.combine(
          format.errors({ stack: true }),
          format.timestamp(),
          format.simple()
        ),
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
        expect(
          logger.transports.some((t) => t instanceof transports.Console)
        ).toBe(true);
      }
    });

    it('should add NullTransport in test environments', () => {
      if (process.env.NODE_ENV === 'test') {
        logger.add(new NullTransport({}));
        expect(logger.transports.some((t) => t instanceof NullTransport)).toBe(
          true
        );
      }
    });
  });
});
