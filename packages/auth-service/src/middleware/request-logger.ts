// Request logging middleware for Authentication Service
// Middleware de logging de requisições para o Serviço de Autenticação
import { Request, Response, NextFunction } from 'express';
import { createLogger } from '@adms/shared';

const logger = createLogger({ service: 'auth-service-http' });

/**
 * Request logging middleware
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  
  // Generate request ID if not present
  const requestId = req.headers['x-request-id'] as string || 
                   req.headers['x-correlation-id'] as string ||
                   `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Add request ID to headers for downstream services
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);

  // Extract request information
  const requestInfo = {
    requestId,
    method: req.method,
    url: req.url,
    path: req.path,
    query: req.query,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    referer: req.get('Referer'),
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length'),
    timestamp: new Date().toISOString()
  };

  // Log incoming request
  logger.info('Incoming request', requestInfo);

  // Capture response details
  const originalSend = res.send;
  const originalJson = res.json;
  let responseBody: any;

  // Override res.send to capture response
  res.send = function(body: any) {
    responseBody = body;
    return originalSend.call(this, body);
  };

  // Override res.json to capture response
  res.json = function(body: any) {
    responseBody = body;
    return originalJson.call(this, body);
  };

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    const responseSize = res.get('Content-Length') || 
                        (responseBody ? JSON.stringify(responseBody).length : 0);

    const responseInfo = {
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      responseSize,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      timestamp: new Date().toISOString()
    };

    // Determine log level based on status code
    if (res.statusCode >= 500) {
      logger.error('Request completed with server error', {
        ...responseInfo,
        error: sanitizeResponseBody(responseBody)
      });
    } else if (res.statusCode >= 400) {
      logger.warn('Request completed with client error', {
        ...responseInfo,
        error: sanitizeResponseBody(responseBody)
      });
    } else if (duration > 5000) {
      logger.warn('Slow request completed', responseInfo);
    } else {
      logger.info('Request completed', responseInfo);
    }

    // Log performance metrics
    if (duration > 1000) {
      logger.warn('Performance warning', {
        requestId,
        method: req.method,
        path: req.path,
        duration,
        message: `Request took ${duration}ms`
      });
    }
  });

  // Log response errors
  res.on('error', (error) => {
    const duration = Date.now() - start;
    
    logger.error('Response error', {
      requestId,
      method: req.method,
      url: req.url,
      duration,
      error: error.message,
      stack: error.stack,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress
    });
  });

  next();
};

/**
 * Sanitize response body for logging
 */
const sanitizeResponseBody = (body: any): any => {
  if (!body) return body;

  const sensitiveFields = [
    'password', 'token', 'secret', 'key', 'authorization',
    'accessToken', 'refreshToken', 'apiKey', 'sessionId'
  ];

  try {
    const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
    const bodyObj = typeof body === 'string' ? JSON.parse(body) : body;

    if (typeof bodyObj === 'object' && bodyObj !== null) {
      const sanitized = { ...bodyObj };

      // Recursively sanitize nested objects
      const sanitizeObject = (obj: any): any => {
        if (typeof obj !== 'object' || obj === null) return obj;

        const result = Array.isArray(obj) ? [] : {};
        
        for (const [key, value] of Object.entries(obj)) {
          const lowerKey = key.toLowerCase();
          
          if (sensitiveFields.some(field => lowerKey.includes(field))) {
            (result as any)[key] = '[REDACTED]';
          } else if (typeof value === 'object' && value !== null) {
            (result as any)[key] = sanitizeObject(value);
          } else {
            (result as any)[key] = value;
          }
        }
        
        return result;
      };

      return sanitizeObject(sanitized);
    }

    return bodyStr;
  } catch (error) {
    return '[UNPARSEABLE_RESPONSE]';
  }
};

/**
 * Skip logging for certain paths
 */
export const skipLogging = (req: Request): boolean => {
  const skipPaths = [
    '/health',
    '/metrics',
    '/favicon.ico',
    '/robots.txt'
  ];

  return skipPaths.some(path => req.path.startsWith(path));
};

/**
 * Conditional request logger
 */
export const conditionalRequestLogger = (req: Request, res: Response, next: NextFunction): void => {
  if (skipLogging(req)) {
    return next();
  }
  
  return requestLogger(req, res, next);
};

/**
 * Security headers middleware
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Remove server header
  res.removeHeader('X-Powered-By');
  
  next();
};

/**
 * Request timeout middleware
 */
export const requestTimeout = (timeoutMs = 30000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        logger.error('Request timeout', {
          method: req.method,
          url: req.url,
          timeout: timeoutMs,
          userAgent: req.get('User-Agent'),
          ip: req.ip
        });

        res.status(408).json({
          error: {
            code: 'REQUEST_TIMEOUT',
            message: 'Request timeout',
            timestamp: new Date().toISOString()
          }
        });
      }
    }, timeoutMs);

    // Clear timeout when response finishes
    res.on('finish', () => {
      clearTimeout(timeout);
    });

    res.on('close', () => {
      clearTimeout(timeout);
    });

    next();
  };
};

/**
 * Request size limiter
 */
export const requestSizeLimiter = (maxSizeBytes = 10 * 1024 * 1024) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = parseInt(req.get('Content-Length') || '0');
    
    if (contentLength > maxSizeBytes) {
      logger.warn('Request too large', {
        method: req.method,
        url: req.url,
        contentLength,
        maxSize: maxSizeBytes,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });

      return res.status(413).json({
        error: {
          code: 'REQUEST_TOO_LARGE',
          message: 'Request entity too large',
          maxSize: maxSizeBytes,
          timestamp: new Date().toISOString()
        }
      });
    }

    next();
  };
};

/**
 * CORS logging middleware
 */
export const corsLogger = (req: Request, res: Response, next: NextFunction): void => {
  const origin = req.get('Origin');
  
  if (origin && req.method === 'OPTIONS') {
    logger.debug('CORS preflight request', {
      origin,
      method: req.method,
      headers: req.get('Access-Control-Request-Headers'),
      requestedMethod: req.get('Access-Control-Request-Method'),
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
  }

  next();
};