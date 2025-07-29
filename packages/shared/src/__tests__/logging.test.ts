// Tests for logging utilities
// Testes para utilitários de logging

import {
  Logger,
  LogLevel,
  LOG_LEVEL_NAMES,
  createLogger,
  createDockerLogger,
  logger
} from '../logging/logger';

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

describe('Logging', () => {
  beforeEach(() => {
    console.log = jest.fn();
    console.error = jest.fn();
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  describe('LogLevel', () => {
    test('should have correct log level values', () => {
      expect(LogLevel.ERROR).toBe(0);
      expect(LogLevel.WARN).toBe(1);
      expect(LogLevel.INFO).toBe(2);
      expect(LogLevel.DEBUG).toBe(3);
      expect(LogLevel.TRACE).toBe(4);
    });

    test('should have correct log level names', () => {
      expect(LOG_LEVEL_NAMES[LogLevel.ERROR]).toBe('ERROR');
      expect(LOG_LEVEL_NAMES[LogLevel.WARN]).toBe('WARN');
      expect(LOG_LEVEL_NAMES[LogLevel.INFO]).toBe('INFO');
      expect(LOG_LEVEL_NAMES[LogLevel.DEBUG]).toBe('DEBUG');
      expect(LOG_LEVEL_NAMES[LogLevel.TRACE]).toBe('TRACE');
    });
  });

  describe('Logger', () => {
    test('should create logger with default config', () => {
      const testLogger = new Logger();
      expect(testLogger.getLevel()).toBe(LogLevel.INFO);
      expect(testLogger.isLevelEnabled(LogLevel.INFO)).toBe(true);
      expect(testLogger.isLevelEnabled(LogLevel.DEBUG)).toBe(false);
    });

    test('should create logger with custom config', () => {
      const testLogger = new Logger({
        level: LogLevel.DEBUG,
        service: 'test-service',
        format: 'text',
        enableColors: false
      });

      expect(testLogger.getLevel()).toBe(LogLevel.DEBUG);
      expect(testLogger.isLevelEnabled(LogLevel.DEBUG)).toBe(true);
      expect(testLogger.isLevelEnabled(LogLevel.TRACE)).toBe(false);
    });

    test('should log messages at different levels', () => {
      const testLogger = new Logger({
        level: LogLevel.DEBUG,
        outputs: [{ type: 'console' }]
      });

      testLogger.error('Error message');
      testLogger.warn('Warning message');
      testLogger.info('Info message');
      testLogger.debug('Debug message');

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Error message')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Warning message')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Info message')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Debug message')
      );
    });

    test('should respect log level filtering', () => {
      const testLogger = new Logger({
        level: LogLevel.WARN,
        outputs: [{ type: 'console' }]
      });

      testLogger.error('Error message');
      testLogger.warn('Warning message');
      testLogger.info('Info message');
      testLogger.debug('Debug message');

      expect(console.error).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveBeenCalledTimes(1);
    });

    test('should include metadata in logs', () => {
      const testLogger = new Logger({
        level: LogLevel.INFO,
        format: 'json',
        outputs: [{ type: 'console' }]
      });

      const metadata = {
        userId: 'user123',
        requestId: 'req456',
        custom: 'value'
      };

      testLogger.info('Test message', metadata);

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('"userId":"user123"')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('"requestId":"req456"')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('"custom":"value"')
      );
    });

    test('should log HTTP requests', () => {
      const testLogger = new Logger({
        level: LogLevel.INFO,
        outputs: [{ type: 'console' }]
      });

      const mockReq = {
        method: 'GET',
        path: '/api/test',
        id: 'req123',
        user: { id: 'user456' },
        get: jest.fn().mockReturnValue('Mozilla/5.0'),
        ip: '127.0.0.1',
        query: { page: 1 }
      };

      const mockRes = {
        statusCode: 200,
        get: jest.fn().mockReturnValue('1024')
      };

      testLogger.logRequest(mockReq, mockRes, 150);

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('GET /api/test 200 - 150ms')
      );
    });

    test('should log database queries', () => {
      const testLogger = new Logger({
        level: LogLevel.DEBUG,
        outputs: [{ type: 'console' }]
      });

      testLogger.logQuery('SELECT * FROM users WHERE id = ?', 25, { table: 'users' });

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Database query executed')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM users WHERE id = ?')
      );
    });

    test('should log external API calls', () => {
      const testLogger = new Logger({
        level: LogLevel.INFO,
        outputs: [{ type: 'console' }]
      });

      testLogger.logExternalCall('payment-service', 'POST', '/api/payments', 201, 500);

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('External API call to payment-service')
      );
    });

    test('should create child logger with context', () => {
      const testLogger = new Logger({
        level: LogLevel.INFO,
        outputs: [{ type: 'console' }]
      });

      const childLogger = testLogger.child({
        requestId: 'req123',
        userId: 'user456'
      });

      childLogger.info('Child logger message');

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('"requestId":"req123"')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('"userId":"user456"')
      );
    });

    test('should set and get log level', () => {
      const testLogger = new Logger({ level: LogLevel.INFO });

      expect(testLogger.getLevel()).toBe(LogLevel.INFO);

      testLogger.setLevel(LogLevel.DEBUG);
      expect(testLogger.getLevel()).toBe(LogLevel.DEBUG);
      expect(testLogger.isLevelEnabled(LogLevel.DEBUG)).toBe(true);
    });

    test('should handle errors in log outputs gracefully', () => {
      // Create a logger with a mock output that throws an error
      const testLogger = new Logger({
        level: LogLevel.INFO,
        outputs: [{ type: 'console' }]
      });

      // Mock console.log to throw an error
      console.log = jest.fn().mockImplementation(() => {
        throw new Error('Output error');
      });

      // This should not throw an error
      expect(() => {
        testLogger.info('Test message');
      }).not.toThrow();

      expect(console.error).toHaveBeenCalledWith(
        'Error writing to log output:',
        expect.any(Error)
      );
    });
  });

  describe('Logger Factory Functions', () => {
    test('should create logger with createLogger', () => {
      const testLogger = createLogger({
        service: 'test-service',
        level: LogLevel.DEBUG
      });

      expect(testLogger).toBeInstanceOf(Logger);
      expect(testLogger.getLevel()).toBe(LogLevel.DEBUG);
    });

    test('should create Docker logger with createDockerLogger', () => {
      const dockerLogger = createDockerLogger('auth-service');

      expect(dockerLogger).toBeInstanceOf(Logger);
      // Docker logger should use JSON format and no colors
    });

    test('should have default logger instance', () => {
      expect(logger).toBeInstanceOf(Logger);
    });
  });

  describe('Log Entry Structure', () => {
    test('should create proper log entry structure', () => {
      const testLogger = new Logger({
        level: LogLevel.INFO,
        service: 'test-service',
        format: 'json',
        outputs: [{ type: 'console' }]
      });

      testLogger.info('Test message', {
        userId: 'user123',
        requestId: 'req456'
      });

      const logCall = (console.log as jest.Mock).mock.calls[0][0];
      const logEntry = JSON.parse(logCall);

      expect(logEntry).toMatchObject({
        timestamp: expect.any(String),
        level: LogLevel.INFO,
        levelName: 'INFO',
        message: 'Test message',
        service: 'test-service',
        userId: 'user123',
        requestId: 'req456'
      });

      // Validate timestamp format
      expect(new Date(logEntry.timestamp)).toBeInstanceOf(Date);
    });

    test('should include error details in log entry', () => {
      const testLogger = new Logger({
        level: LogLevel.ERROR,
        service: 'test-service',
        format: 'json',
        enableStackTrace: true,
        outputs: [{ type: 'console' }]
      });

      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at test.js:1:1';

      testLogger.error('Error occurred', {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        }
      });

      const logCall = (console.error as jest.Mock).mock.calls[0][0];
      const logEntry = JSON.parse(logCall);

      expect(logEntry.error).toMatchObject({
        name: 'Error',
        message: 'Test error',
        stack: 'Error: Test error\n    at test.js:1:1'
      });
    });
  });

  describe('Text Format Output', () => {
    test('should format text output correctly', () => {
      const testLogger = new Logger({
        level: LogLevel.INFO,
        service: 'test-service',
        format: 'text',
        enableColors: false,
        enableTimestamp: true,
        outputs: [{ type: 'console' }]
      });

      testLogger.info('Test message', { key: 'value' });

      const logCall = (console.log as jest.Mock).mock.calls[0][0];
      
      expect(logCall).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
      expect(logCall).toContain('INFO');
      expect(logCall).toContain('[test-service]');
      expect(logCall).toContain('Test message');
      expect(logCall).toContain('{"key":"value"}');
    });

    test('should handle colors in text format', () => {
      const testLogger = new Logger({
        level: LogLevel.ERROR,
        format: 'text',
        enableColors: true,
        outputs: [{ type: 'console' }]
      });

      testLogger.error('Error message');

      const logCall = (console.error as jest.Mock).mock.calls[0][0];
      
      // Should contain ANSI color codes
      expect(logCall).toContain('\x1b[31m'); // Red color for error
      expect(logCall).toContain('\x1b[0m');  // Reset color
    });
  });

  describe('Multiple Outputs', () => {
    test('should support multiple output types', () => {
      const testLogger = new Logger({
        level: LogLevel.INFO,
        outputs: [
          { type: 'console' },
          { type: 'file', config: { directory: './logs', filename: 'test.log' } }
        ]
      });

      testLogger.info('Test message');

      // Console output should be called
      expect(console.log).toHaveBeenCalled();
    });

    test('should respect different log levels per output', () => {
      const testLogger = new Logger({
        level: LogLevel.DEBUG,
        outputs: [
          { type: 'console', level: LogLevel.INFO },
          { type: 'file', level: LogLevel.DEBUG }
        ]
      });

      testLogger.debug('Debug message');

      // Console should not log debug messages (level is INFO)
      // But file output would log it (level is DEBUG)
      expect(console.log).not.toHaveBeenCalled();
    });
  });
});