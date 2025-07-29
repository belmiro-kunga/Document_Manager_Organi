// Tests for validation utilities
// Testes para utilitários de validação

import { z } from 'zod';
import {
  ValidationSchemas,
  Validator,
  validateRequest,
  validateQuery,
  validateParams
} from '../utils/validation';
import { ValidationError } from '../errors/base-error';
import { UserRole, DocumentType } from '../types/common';

describe('Validation', () => {
  describe('ValidationSchemas', () => {
    test('should validate ID schema', () => {
      const validUUID = '123e4567-e89b-12d3-a456-426614174000';
      const invalidUUID = 'invalid-uuid';

      expect(ValidationSchemas.id.parse(validUUID)).toBe(validUUID);
      expect(() => ValidationSchemas.id.parse(invalidUUID)).toThrow();
    });

    test('should validate email schema', () => {
      const validEmail = 'test@example.com';
      const invalidEmail = 'invalid-email';

      expect(ValidationSchemas.email.parse(validEmail)).toBe(validEmail);
      expect(() => ValidationSchemas.email.parse(invalidEmail)).toThrow();
    });

    test('should validate password schema', () => {
      const validPassword = 'Password123!';
      const weakPassword = '123';

      expect(ValidationSchemas.password.parse(validPassword)).toBe(validPassword);
      expect(() => ValidationSchemas.password.parse(weakPassword)).toThrow();
    });

    test('should validate language schema', () => {
      expect(ValidationSchemas.language.parse('pt-PT')).toBe('pt-PT');
      expect(ValidationSchemas.language.parse('en-US')).toBe('en-US');
      expect(ValidationSchemas.language.parse('fr-FR')).toBe('fr-FR');
      expect(() => ValidationSchemas.language.parse('es-ES')).toThrow();
    });

    test('should validate user role schema', () => {
      expect(ValidationSchemas.userRole.parse(UserRole.ADMIN)).toBe(UserRole.ADMIN);
      expect(ValidationSchemas.userRole.parse('admin')).toBe('admin');
      expect(() => ValidationSchemas.userRole.parse('invalid-role')).toThrow();
    });

    test('should validate pagination schema', () => {
      const validPagination = { page: 1, limit: 20 };
      const result = ValidationSchemas.pagination.parse(validPagination);

      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);

      // Test defaults
      const defaultResult = ValidationSchemas.pagination.parse({});
      expect(defaultResult.page).toBe(1);
      expect(defaultResult.limit).toBe(20);

      // Test invalid values
      expect(() => ValidationSchemas.pagination.parse({ page: 0 })).toThrow();
      expect(() => ValidationSchemas.pagination.parse({ limit: 101 })).toThrow();
    });

    test('should validate file upload schema', () => {
      const validFile = {
        filename: 'document.pdf',
        mimeType: 'application/pdf',
        size: 1024000
      };

      const result = ValidationSchemas.fileUpload.parse(validFile);
      expect(result.filename).toBe('document.pdf');
      expect(result.mimeType).toBe('application/pdf');
      expect(result.size).toBe(1024000);

      // Test size limit
      expect(() => ValidationSchemas.fileUpload.parse({
        ...validFile,
        size: 200 * 1024 * 1024 // 200MB - exceeds 100MB limit
      })).toThrow();
    });

    test('should validate user creation schema', () => {
      const validUser = {
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        password: 'Password123!',
        role: UserRole.USER,
        language: 'pt-PT' as const,
        phone: '+351912345678'
      };

      const result = ValidationSchemas.userCreate.parse(validUser);
      expect(result.email).toBe('test@example.com');
      expect(result.role).toBe(UserRole.USER);
      expect(result.language).toBe('pt-PT');

      // Test defaults
      const minimalUser = {
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        password: 'Password123!'
      };

      const minimalResult = ValidationSchemas.userCreate.parse(minimalUser);
      expect(minimalResult.role).toBe(UserRole.USER);
      expect(minimalResult.language).toBe('pt-PT');
    });

    test('should validate document creation schema', () => {
      const validDocument = {
        title: 'Test Document',
        description: 'A test document',
        type: DocumentType.PDF,
        tags: ['test', 'document'],
        metadata: { author: 'Test Author' }
      };

      const result = ValidationSchemas.documentCreate.parse(validDocument);
      expect(result.title).toBe('Test Document');
      expect(result.type).toBe(DocumentType.PDF);
      expect(result.tags).toEqual(['test', 'document']);

      // Test defaults
      const minimalDocument = {
        title: 'Test Document',
        type: DocumentType.PDF
      };

      const minimalResult = ValidationSchemas.documentCreate.parse(minimalDocument);
      expect(minimalResult.tags).toEqual([]);
    });

    test('should validate login schema', () => {
      const validLogin = {
        email: 'test@example.com',
        password: 'password123',
        rememberMe: true
      };

      const result = ValidationSchemas.login.parse(validLogin);
      expect(result.email).toBe('test@example.com');
      expect(result.rememberMe).toBe(true);

      // Test defaults
      const minimalLogin = {
        email: 'test@example.com',
        password: 'password123'
      };

      const minimalResult = ValidationSchemas.login.parse(minimalLogin);
      expect(minimalResult.rememberMe).toBe(false);
    });
  });

  describe('Validator', () => {
    test('should validate data successfully', () => {
      const schema = z.object({
        name: z.string().min(1),
        age: z.number().min(0)
      });

      const validData = { name: 'John', age: 30 };
      const result = Validator.validate(schema, validData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(validData);
      expect(result.errors).toBeUndefined();
    });

    test('should return validation errors', () => {
      const schema = z.object({
        name: z.string().min(1),
        age: z.number().min(0)
      });

      const invalidData = { name: '', age: -1 };
      const result = Validator.validate(schema, invalidData);

      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.errors).toHaveLength(2);
      expect(result.errors?.[0]?.field).toBe('name');
      expect(result.errors?.[1]?.field).toBe('age');
    });

    test('should validate and throw error', () => {
      const schema = z.object({
        email: z.string().email()
      });

      const validData = { email: 'test@example.com' };
      const result = Validator.validateOrThrow(schema, validData);
      expect(result.email).toBe('test@example.com');

      const invalidData = { email: 'invalid-email' };
      expect(() => Validator.validateOrThrow(schema, invalidData)).toThrow(ValidationError);
    });

    test('should validate email format', () => {
      expect(Validator.isValidEmail('test@example.com')).toBe(true);
      expect(Validator.isValidEmail('user.name+tag@domain.co.uk')).toBe(true);
      expect(Validator.isValidEmail('invalid-email')).toBe(false);
      expect(Validator.isValidEmail('test@')).toBe(false);
      expect(Validator.isValidEmail('@example.com')).toBe(false);
    });

    test('should validate password strength', () => {
      const strongPassword = 'StrongPass123!';
      const result = Validator.validatePasswordStrength(strongPassword);

      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(4);
      expect(result.feedback).toHaveLength(0);

      const weakPassword = '123';
      const weakResult = Validator.validatePasswordStrength(weakPassword);

      expect(weakResult.isValid).toBe(false);
      expect(weakResult.score).toBeLessThan(4);
      expect(weakResult.feedback.length).toBeGreaterThan(0);
    });

    test('should validate file type', () => {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];

      expect(Validator.isValidFileType('application/pdf', allowedTypes)).toBe(true);
      expect(Validator.isValidFileType('image/jpeg', allowedTypes)).toBe(true);
      expect(Validator.isValidFileType('text/plain', allowedTypes)).toBe(false);
    });

    test('should validate file size', () => {
      const maxSize = 10 * 1024 * 1024; // 10MB

      expect(Validator.isValidFileSize(5 * 1024 * 1024, maxSize)).toBe(true);
      expect(Validator.isValidFileSize(15 * 1024 * 1024, maxSize)).toBe(false);
      expect(Validator.isValidFileSize(0, maxSize)).toBe(false);
    });

    test('should validate UUID format', () => {
      expect(Validator.isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
      expect(Validator.isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(Validator.isValidUUID('invalid-uuid')).toBe(false);
      expect(Validator.isValidUUID('123e4567-e89b-12d3-a456-42661417400')).toBe(false);
    });

    test('should validate phone number', () => {
      expect(Validator.isValidPhoneNumber('+351912345678')).toBe(true);
      expect(Validator.isValidPhoneNumber('912345678')).toBe(true);
      expect(Validator.isValidPhoneNumber('+1234567890123456')).toBe(false); // Too long
      expect(Validator.isValidPhoneNumber('123')).toBe(false); // Too short
      expect(Validator.isValidPhoneNumber('+0123456789')).toBe(false); // Starts with 0
    });

    test('should validate URL format', () => {
      expect(Validator.isValidUrl('https://example.com')).toBe(true);
      expect(Validator.isValidUrl('http://localhost:3000')).toBe(true);
      expect(Validator.isValidUrl('ftp://files.example.com')).toBe(true);
      expect(Validator.isValidUrl('invalid-url')).toBe(false);
      expect(Validator.isValidUrl('http://')).toBe(false);
    });

    test('should validate date range', () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-12-31');
      const invalidEndDate = new Date('2022-12-31');

      expect(Validator.isValidDateRange(startDate, endDate)).toBe(true);
      expect(Validator.isValidDateRange(startDate, startDate)).toBe(true); // Same date
      expect(Validator.isValidDateRange(startDate, invalidEndDate)).toBe(false);
    });

    test('should sanitize string input', () => {
      expect(Validator.sanitizeString('  hello world  ')).toBe('hello world');
      expect(Validator.sanitizeString('hello<script>alert("xss")</script>world')).toBe('helloworldalert("xss")world');
      expect(Validator.sanitizeString('hello\n\n\nworld')).toBe('hello world');
    });

    test('should sanitize filename', () => {
      expect(Validator.sanitizeFilename('document.pdf')).toBe('document.pdf');
      expect(Validator.sanitizeFilename('my document (1).pdf')).toBe('my_document__1_.pdf');
      expect(Validator.sanitizeFilename('___test___')).toBe('test');
      expect(Validator.sanitizeFilename('a'.repeat(300))).toHaveLength(255);
    });

    test('should validate Portuguese tax number', () => {
      expect(Validator.isValidPortugueseTaxNumber('123456789')).toBe(false); // Invalid checksum
      expect(Validator.isValidPortugueseTaxNumber('12345678')).toBe(false); // Too short
      expect(Validator.isValidPortugueseTaxNumber('1234567890')).toBe(false); // Too long
      expect(Validator.isValidPortugueseTaxNumber('abcdefghi')).toBe(false); // Non-numeric
    });

    test('should validate Angolan tax number', () => {
      expect(Validator.isValidAngolanTaxNumber('1234567890')).toBe(true);
      expect(Validator.isValidAngolanTaxNumber('123456789')).toBe(false); // Too short
      expect(Validator.isValidAngolanTaxNumber('12345678901')).toBe(false); // Too long
      expect(Validator.isValidAngolanTaxNumber('abcdefghij')).toBe(false); // Non-numeric
    });

    test('should validate document title', () => {
      const validTitle = 'My Document';
      const result = Validator.validateDocumentTitle(validTitle);

      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('My Document');
      expect(result.errors).toHaveLength(0);

      const emptyTitle = '   ';
      const emptyResult = Validator.validateDocumentTitle(emptyTitle);

      expect(emptyResult.isValid).toBe(false);
      expect(emptyResult.errors).toContain('Título não pode estar vazio');

      const longTitle = 'a'.repeat(300);
      const longResult = Validator.validateDocumentTitle(longTitle);

      expect(longResult.isValid).toBe(false);
      expect(longResult.sanitized).toHaveLength(255);
      expect(longResult.errors).toContain('Título não pode ter mais de 255 caracteres');

      const reservedTitle = 'CON';
      const reservedResult = Validator.validateDocumentTitle(reservedTitle);

      expect(reservedResult.isValid).toBe(false);
      expect(reservedResult.errors).toContain('Título não pode ser um nome reservado do sistema');
    });

    test('should validate tags array', () => {
      const validTags = ['tag1', 'tag2', 'tag3'];
      const result = Validator.validateTags(validTags);

      expect(result.isValid).toBe(true);
      expect(result.sanitized).toEqual(['tag1', 'tag2', 'tag3']);
      expect(result.errors).toHaveLength(0);

      const tooManyTags = Array.from({ length: 25 }, (_, i) => `tag${i}`);
      const tooManyResult = Validator.validateTags(tooManyTags);

      expect(tooManyResult.isValid).toBe(false);
      expect(tooManyResult.errors).toContain('Não é possível ter mais de 20 tags');

      const emptyTags = ['tag1', '', 'tag2'];
      const emptyResult = Validator.validateTags(emptyTags);

      expect(emptyResult.isValid).toBe(false);
      expect(emptyResult.errors).toContain('Tags não podem estar vazias');

      const longTags = ['tag1', 'a'.repeat(60), 'tag2'];
      const longResult = Validator.validateTags(longTags);

      expect(longResult.isValid).toBe(false);
      expect(longResult.errors).toContain('Tags não podem ter mais de 50 caracteres');

      const duplicateTags = ['tag1', 'tag2', 'tag1'];
      const duplicateResult = Validator.validateTags(duplicateTags);

      expect(duplicateResult.isValid).toBe(true);
      expect(duplicateResult.sanitized).toEqual(['tag1', 'tag2']); // Duplicates removed
    });
  });

  describe('Express Middleware', () => {
    test('should validate request body', () => {
      const schema = z.object({
        name: z.string().min(1),
        email: z.string().email()
      });

      const middleware = validateRequest(schema);

      const mockReq: any = {
        body: { name: 'John', email: 'john@example.com' }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();

      middleware(mockReq, mockRes, mockNext);

      expect(mockReq.validatedData).toEqual({ name: 'John', email: 'john@example.com' });
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('should return validation error for invalid request body', () => {
      const schema = z.object({
        name: z.string().min(1),
        email: z.string().email()
      });

      const middleware = validateRequest(schema);

      const mockReq: any = {
        body: { name: '', email: 'invalid-email' }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();

      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Dados de entrada inválidos',
          details: expect.any(Array)
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should validate query parameters', () => {
      const schema = z.object({
        page: z.coerce.number().min(1),
        limit: z.coerce.number().min(1).max(100)
      });

      const middleware = validateQuery(schema);

      const mockReq: any = {
        query: { page: '1', limit: '20' }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();

      middleware(mockReq, mockRes, mockNext);

      expect(mockReq.validatedQuery).toEqual({ page: 1, limit: 20 });
      expect(mockNext).toHaveBeenCalled();
    });

    test('should validate URL parameters', () => {
      const schema = z.object({
        id: z.string().uuid()
      });

      const middleware = validateParams(schema);

      const mockReq: any = {
        params: { id: '123e4567-e89b-12d3-a456-426614174000' }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();

      middleware(mockReq, mockRes, mockNext);

      expect(mockReq.validatedParams).toEqual({ id: '123e4567-e89b-12d3-a456-426614174000' });
      expect(mockNext).toHaveBeenCalled();
    });

    test('should handle middleware errors', () => {
      const schema = z.object({
        name: z.string()
      });

      const middleware = validateRequest(schema);

      // Mock Validator.validate to throw an error
      const originalValidate = Validator.validate;
      Validator.validate = jest.fn().mockImplementation(() => {
        throw new Error('Validation error');
      });

      const mockReq: any = { body: { name: 'test' } };
      const mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const mockNext = jest.fn();

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));

      // Restore original method
      Validator.validate = originalValidate;
    });
  });
});