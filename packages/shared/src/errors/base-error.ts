// Base error classes for Advanced DMS
// Classes de erro base para o DMS Avançado

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Error categories for better classification
 */
export enum ErrorCategory {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  CONFLICT = 'conflict',
  RATE_LIMIT = 'rate_limit',
  EXTERNAL_SERVICE = 'external_service',
  DATABASE = 'database',
  FILE_SYSTEM = 'file_system',
  NETWORK = 'network',
  BUSINESS_LOGIC = 'business_logic',
  SYSTEM = 'system'
}

/**
 * Error context interface for additional information
 */
export interface ErrorContext {
  userId?: string;
  requestId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp?: Date;
  service?: string;
  method?: string;
  path?: string;
  params?: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Base error class for all application errors
 */
export abstract class BaseError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly severity: ErrorSeverity;
  public readonly category: ErrorCategory;
  public readonly context: ErrorContext;
  public readonly isOperational: boolean;
  public readonly timestamp: Date;

  constructor(
    message: string,
    code: string,
    statusCode: number,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    category: ErrorCategory,
    context: ErrorContext = {},
    isOperational: boolean = true
  ) {
    super(message);
    
    // Maintain proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.severity = severity;
    this.category = category;
    this.context = {
      ...context,
      timestamp: context.timestamp || new Date()
    };
    this.isOperational = isOperational;
    this.timestamp = new Date();
  }

  /**
   * Convert error to JSON for logging and API responses
   */
  public toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      severity: this.severity,
      category: this.category,
      context: this.context,
      isOperational: this.isOperational,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack
    };
  }

  /**
   * Convert error to API response format
   */
  public toApiResponse(): Record<string, any> {
    return {
      error: {
        code: this.code,
        message: this.message,
        category: this.category,
        timestamp: this.timestamp.toISOString(),
        ...(this.context.requestId && { requestId: this.context.requestId })
      }
    };
  }

  /**
   * Check if error should be logged
   */
  public shouldLog(): boolean {
    return this.severity !== ErrorSeverity.LOW;
  }

  /**
   * Check if error should be reported to monitoring
   */
  public shouldReport(): boolean {
    return this.severity === ErrorSeverity.HIGH || this.severity === ErrorSeverity.CRITICAL;
  }

  /**
   * Get localized error message
   */
  public getLocalizedMessage(language: string = 'pt-PT'): string {
    // This would integrate with i18n system
    // For now, return the default message
    return this.message;
  }
}

/**
 * Validation error for input validation failures
 */
export class ValidationError extends BaseError {
  public readonly field?: string;
  public readonly value?: any;
  public readonly constraints?: string[];

  constructor(
    message: string,
    field?: string,
    value?: any,
    constraints?: string[],
    context: ErrorContext = {}
  ) {
    super(
      message,
      'VALIDATION_ERROR',
      400,
      ErrorSeverity.LOW,
      ErrorCategory.VALIDATION,
      context
    );

    this.field = field;
    this.value = value;
    this.constraints = constraints;
  }

  public toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      field: this.field,
      value: this.value,
      constraints: this.constraints
    };
  }
}

/**
 * Authentication error for authentication failures
 */
export class AuthenticationError extends BaseError {
  constructor(
    message: string = 'Authentication failed',
    context: ErrorContext = {}
  ) {
    super(
      message,
      'AUTHENTICATION_ERROR',
      401,
      ErrorSeverity.MEDIUM,
      ErrorCategory.AUTHENTICATION,
      context
    );
  }
}

/**
 * Authorization error for authorization failures
 */
export class AuthorizationError extends BaseError {
  public readonly requiredPermissions?: string[];
  public readonly userPermissions?: string[];

  constructor(
    message: string = 'Access denied',
    requiredPermissions?: string[],
    userPermissions?: string[],
    context: ErrorContext = {}
  ) {
    super(
      message,
      'AUTHORIZATION_ERROR',
      403,
      ErrorSeverity.MEDIUM,
      ErrorCategory.AUTHORIZATION,
      context
    );

    this.requiredPermissions = requiredPermissions;
    this.userPermissions = userPermissions;
  }

  public toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      requiredPermissions: this.requiredPermissions,
      userPermissions: this.userPermissions
    };
  }
}

/**
 * Not found error for resource not found
 */
export class NotFoundError extends BaseError {
  public readonly resource?: string;
  public readonly resourceId?: string;

  constructor(
    message: string = 'Resource not found',
    resource?: string,
    resourceId?: string,
    context: ErrorContext = {}
  ) {
    super(
      message,
      'NOT_FOUND_ERROR',
      404,
      ErrorSeverity.LOW,
      ErrorCategory.NOT_FOUND,
      context
    );

    this.resource = resource;
    this.resourceId = resourceId;
  }

  public toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      resource: this.resource,
      resourceId: this.resourceId
    };
  }
}

/**
 * Conflict error for resource conflicts
 */
export class ConflictError extends BaseError {
  public readonly conflictingResource?: string;
  public readonly conflictingValue?: any;

  constructor(
    message: string = 'Resource conflict',
    conflictingResource?: string,
    conflictingValue?: any,
    context: ErrorContext = {}
  ) {
    super(
      message,
      'CONFLICT_ERROR',
      409,
      ErrorSeverity.MEDIUM,
      ErrorCategory.CONFLICT,
      context
    );

    this.conflictingResource = conflictingResource;
    this.conflictingValue = conflictingValue;
  }

  public toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      conflictingResource: this.conflictingResource,
      conflictingValue: this.conflictingValue
    };
  }
}

/**
 * Rate limit error for rate limiting
 */
export class RateLimitError extends BaseError {
  public readonly limit?: number;
  public readonly remaining?: number;
  public readonly resetTime?: Date;

  constructor(
    message: string = 'Rate limit exceeded',
    limit?: number,
    remaining?: number,
    resetTime?: Date,
    context: ErrorContext = {}
  ) {
    super(
      message,
      'RATE_LIMIT_ERROR',
      429,
      ErrorSeverity.LOW,
      ErrorCategory.RATE_LIMIT,
      context
    );

    this.limit = limit;
    this.remaining = remaining;
    this.resetTime = resetTime;
  }

  public toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      limit: this.limit,
      remaining: this.remaining,
      resetTime: this.resetTime?.toISOString()
    };
  }
}

/**
 * External service error for third-party service failures
 */
export class ExternalServiceError extends BaseError {
  public readonly serviceName?: string;
  public readonly serviceResponse?: any;
  public readonly retryable?: boolean;

  constructor(
    message: string,
    serviceName?: string,
    serviceResponse?: any,
    retryable: boolean = true,
    context: ErrorContext = {}
  ) {
    super(
      message,
      'EXTERNAL_SERVICE_ERROR',
      502,
      ErrorSeverity.HIGH,
      ErrorCategory.EXTERNAL_SERVICE,
      context
    );

    this.serviceName = serviceName;
    this.serviceResponse = serviceResponse;
    this.retryable = retryable;
  }

  public toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      serviceName: this.serviceName,
      serviceResponse: this.serviceResponse,
      retryable: this.retryable
    };
  }
}

/**
 * Database error for database operation failures
 */
export class DatabaseError extends BaseError {
  public readonly query?: string;
  public readonly parameters?: any[];
  public readonly originalError?: Error;

  constructor(
    message: string,
    query?: string,
    parameters?: any[],
    originalError?: Error,
    context: ErrorContext = {}
  ) {
    super(
      message,
      'DATABASE_ERROR',
      500,
      ErrorSeverity.HIGH,
      ErrorCategory.DATABASE,
      context
    );

    this.query = query;
    this.parameters = parameters;
    this.originalError = originalError;
  }

  public toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      query: this.query,
      parameters: this.parameters,
      originalError: this.originalError?.message
    };
  }
}

/**
 * File system error for file operation failures
 */
export class FileSystemError extends BaseError {
  public readonly filePath?: string;
  public readonly operation?: string;
  public readonly originalError?: Error;

  constructor(
    message: string,
    filePath?: string,
    operation?: string,
    originalError?: Error,
    context: ErrorContext = {}
  ) {
    super(
      message,
      'FILE_SYSTEM_ERROR',
      500,
      ErrorSeverity.MEDIUM,
      ErrorCategory.FILE_SYSTEM,
      context
    );

    this.filePath = filePath;
    this.operation = operation;
    this.originalError = originalError;
  }

  public toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      filePath: this.filePath,
      operation: this.operation,
      originalError: this.originalError?.message
    };
  }
}

/**
 * Business logic error for business rule violations
 */
export class BusinessLogicError extends BaseError {
  public readonly rule?: string;
  public readonly violatedConstraints?: string[];

  constructor(
    message: string,
    rule?: string,
    violatedConstraints?: string[],
    context: ErrorContext = {}
  ) {
    super(
      message,
      'BUSINESS_LOGIC_ERROR',
      422,
      ErrorSeverity.MEDIUM,
      ErrorCategory.BUSINESS_LOGIC,
      context
    );

    this.rule = rule;
    this.violatedConstraints = violatedConstraints;
  }

  public toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      rule: this.rule,
      violatedConstraints: this.violatedConstraints
    };
  }
}