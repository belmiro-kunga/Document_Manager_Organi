// Custom error classes for Advanced Document Management System
// Classes de erro personalizadas para o Sistema de Gestão Documental Avançado

import { ERROR_CODES, HTTP_STATUS } from '../constants';
import type { SupportedLanguage } from '../types';

/**
 * Base application error class
 * Classe base de erro da aplicação
 */
export abstract class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, unknown>;
  public readonly language: SupportedLanguage;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    isOperational = true,
    details?: Record<string, unknown>,
    language: SupportedLanguage = 'pt-PT'
  ) {
    super(message);
    
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;
    this.language = language;
    
    // Maintain proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
    
    this.name = this.constructor.name;
  }

  /**
   * Convert error to JSON format for API responses
   * Converter erro para formato JSON para respostas da API
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
      language: this.language,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Validation error - for input validation failures
 * Erro de validação - para falhas de validação de entrada
 */
export class ValidationError extends AppError {
  constructor(
    message: string,
    details?: Record<string, unknown>,
    language: SupportedLanguage = 'pt-PT'
  ) {
    const messages = {
      'pt-PT': message || 'Dados de entrada inválidos',
      'en-US': message || 'Invalid input data',
      'fr-FR': message || 'Données d\'entrée invalides',
    };

    super(
      messages[language],
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR,
      true,
      details,
      language
    );
  }
}

/**
 * Authentication error - for authentication failures
 * Erro de autenticação - para falhas de autenticação
 */
export class AuthenticationError extends AppError {
  constructor(
    message?: string,
    details?: Record<string, unknown>,
    language: SupportedLanguage = 'pt-PT'
  ) {
    const messages = {
      'pt-PT': message || 'Credenciais inválidas',
      'en-US': message || 'Invalid credentials',
      'fr-FR': message || 'Identifiants invalides',
    };

    super(
      messages[language],
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_CODES.INVALID_CREDENTIALS,
      true,
      details,
      language
    );
  }
}

/**
 * Authorization error - for insufficient permissions
 * Erro de autorização - para permissões insuficientes
 */
export class AuthorizationError extends AppError {
  constructor(
    message?: string,
    details?: Record<string, unknown>,
    language: SupportedLanguage = 'pt-PT'
  ) {
    const messages = {
      'pt-PT': message || 'Permissões insuficientes',
      'en-US': message || 'Insufficient permissions',
      'fr-FR': message || 'Permissions insuffisantes',
    };

    super(
      messages[language],
      HTTP_STATUS.FORBIDDEN,
      ERROR_CODES.INSUFFICIENT_PERMISSIONS,
      true,
      details,
      language
    );
  }
}

/**
 * Resource not found error
 * Erro de recurso não encontrado
 */
export class NotFoundError extends AppError {
  constructor(
    resource: string,
    id?: string,
    language: SupportedLanguage = 'pt-PT'
  ) {
    const messages = {
      'pt-PT': `${resource} não encontrado${id ? ` (ID: ${id})` : ''}`,
      'en-US': `${resource} not found${id ? ` (ID: ${id})` : ''}`,
      'fr-FR': `${resource} non trouvé${id ? ` (ID: ${id})` : ''}`,
    };

    super(
      messages[language],
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.RESOURCE_NOT_FOUND,
      true,
      { resource, id },
      language
    );
  }
}

/**
 * Resource conflict error - for duplicate resources
 * Erro de conflito de recurso - para recursos duplicados
 */
export class ConflictError extends AppError {
  constructor(
    message?: string,
    details?: Record<string, unknown>,
    language: SupportedLanguage = 'pt-PT'
  ) {
    const messages = {
      'pt-PT': message || 'Recurso já existe',
      'en-US': message || 'Resource already exists',
      'fr-FR': message || 'La ressource existe déjà',
    };

    super(
      messages[language],
      HTTP_STATUS.CONFLICT,
      ERROR_CODES.RESOURCE_ALREADY_EXISTS,
      true,
      details,
      language
    );
  }
}

/**
 * File type error - for unsupported file types
 * Erro de tipo de arquivo - para tipos de arquivo não suportados
 */
export class FileTypeError extends AppError {
  constructor(
    fileType: string,
    supportedTypes: string[],
    language: SupportedLanguage = 'pt-PT'
  ) {
    const messages = {
      'pt-PT': `Tipo de arquivo não suportado: ${fileType}. Tipos suportados: ${supportedTypes.join(', ')}`,
      'en-US': `Unsupported file type: ${fileType}. Supported types: ${supportedTypes.join(', ')}`,
      'fr-FR': `Type de fichier non pris en charge: ${fileType}. Types pris en charge: ${supportedTypes.join(', ')}`,
    };

    super(
      messages[language],
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.INVALID_FILE_TYPE,
      true,
      { fileType, supportedTypes },
      language
    );
  }
}

/**
 * File size error - for files that are too large
 * Erro de tamanho de arquivo - para arquivos muito grandes
 */
export class FileSizeError extends AppError {
  constructor(
    actualSize: number,
    maxSize: number,
    language: SupportedLanguage = 'pt-PT'
  ) {
    const formatSize = (bytes: number): string => {
      const units = ['B', 'KB', 'MB', 'GB'];
      let size = bytes;
      let unitIndex = 0;
      
      while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
      }
      
      return `${size.toFixed(2)} ${units[unitIndex]}`;
    };

    const messages = {
      'pt-PT': `Arquivo muito grande: ${formatSize(actualSize)}. Tamanho máximo: ${formatSize(maxSize)}`,
      'en-US': `File too large: ${formatSize(actualSize)}. Maximum size: ${formatSize(maxSize)}`,
      'fr-FR': `Fichier trop volumineux: ${formatSize(actualSize)}. Taille maximale: ${formatSize(maxSize)}`,
    };

    super(
      messages[language],
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.FILE_TOO_LARGE,
      true,
      { actualSize, maxSize },
      language
    );
  }
}

/**
 * Storage error - for storage-related failures
 * Erro de armazenamento - para falhas relacionadas ao armazenamento
 */
export class StorageError extends AppError {
  constructor(
    message?: string,
    details?: Record<string, unknown>,
    language: SupportedLanguage = 'pt-PT'
  ) {
    const messages = {
      'pt-PT': message || 'Erro de armazenamento',
      'en-US': message || 'Storage error',
      'fr-FR': message || 'Erreur de stockage',
    };

    super(
      messages[language],
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_CODES.STORAGE_ERROR,
      true,
      details,
      language
    );
  }
}

/**
 * Storage quota exceeded error
 * Erro de cota de armazenamento excedida
 */
export class StorageQuotaError extends AppError {
  constructor(
    usedSpace: number,
    totalSpace: number,
    language: SupportedLanguage = 'pt-PT'
  ) {
    const formatSize = (bytes: number): string => {
      const units = ['B', 'KB', 'MB', 'GB'];
      let size = bytes;
      let unitIndex = 0;
      
      while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
      }
      
      return `${size.toFixed(2)} ${units[unitIndex]}`;
    };

    const messages = {
      'pt-PT': `Cota de armazenamento excedida: ${formatSize(usedSpace)} de ${formatSize(totalSpace)} usado`,
      'en-US': `Storage quota exceeded: ${formatSize(usedSpace)} of ${formatSize(totalSpace)} used`,
      'fr-FR': `Quota de stockage dépassé: ${formatSize(usedSpace)} sur ${formatSize(totalSpace)} utilisé`,
    };

    super(
      messages[language],
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.STORAGE_QUOTA_EXCEEDED,
      true,
      { usedSpace, totalSpace },
      language
    );
  }
}

/**
 * OCR processing error
 * Erro de processamento OCR
 */
export class OCRProcessingError extends AppError {
  constructor(
    message?: string,
    details?: Record<string, unknown>,
    language: SupportedLanguage = 'pt-PT'
  ) {
    const messages = {
      'pt-PT': message || 'Falha no processamento OCR',
      'en-US': message || 'OCR processing failed',
      'fr-FR': message || 'Échec du traitement OCR',
    };

    super(
      messages[language],
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_CODES.OCR_PROCESSING_FAILED,
      true,
      details,
      language
    );
  }
}

/**
 * AI processing error
 * Erro de processamento de IA
 */
export class AIProcessingError extends AppError {
  constructor(
    message?: string,
    details?: Record<string, unknown>,
    language: SupportedLanguage = 'pt-PT'
  ) {
    const messages = {
      'pt-PT': message || 'Falha no processamento de IA',
      'en-US': message || 'AI processing failed',
      'fr-FR': message || 'Échec du traitement IA',
    };

    super(
      messages[language],
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_CODES.AI_PROCESSING_FAILED,
      true,
      details,
      language
    );
  }
}

/**
 * Rate limit exceeded error
 * Erro de limite de taxa excedido
 */
export class RateLimitError extends AppError {
  constructor(
    limit: number,
    windowMs: number,
    language: SupportedLanguage = 'pt-PT'
  ) {
    const windowMinutes = Math.ceil(windowMs / 60000);
    
    const messages = {
      'pt-PT': `Limite de taxa excedido: máximo ${limit} solicitações por ${windowMinutes} minutos`,
      'en-US': `Rate limit exceeded: maximum ${limit} requests per ${windowMinutes} minutes`,
      'fr-FR': `Limite de taux dépassé: maximum ${limit} requêtes par ${windowMinutes} minutes`,
    };

    super(
      messages[language],
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.RATE_LIMIT_EXCEEDED,
      true,
      { limit, windowMs },
      language
    );
  }
}

/**
 * Token expired error
 * Erro de token expirado
 */
export class TokenExpiredError extends AppError {
  constructor(
    tokenType = 'access',
    language: SupportedLanguage = 'pt-PT'
  ) {
    const messages = {
      'pt-PT': `Token ${tokenType === 'access' ? 'de acesso' : 'de atualização'} expirado`,
      'en-US': `${tokenType === 'access' ? 'Access' : 'Refresh'} token expired`,
      'fr-FR': `Token ${tokenType === 'access' ? 'd\'accès' : 'de rafraîchissement'} expiré`,
    };

    super(
      messages[language],
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_CODES.TOKEN_EXPIRED,
      true,
      { tokenType },
      language
    );
  }
}

/**
 * Service unavailable error
 * Erro de serviço indisponível
 */
export class ServiceUnavailableError extends AppError {
  constructor(
    service: string,
    language: SupportedLanguage = 'pt-PT'
  ) {
    const messages = {
      'pt-PT': `Serviço indisponível: ${service}`,
      'en-US': `Service unavailable: ${service}`,
      'fr-FR': `Service indisponible: ${service}`,
    };

    super(
      messages[language],
      HTTP_STATUS.SERVICE_UNAVAILABLE,
      ERROR_CODES.SERVICE_UNAVAILABLE,
      true,
      { service },
      language
    );
  }
}

/**
 * Internal server error
 * Erro interno do servidor
 */
export class InternalServerError extends AppError {
  constructor(
    message?: string,
    details?: Record<string, unknown>,
    language: SupportedLanguage = 'pt-PT'
  ) {
    const messages = {
      'pt-PT': message || 'Erro interno do servidor',
      'en-US': message || 'Internal server error',
      'fr-FR': message || 'Erreur interne du serveur',
    };

    super(
      messages[language],
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_CODES.INTERNAL_ERROR,
      false, // Not operational - indicates a programming error
      details,
      language
    );
  }
}

/**
 * Error factory for creating errors based on error codes
 * Fábrica de erros para criar erros baseados em códigos de erro
 */
export class ErrorFactory {
  static create(
    code: string,
    message?: string,
    details?: Record<string, unknown>,
    language: SupportedLanguage = 'pt-PT'
  ): AppError {
    switch (code) {
      case ERROR_CODES.VALIDATION_ERROR:
        return new ValidationError(message, details, language);
      case ERROR_CODES.INVALID_CREDENTIALS:
        return new AuthenticationError(message, details, language);
      case ERROR_CODES.INSUFFICIENT_PERMISSIONS:
        return new AuthorizationError(message, details, language);
      case ERROR_CODES.RESOURCE_NOT_FOUND:
        return new NotFoundError(message || 'Resource', undefined, language);
      case ERROR_CODES.RESOURCE_ALREADY_EXISTS:
        return new ConflictError(message, details, language);
      case ERROR_CODES.INVALID_FILE_TYPE:
        return new FileTypeError(
          details?.fileType as string || 'unknown',
          details?.supportedTypes as string[] || [],
          language
        );
      case ERROR_CODES.FILE_TOO_LARGE:
        return new FileSizeError(
          details?.actualSize as number || 0,
          details?.maxSize as number || 0,
          language
        );
      case ERROR_CODES.STORAGE_ERROR:
        return new StorageError(message, details, language);
      case ERROR_CODES.STORAGE_QUOTA_EXCEEDED:
        return new StorageQuotaError(
          details?.usedSpace as number || 0,
          details?.totalSpace as number || 0,
          language
        );
      case ERROR_CODES.OCR_PROCESSING_FAILED:
        return new OCRProcessingError(message, details, language);
      case ERROR_CODES.AI_PROCESSING_FAILED:
        return new AIProcessingError(message, details, language);
      case ERROR_CODES.RATE_LIMIT_EXCEEDED:
        return new RateLimitError(
          details?.limit as number || 100,
          details?.windowMs as number || 900000,
          language
        );
      case ERROR_CODES.TOKEN_EXPIRED:
        return new TokenExpiredError(details?.tokenType as string, language);
      case ERROR_CODES.SERVICE_UNAVAILABLE:
        return new ServiceUnavailableError(details?.service as string || 'Unknown', language);
      default:
        return new InternalServerError(message, details, language);
    }
  }
}

/**
 * Check if error is operational (expected) or programming error
 * Verificar se o erro é operacional (esperado) ou erro de programação
 */
export const isOperationalError = (error: Error): boolean => {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
};