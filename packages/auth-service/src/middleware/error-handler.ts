// Error handling middleware for Authentication Service
// Middleware de tratamento de erros para o Serviço de Autenticação
import { Request, Response, NextFunction } from 'express';
import { 
  AppError, 
  ValidationError, 
  AuthenticationError, 
  AuthorizationError,
  createLogger 
} from '@adms/shared';

const logger = createLogger({ service: 'auth-service-error' });

/**
 * Error response interface
 */
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId?: string;
    stack?: string;
  };
}

/**
 * Error handler middleware
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Generate request ID if not present
  const requestId = req.headers['x-request-id'] as string || 
                   req.headers['x-correlation-id'] as string ||
                   `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Base error response
  const errorResponse: ErrorResponse = {
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
      requestId
    }
  };

  let statusCode = 500;

  // Handle different error types
  if (error instanceof ValidationError) {
    statusCode = 400;
    errorResponse.error.code = 'VALIDATION_ERROR';
    errorResponse.error.message = error.message;
    errorResponse.error.details = error.details;

    logger.warn('Validation error', {
      requestId,
      error: error.message,
      details: error.details,
      path: req.path,
      method: req.method,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });

  } else if (error instanceof AuthenticationError) {
    statusCode = 401;
    errorResponse.error.code = 'AUTHENTICATION_ERROR';
    errorResponse.error.message = error.message;

    logger.warn('Authentication error', {
      requestId,
      error: error.message,
      path: req.path,
      method: req.method,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });

  } else if (error instanceof AuthorizationError) {
    statusCode = 403;
    errorResponse.error.code = 'AUTHORIZATION_ERROR';
    errorResponse.error.message = error.message;

    logger.warn('Authorization error', {
      requestId,
      error: error.message,
      path: req.path,
      method: req.method,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: (req as any).user?.id
    });

  } else if (error instanceof AppError) {
    statusCode = error.statusCode;
    errorResponse.error.code = error.code;
    errorResponse.error.message = error.message;
    errorResponse.error.details = error.details;

    logger.error('Application error', {
      requestId,
      error: error.message,
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
      path: req.path,
      method: req.method,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      stack: error.stack
    });

  } else if (error.name === 'ValidationError') {
    // Mongoose/Joi validation errors
    statusCode = 400;
    errorResponse.error.code = 'VALIDATION_ERROR';
    errorResponse.error.message = 'Validation failed';
    errorResponse.error.details = error.message;

  } else if (error.name === 'CastError') {
    // Database cast errors
    statusCode = 400;
    errorResponse.error.code = 'INVALID_ID';
    errorResponse.error.message = 'Invalid ID format';

  } else if (error.name === 'MongoError' || error.name === 'MongoServerError') {
    // MongoDB errors
    statusCode = 500;
    errorResponse.error.code = 'DATABASE_ERROR';
    errorResponse.error.message = 'Database operation failed';

    logger.error('Database error', {
      requestId,
      error: error.message,
      name: error.name,
      path: req.path,
      method: req.method,
      stack: error.stack
    });

  } else if (error.message.includes('duplicate key')) {
    // Duplicate key errors
    statusCode = 409;
    errorResponse.error.code = 'DUPLICATE_RESOURCE';
    errorResponse.error.message = 'Resource already exists';

  } else if (error.name === 'JsonWebTokenError') {
    // JWT errors
    statusCode = 401;
    errorResponse.error.code = 'INVALID_TOKEN';
    errorResponse.error.message = 'Invalid or malformed token';

  } else if (error.name === 'TokenExpiredError') {
    // JWT expiration errors
    statusCode = 401;
    errorResponse.error.code = 'TOKEN_EXPIRED';
    errorResponse.error.message = 'Token has expired';

  } else if (error.name === 'NotBeforeError') {
    // JWT not before errors
    statusCode = 401;
    errorResponse.error.code = 'TOKEN_NOT_ACTIVE';
    errorResponse.error.message = 'Token not active yet';

  } else if (error.message.includes('ECONNREFUSED')) {
    // Connection errors
    statusCode = 503;
    errorResponse.error.code = 'SERVICE_UNAVAILABLE';
    errorResponse.error.message = 'External service unavailable';

  } else if (error.message.includes('timeout')) {
    // Timeout errors
    statusCode = 504;
    errorResponse.error.code = 'TIMEOUT';
    errorResponse.error.message = 'Request timeout';

  } else {
    // Generic server errors
    logger.error('Unhandled error', {
      requestId,
      error: error.message,
      name: error.name,
      path: req.path,
      method: req.method,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      stack: error.stack,
      body: req.body,
      query: req.query,
      params: req.params
    });
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = error.stack;
  }

  // Set security headers
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block'
  });

  // Send error response
  res.status(statusCode).json(errorResponse);
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  const requestId = req.headers['x-request-id'] as string || 
                   `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  logger.warn('Route not found', {
    requestId,
    path: req.path,
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });

  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
      timestamp: new Date().toISOString(),
      requestId
    }
  });
};

/**
 * Async error wrapper
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Rate limit error handler
 */
export const rateLimitHandler = (req: Request, res: Response): void => {
  const requestId = req.headers['x-request-id'] as string || 
                   `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  logger.warn('Rate limit exceeded', {
    requestId,
    path: req.path,
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });

  res.status(429).json({
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
      timestamp: new Date().toISOString(),
      requestId
    }
  });
};

/**
 * Validation error formatter
 */
export const formatValidationError = (errors: any[]): any => {
  return errors.map(error => ({
    field: error.path || error.field,
    message: error.message,
    value: error.value,
    code: error.code || 'VALIDATION_FAILED'
  }));
};

/**
 * Create standardized error response
 */
export const createErrorResponse = (
  code: string,
  message: string,
  details?: any,
  statusCode = 500
) => {
  return {
    error: {
      code,
      message,
      details,
      timestamp: new Date().toISOString()
    },
    statusCode
  };
};

/**
 * Database error handler
 */
export const handleDatabaseError = (error: any): AppError => {
  if (error.code === '23505') {
    // Unique constraint violation
    return new AppError('DUPLICATE_RESOURCE', 'Resource already exists', 409);
  }
  
  if (error.code === '23503') {
    // Foreign key constraint violation
    return new AppError('INVALID_REFERENCE', 'Referenced resource does not exist', 400);
  }
  
  if (error.code === '23502') {
    // Not null constraint violation
    return new AppError('MISSING_REQUIRED_FIELD', 'Required field is missing', 400);
  }
  
  if (error.code === '42P01') {
    // Table does not exist
    return new AppError('DATABASE_ERROR', 'Database schema error', 500);
  }

  // Generic database error
  return new AppError('DATABASE_ERROR', 'Database operation failed', 500, error.message);
};

/**
 * JWT error handler
 */
export const handleJWTError = (error: any): AppError => {
  if (error.name === 'JsonWebTokenError') {
    return new AuthenticationError('Invalid token');
  }
  
  if (error.name === 'TokenExpiredError') {
    return new AuthenticationError('Token expired');
  }
  
  if (error.name === 'NotBeforeError') {
    return new AuthenticationError('Token not active');
  }

  return new AuthenticationError('Token validation failed');
};

/**
 * Sanitize error for logging
 */
export const sanitizeError = (error: any): any => {
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
  
  if (typeof error === 'object' && error !== null) {
    const sanitized = { ...error };
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }
  
  return error;
};