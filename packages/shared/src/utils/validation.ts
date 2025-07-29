// Validation utilities for Advanced DMS
// Utilitários de validação para o DMS Avançado

import { z } from 'zod';
import { ValidationError } from '../errors/base-error';
import { SupportedLanguage, UserRole, DocumentType, DocumentStatus } from '../types/common';

/**
 * Common validation schemas
 */
export const ValidationSchemas = {
  // Basic types
  id: z.string().uuid('ID deve ser um UUID válido'),
  email: z.string().email('Email deve ter um formato válido'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'Senha deve conter pelo menos: 1 minúscula, 1 maiúscula, 1 número e 1 caractere especial'),
  
  // Enums
  language: z.enum(['pt-PT', 'en-US', 'fr-FR'] as const),
  userRole: z.nativeEnum(UserRole),
  documentType: z.nativeEnum(DocumentType),
  documentStatus: z.nativeEnum(DocumentStatus),
  
  // Pagination
  pagination: z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20),
    offset: z.number().int().min(0).optional()
  }),
  
  // Sorting
  sorting: z.object({
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('asc')
  }),
  
  // Search
  search: z.object({
    query: z.string().min(1).max(500).optional(),
    filters: z.record(z.any()).optional()
  }),
  
  // File upload
  fileUpload: z.object({
    filename: z.string().min(1).max(255),
    mimeType: z.string().min(1),
    size: z.number().int().min(1).max(100 * 1024 * 1024), // 100MB max
    checksum: z.string().optional()
  }),
  
  // User creation
  userCreate: z.object({
    email: z.string().email(),
    username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_-]+$/, 'Username deve conter apenas letras, números, _ e -'),
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
    role: z.nativeEnum(UserRole).default(UserRole.USER),
    language: z.enum(['pt-PT', 'en-US', 'fr-FR']).default('pt-PT'),
    department: z.string().max(100).optional(),
    position: z.string().max(100).optional(),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Telefone deve ter formato válido').optional()
  }),
  
  // User update
  userUpdate: z.object({
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().min(1).max(100).optional(),
    role: z.nativeEnum(UserRole).optional(),
    language: z.enum(['pt-PT', 'en-US', 'fr-FR']).optional(),
    department: z.string().max(100).optional(),
    position: z.string().max(100).optional(),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
    isActive: z.boolean().optional()
  }),
  
  // Document creation
  documentCreate: z.object({
    title: z.string().min(1).max(255),
    description: z.string().max(1000).optional(),
    type: z.nativeEnum(DocumentType),
    folderId: z.string().uuid().optional(),
    tags: z.array(z.string().min(1).max(50)).max(20).default([]),
    metadata: z.record(z.any()).optional()
  }),
  
  // Document update
  documentUpdate: z.object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().max(1000).optional(),
    status: z.nativeEnum(DocumentStatus).optional(),
    folderId: z.string().uuid().optional(),
    tags: z.array(z.string().min(1).max(50)).max(20).optional(),
    metadata: z.record(z.any()).optional()
  }),
  
  // Folder creation
  folderCreate: z.object({
    name: z.string().min(1).max(255),
    description: z.string().max(1000).optional(),
    parentId: z.string().uuid().optional(),
    color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor deve ser um código hexadecimal válido').optional(),
    icon: z.string().max(50).optional()
  }),
  
  // Login
  login: z.object({
    email: z.string().email(),
    password: z.string().min(1),
    rememberMe: z.boolean().default(false)
  }),
  
  // Password reset
  passwordReset: z.object({
    token: z.string().min(1),
    newPassword: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  }),
  
  // Preferences update
  preferencesUpdate: z.object({
    language: z.enum(['pt-PT', 'en-US', 'fr-FR']).optional(),
    timezone: z.string().optional(),
    theme: z.enum(['light', 'dark', 'auto']).optional(),
    notifications: z.object({
      email: z.boolean().optional(),
      push: z.boolean().optional(),
      sms: z.boolean().optional(),
      documentUpdates: z.boolean().optional(),
      workflowUpdates: z.boolean().optional(),
      systemUpdates: z.boolean().optional(),
      securityAlerts: z.boolean().optional()
    }).optional(),
    dashboard: z.object({
      widgets: z.array(z.string()).optional(),
      layout: z.enum(['grid', 'list']).optional(),
      defaultView: z.enum(['recent', 'favorites', 'assigned']).optional(),
      itemsPerPage: z.number().int().min(10).max(100).optional()
    }).optional()
  })
};

/**
 * Validation result interface
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: ValidationErrorDetail[];
}

/**
 * Validation error detail
 */
export interface ValidationErrorDetail {
  field: string;
  message: string;
  code: string;
  value?: any;
}

/**
 * Validator class for handling validation logic
 */
export class Validator {
  /**
   * Validate data against a Zod schema
   */
  public static validate<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult<T> {
    try {
      const result = schema.parse(data);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: ValidationErrorDetail[] = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
          value: err.input
        }));

        return {
          success: false,
          errors
        };
      }

      throw error;
    }
  }

  /**
   * Validate and throw error if validation fails
   */
  public static validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown, context?: Record<string, any>): T {
    const result = this.validate(schema, data);
    
    if (!result.success) {
      const firstError = result.errors![0];
      throw new ValidationError(
        firstError.message,
        firstError.field,
        firstError.value,
        result.errors!.map(e => e.message),
        context
      );
    }

    return result.data!;
  }

  /**
   * Validate email format
   */
  public static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   */
  public static validatePasswordStrength(password: string): { isValid: boolean; score: number; feedback: string[] } {
    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('Senha deve ter pelo menos 8 caracteres');
    }

    if (password.length >= 12) {
      score += 1;
    }

    // Character variety checks
    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Senha deve conter pelo menos uma letra minúscula');
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Senha deve conter pelo menos uma letra maiúscula');
    }

    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('Senha deve conter pelo menos um número');
    }

    if (/[@$!%*?&]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Senha deve conter pelo menos um caractere especial (@$!%*?&)');
    }

    // Common patterns check
    if (!/(.)\1{2,}/.test(password)) {
      score += 1;
    } else {
      feedback.push('Senha não deve conter caracteres repetidos consecutivos');
    }

    return {
      isValid: score >= 4,
      score: Math.min(score, 5),
      feedback
    };
  }

  /**
   * Validate file type
   */
  public static isValidFileType(mimeType: string, allowedTypes: string[]): boolean {
    return allowedTypes.includes(mimeType);
  }

  /**
   * Validate file size
   */
  public static isValidFileSize(size: number, maxSize: number): boolean {
    return size > 0 && size <= maxSize;
  }

  /**
   * Validate UUID format
   */
  public static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Validate phone number
   */
  public static isValidPhoneNumber(phone: string): boolean {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Validate URL format
   */
  public static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate date range
   */
  public static isValidDateRange(startDate: Date, endDate: Date): boolean {
    return startDate <= endDate;
  }

  /**
   * Sanitize string input
   */
  public static sanitizeString(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/\s+/g, ' '); // Normalize whitespace
  }

  /**
   * Validate and sanitize filename
   */
  public static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace invalid characters
      .replace(/_{2,}/g, '_') // Replace multiple underscores
      .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
      .substring(0, 255); // Limit length
  }

  /**
   * Validate Portuguese tax number (NIF)
   */
  public static isValidPortugueseTaxNumber(nif: string): boolean {
    if (!/^\d{9}$/.test(nif)) {
      return false;
    }

    const digits = nif.split('').map(Number);
    const checkDigit = digits[8];
    
    let sum = 0;
    for (let i = 0; i < 8; i++) {
      sum += digits[i] * (9 - i);
    }
    
    const remainder = sum % 11;
    const expectedCheckDigit = remainder < 2 ? 0 : 11 - remainder;
    
    return checkDigit === expectedCheckDigit;
  }

  /**
   * Validate Angolan tax number (NIF)
   */
  public static isValidAngolanTaxNumber(nif: string): boolean {
    // Simplified validation for Angolan NIF
    return /^\d{10}$/.test(nif);
  }

  /**
   * Validate document title
   */
  public static validateDocumentTitle(title: string): { isValid: boolean; sanitized: string; errors: string[] } {
    const errors: string[] = [];
    let sanitized = this.sanitizeString(title);

    if (sanitized.length === 0) {
      errors.push('Título não pode estar vazio');
    }

    if (sanitized.length > 255) {
      errors.push('Título não pode ter mais de 255 caracteres');
      sanitized = sanitized.substring(0, 255);
    }

    // Check for reserved names
    const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
    if (reservedNames.includes(sanitized.toUpperCase())) {
      errors.push('Título não pode ser um nome reservado do sistema');
    }

    return {
      isValid: errors.length === 0,
      sanitized,
      errors
    };
  }

  /**
   * Validate tags array
   */
  public static validateTags(tags: string[]): { isValid: boolean; sanitized: string[]; errors: string[] } {
    const errors: string[] = [];
    const sanitized: string[] = [];

    if (tags.length > 20) {
      errors.push('Não é possível ter mais de 20 tags');
    }

    for (const tag of tags) {
      const sanitizedTag = this.sanitizeString(tag);
      
      if (sanitizedTag.length === 0) {
        errors.push('Tags não podem estar vazias');
        continue;
      }

      if (sanitizedTag.length > 50) {
        errors.push('Tags não podem ter mais de 50 caracteres');
        continue;
      }

      if (!sanitized.includes(sanitizedTag)) {
        sanitized.push(sanitizedTag);
      }
    }

    return {
      isValid: errors.length === 0,
      sanitized,
      errors
    };
  }
}

/**
 * Validation middleware for Express
 */
export function validateRequest(schema: z.ZodSchema) {
  return (req: any, res: any, next: any) => {
    try {
      const result = Validator.validate(schema, req.body);
      
      if (!result.success) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Dados de entrada inválidos',
            details: result.errors
          }
        });
      }

      req.validatedData = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Validation middleware for query parameters
 */
export function validateQuery(schema: z.ZodSchema) {
  return (req: any, res: any, next: any) => {
    try {
      const result = Validator.validate(schema, req.query);
      
      if (!result.success) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Parâmetros de consulta inválidos',
            details: result.errors
          }
        });
      }

      req.validatedQuery = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Validation middleware for URL parameters
 */
export function validateParams(schema: z.ZodSchema) {
  return (req: any, res: any, next: any) => {
    try {
      const result = Validator.validate(schema, req.params);
      
      if (!result.success) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Parâmetros de URL inválidos',
            details: result.errors
          }
        });
      }

      req.validatedParams = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
}