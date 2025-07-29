// Tests for error handling utilities
// Testes para utilitários de tratamento de erro

import {
  BaseError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,

  RateLimitError,
  ExternalServiceError,
  DatabaseError,
  FileSystemError,
  BusinessLogicError,
  ErrorSeverity,
  ErrorCategory,
  ErrorContext
} from '../errors/base-error';

import {
  ErrorHandler,
  createErrorHandler,
  initializeGlobalErrorHandler,
  getGlobalErrorHandler
} from '../errors/error-handler';

describe('Error Handling', () => {
  describe('BaseError', () => {
    test('should create base error with all properties', () => {
      const context: ErrorContext = {
        userId: 'user123',
        requestId: 'req456',
        method: 'POST',
        path: '/api/test'
      };

      const error = new ValidationError(
        'Test error message',
        'testField',
        'testValue',
        ['constraint1', 'constraint2'],
        context
      );

      expect(error.message).toBe('Test error message');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.severity).toBe(ErrorSeverity.LOW);
      expect(error.category).toBe(ErrorCategory.VALIDATION);
      expect(error.context.userId).toBe('user123');
      expect(error.context.requestId).toBe('req456');
      expect(error.isOperational).toBe(true);
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    test('should convert to JSON correctly', () => {
      const error = new ValidationError('Test error', 'field', 'value');
      const json = error.toJSON();

      expect(json['name']).toBe('ValidationError');
      expect(json['message']).toBe('Test error');
      expect(json['code']).toBe('VALIDATION_ERROR');
      expect(json['statusCode']).toBe(400);
      expect(json['severity']).toBe(ErrorSeverity.LOW);
      expect(json['category']).toBe(ErrorCategory.VALIDATION);
      expect(json['isOperational']).toBe(true);
      expect(json['timestamp']).toBeDefined();
      expect(json['stack']).toBeDefined();
    });

    test('should convert to API response correctly', () => {
      const context: ErrorContext = { requestId: 'req123' };
      const error = new ValidationError('Test error', 'field', 'value', [], context);
      const apiResponse = error.toApiResponse();

      expect(apiResponse['error']['code']).toBe('VALIDATION_ERROR');
      expect(apiResponse['error']['message']).toBe('Test error');
      expect(apiResponse['error']['category']).toBe(ErrorCategory.VALIDATION);
      expect(apiResponse['error']['requestId']).toBe('req123');
      expect(apiResponse['error']['timestamp']).toBeDefined();
    });

    test('should determine logging and reporting correctly', () => {
      const lowError = new ValidationError('Low severity error');
      const highError = new DatabaseError('High severity error');
      const criticalError = new DatabaseError('Critical error');

      expect(lowError.shouldLog()).toBe(false);
      expect(lowError.shouldReport()).toBe(false);

      expect(highError.shouldLog()).toBe(true);
      expect(highError.shouldReport()).toBe(true);

      expect(criticalError.shouldLog()).toBe(true);
      expect(criticalError.shouldReport()).toBe(true);
    });
  });

  describe('Specific Error Types', () => {
    test('ValidationError should include field and constraints', () => {
      const error = new ValidationError(
        'Invalid field',
        'email',
        'invalid-email',
        ['must be valid email', 'required']
      );

      expect(error.field).toBe('email');
      expect(error.value).toBe('invalid-email');
      expect(error.constraints).toEqual(['must be valid email', 'required']);

      const json = error.toJSON();
      expect(json['field']).toBe('email');
      expect(json['value']).toBe('invalid-email');
      expect(json['constraints']).toEqual(['must be valid email', 'required']);
    });

    test('AuthenticationError should have correct defaults', () => {
      const error = new AuthenticationError();

      expect(error.message).toBe('Authentication failed');
      expect(error.code).toBe('AUTHENTICATION_ERROR');
      expect(error.statusCode).toBe(401);
      expect(error.category).toBe(ErrorCategory.AUTHENTICATION);
    });

    test('AuthorizationError should include permissions', () => {
      const error = new AuthorizationError(
        'Access denied',
        ['read:documents', 'write:documents'],
        ['read:documents']
      );

      expect(error.requiredPermissions).toEqual(['read:documents', 'write:documents']);
      expect(error.userPermissions).toEqual(['read:documents']);

      const json = error.toJSON();
      expect(json['requiredPermissions']).toEqual(['read:documents', 'write:documents']);
      expect(json['userPermissions']).toEqual(['read:documents']);
    });

    test('NotFoundError should include resource information', () => {
      const error = new NotFoundError('Document not found', 'document', 'doc123');

      expect(error.resource).toBe('document');
      expect(error.resourceId).toBe('doc123');

      const json = error.toJSON();
      expect(json['resource']).toBe('document');
      expect(json['resourceId']).toBe('doc123');
    });

    test('RateLimitError should include rate limit information', () => {
      const resetTime = new Date();
      const error = new RateLimitError('Rate limit exceeded', 100, 0, resetTime);

      expect(error.limit).toBe(100);
      expect(error.remaining).toBe(0);
      expect(error.resetTime).toBe(resetTime);

      const json = error.toJSON();
      expect(json['limit']).toBe(100);
      expect(json['remaining']).toBe(0);
      expect(json['resetTime']).toBe(resetTime.toISOString());
    });

    test('ExternalServiceError should include service information', () => {
      const error = new ExternalServiceError(
        'Service unavailable',
        'payment-service',
        { status: 503 },
        true
      );

      expect(error.serviceName).toBe('payment-service');
      expect(error.serviceResponse).toEqual({ status: 503 });
      expect(error.retryable).toBe(true);

      const json = error.toJSON();
      expect(json['serviceName']).toBe('payment-service');
      expect(json['serviceResponse']).toEqual({ status: 503 });
      expect(json['retryable']).toBe(true);
    });

    test('DatabaseError should include query information', () => {
      const originalError = new Error('Connection failed');
      const error = new DatabaseError(
        'Database query failed',
        'SELECT * FROM users',
        ['param1', 'param2'],
        originalError
      );

      expect(error.query).toBe('SELECT * FROM users');
      expect(error.parameters).toEqual(['param1', 'param2']);
      expect(error.originalError).toBe(originalError);

      const json = error.toJSON();
      expect(json['query']).toBe('SELECT * FROM users');
      expect(json['parameters']).toEqual(['param1', 'param2']);
      expect(json['originalError']).toBe('Connection failed');
    });

    test('FileSystemError should include file information', () => {
      const originalError = new Error('Permission denied');
      const error = new FileSystemError(
        'File operation failed',
        '/path/to/file.txt',
        'read',
        originalError
      );

      expect(error.filePath).toBe('/path/to/file.txt');
      expect(error.operation).toBe('read');
      expect(error.originalError).toBe(originalError);

      const json = error.toJSON();
      expect(json['filePath']).toBe('/path/to/file.txt');
      expect(json['operation']).toBe('read');
      expect(json['originalError']).toBe('Permission denied');
    });

    test('BusinessLogicError should include rule information', () => {
      const error = new BusinessLogicError(
        'Business rule violated',
        'max-documents-per-user',
        ['User cannot have more than 100 documents']
      );

      expect(error.rule).toBe('max-documents-per-user');
      expect(error.violatedConstraints).toEqual(['User cannot have more than 100 documents']);

      const json = error.toJSON();
      expect(json['rule']).toBe('max-documents-per-user');
      expect(json['violatedConstraints']).toEqual(['User cannot have more than 100 documents']);
    });
  });

  describe('ErrorHandler', () => {
    test('should create error handler with default config', () => {
      const handler = createErrorHandler();
      expect(handler).toBeInstanceOf(ErrorHandler);
    });

    test('should handle errors with logging', async () => {
      const mockLogger = {
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
        trace: jest.fn()
      };

      const handler = createErrorHandler({ logger: mockLogger as any });
      const error = new ValidationError('Test error');

      await handler.handleError(error);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Low severity error occurred',
        expect.objectContaining({
          error: expect.objectContaining({
            message: 'Test error',
            code: 'VALIDATION_ERROR'
          })
        })
      );
    });

    test('should create Express middleware', async () => {
      const handler = createErrorHandler();
      const middleware = handler.createExpressMiddleware();

      const mockReq = {
        method: 'GET',
        path: '/test',
        query: {},
        headers: {},
        ip: '127.0.0.1'
      };

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const mockNext = jest.fn();

      const error = new ValidationError('Test validation error');

      await middleware(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'VALIDATION_ERROR',
            message: 'Test validation error'
          })
        })
      );
    });

    test('should handle non-BaseError instances', async () => {
      const handler = createErrorHandler();
      const middleware = handler.createExpressMiddleware();

      const mockReq = {
        method: 'GET',
        path: '/test',
        query: {},
        headers: {},
        ip: '127.0.0.1'
      };

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const mockNext = jest.fn();

      const error = new Error('Generic error');

      await middleware(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'INTERNAL_SERVER_ERROR'
          })
        })
      );
    });

    test('should sanitize sensitive data', async () => {
      const mockLogger = {
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
        trace: jest.fn()
      };

      const handler = createErrorHandler({ logger: mockLogger as any });
      const middleware = handler.createExpressMiddleware();

      const mockReq = {
        method: 'POST',
        path: '/login',
        query: {},
        body: { email: 'test@example.com', password: 'secret123' },
        headers: { authorization: 'Bearer token123' },
        ip: '127.0.0.1'
      };

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const mockNext = jest.fn();

      const error = new ValidationError('Test error');

      await middleware(error, mockReq, mockRes, mockNext);

      // Check that sensitive data was redacted
      const logCall = mockLogger.info.mock.calls[0];
      const logData = logCall[1];
      
      expect(logData.body.password).toBe('[REDACTED]');
      expect(logData.headers.authorization).toBe('[REDACTED]');
      expect(logData.body.email).toBe('test@example.com'); // Email should not be redacted
    });
  });

  describe('Global Error Handler', () => {
    test('should initialize global error handler', () => {
      const handler = initializeGlobalErrorHandler();
      expect(handler).toBeInstanceOf(ErrorHandler);
      expect(getGlobalErrorHandler()).toBe(handler);
    });

    test('should return existing global error handler', () => {
      const handler1 = initializeGlobalErrorHandler();
      const handler2 = initializeGlobalErrorHandler();
      expect(handler1).toBe(handler2);
    });
  });
});