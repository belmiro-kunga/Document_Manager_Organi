// Global error handler for Advanced DMS
// Handler de erro global para o DMS Avançado

import { BaseError, ErrorSeverity } from './base-error';
import { Logger } from '../logging/logger';

/**
 * Error handler configuration
 */
export interface ErrorHandlerConfig {
  logger?: Logger;
  enableStackTrace?: boolean;
  enableSentry?: boolean;
  sentryDsn?: string;
  environment?: string;
  service?: string;
}

/**
 * Error reporting interface
 */
export interface ErrorReporter {
  report(error: Error, context?: Record<string, any>): Promise<void>;
}

/**
 * Global error handler class
 */
export class ErrorHandler {
  private logger?: Logger;
  private config: ErrorHandlerConfig;
  private reporters: ErrorReporter[] = [];

  constructor(config: ErrorHandlerConfig = {}) {
    this.config = {
      enableStackTrace: true,
      enableSentry: false,
      environment: process.env.NODE_ENV || 'development',
      service: 'adms',
      ...config
    };

    this.logger = config.logger;
  }

  /**
   * Add error reporter
   */
  public addReporter(reporter: ErrorReporter): void {
    this.reporters.push(reporter);
  }

  /**
   * Handle error with logging and reporting
   */
  public async handleError(error: Error, context: Record<string, any> = {}): Promise<void> {
    try {
      // Enhance context
      const enhancedContext = {
        ...context,
        timestamp: new Date().toISOString(),
        service: this.config.service,
        environment: this.config.environment
      };

      // Log error
      await this.logError(error, enhancedContext);

      // Report error if needed
      if (this.shouldReport(error)) {
        await this.reportError(error, enhancedContext);
      }
    } catch (handlingError) {
      // Fallback logging if error handling fails
      console.error('Error in error handler:', handlingError);
      console.error('Original error:', error);
    }
  }

  /**
   * Handle uncaught exceptions
   */
  public handleUncaughtException(error: Error): void {
    console.error('Uncaught Exception:', error);
    
    this.handleError(error, {
      type: 'uncaught_exception',
      fatal: true
    }).finally(() => {
      // Give time for logging/reporting before exit
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    });
  }

  /**
   * Handle unhandled promise rejections
   */
  public handleUnhandledRejection(reason: any, promise: Promise<any>): void {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    console.error('Unhandled Rejection:', error);
    
    this.handleError(error, {
      type: 'unhandled_rejection',
      promise: promise.toString()
    });
  }

  /**
   * Setup global error handlers
   */
  public setupGlobalHandlers(): void {
    process.on('uncaughtException', this.handleUncaughtException.bind(this));
    process.on('unhandledRejection', this.handleUnhandledRejection.bind(this));
  }

  /**
   * Create Express error middleware
   */
  public createExpressMiddleware() {
    return async (error: Error, req: any, res: any, next: any) => {
      const context = {
        requestId: req.id || req.headers['x-request-id'],
        userId: req.user?.id,
        method: req.method,
        path: req.path,
        query: req.query,
        body: this.sanitizeBody(req.body),
        headers: this.sanitizeHeaders(req.headers),
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      };

      await this.handleError(error, context);

      // Send response
      if (error instanceof BaseError) {
        res.status(error.statusCode).json(error.toApiResponse());
      } else {
        res.status(500).json({
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: this.config.environment === 'production' 
              ? 'Internal server error' 
              : error.message,
            timestamp: new Date().toISOString()
          }
        });
      }
    };
  }

  /**
   * Log error based on severity
   */
  private async logError(error: Error, context: Record<string, any>): Promise<void> {
    if (!this.logger) {
      console.error('Error:', error.message, context);
      return;
    }

    const logData = {
      message: error.message,
      stack: this.config.enableStackTrace ? error.stack : undefined,
      ...context
    };

    if (error instanceof BaseError) {
      switch (error.severity) {
        case ErrorSeverity.CRITICAL:
          this.logger.error('Critical error occurred', { error: error.toJSON(), ...logData });
          break;
        case ErrorSeverity.HIGH:
          this.logger.error('High severity error occurred', { error: error.toJSON(), ...logData });
          break;
        case ErrorSeverity.MEDIUM:
          this.logger.warn('Medium severity error occurred', { error: error.toJSON(), ...logData });
          break;
        case ErrorSeverity.LOW:
          this.logger.info('Low severity error occurred', { error: error.toJSON(), ...logData });
          break;
      }
    } else {
      this.logger.error('Unhandled error occurred', logData);
    }
  }

  /**
   * Report error to external services
   */
  private async reportError(error: Error, context: Record<string, any>): Promise<void> {
    const reportPromises = this.reporters.map(reporter => 
      reporter.report(error, context).catch(reportError => {
        console.error('Error reporting failed:', reportError);
      })
    );

    await Promise.allSettled(reportPromises);
  }

  /**
   * Determine if error should be reported
   */
  private shouldReport(error: Error): boolean {
    if (error instanceof BaseError) {
      return error.shouldReport();
    }
    
    // Report all non-BaseError errors in production
    return this.config.environment === 'production';
  }

  /**
   * Sanitize request body for logging
   */
  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
    const sanitized = { ...body };

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Sanitize request headers for logging
   */
  private sanitizeHeaders(headers: any): any {
    if (!headers || typeof headers !== 'object') {
      return headers;
    }

    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
    const sanitized = { ...headers };

    for (const header of sensitiveHeaders) {
      if (header in sanitized) {
        sanitized[header] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}

/**
 * Sentry error reporter implementation
 */
export class SentryReporter implements ErrorReporter {
  private sentryClient: any;

  constructor(dsn: string, options: Record<string, any> = {}) {
    // This would initialize Sentry client
    // For now, just log that it would be reported
    console.log('Sentry reporter initialized with DSN:', dsn);
  }

  public async report(error: Error, context?: Record<string, any>): Promise<void> {
    // This would report to Sentry
    console.log('Would report to Sentry:', error.message, context);
  }
}

/**
 * Create default error handler instance
 */
export function createErrorHandler(config: ErrorHandlerConfig = {}): ErrorHandler {
  const handler = new ErrorHandler(config);
  
  // Add Sentry reporter if enabled
  if (config.enableSentry && config.sentryDsn) {
    const sentryReporter = new SentryReporter(config.sentryDsn, {
      environment: config.environment,
      service: config.service
    });
    handler.addReporter(sentryReporter);
  }

  return handler;
}

/**
 * Global error handler instance
 */
let globalErrorHandler: ErrorHandler | null = null;

/**
 * Initialize global error handler
 */
export function initializeGlobalErrorHandler(config: ErrorHandlerConfig = {}): ErrorHandler {
  if (globalErrorHandler) {
    return globalErrorHandler;
  }

  globalErrorHandler = createErrorHandler(config);
  globalErrorHandler.setupGlobalHandlers();
  
  return globalErrorHandler;
}

/**
 * Get global error handler instance
 */
export function getGlobalErrorHandler(): ErrorHandler | null {
  return globalErrorHandler;
}