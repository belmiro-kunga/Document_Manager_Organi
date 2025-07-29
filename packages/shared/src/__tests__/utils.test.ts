// Tests for utility functions
// Testes para funções utilitárias

import {
  generateId,
  isValidEmail,
  isValidPassword,
  isValidUUID,
  formatDate,
  formatFileSize,
  slugify,
  truncateText,
  capitalizeWords,
  generateRandomString,
  deepClone,
  isEmpty,
  getFileExtension,
  getMimeTypeFromExtension,
  calculateChecksum,
  parseUserAgent,
} from '../utils';

describe('Utility Functions', () => {
  describe('generateId', () => {
    it('should generate a valid UUID v4', () => {
      const id = generateId();
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.org')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('isValidPassword', () => {
    it('should validate strong passwords', () => {
      expect(isValidPassword('StrongP@ss123')).toBe(true);
      expect(isValidPassword('MySecure!Pass1')).toBe(true);
    });

    it('should reject weak passwords', () => {
      expect(isValidPassword('weak')).toBe(false);
      expect(isValidPassword('nouppercaseorspecial123')).toBe(false);
      expect(isValidPassword('NOLOWERCASEORSPECIAL123')).toBe(false);
      expect(isValidPassword('NoNumbers@')).toBe(false);
    });
  });

  describe('isValidUUID', () => {
    it('should validate correct UUIDs', () => {
      expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });

    it('should reject invalid UUIDs', () => {
      expect(isValidUUID('invalid-uuid')).toBe(false);
      expect(isValidUUID('123e4567-e89b-12d3-a456')).toBe(false);
      expect(isValidUUID('')).toBe(false);
    });
  });

  describe('formatDate', () => {
    const testDate = new Date('2023-12-25T10:30:00Z');

    it('should format date for Portuguese locale', () => {
      const formatted = formatDate(testDate, 'pt-PT');
      expect(formatted).toBe('25/12/2023');
    });

    it('should format date for English locale', () => {
      const formatted = formatDate(testDate, 'en-US');
      expect(formatted).toBe('12/25/2023');
    });

    it('should format date for French locale', () => {
      const formatted = formatDate(testDate, 'fr-FR');
      expect(formatted).toBe('25/12/2023');
    });

    it('should handle string dates', () => {
      const formatted = formatDate('2023-12-25T10:30:00Z', 'pt-PT');
      expect(formatted).toBe('25/12/2023');
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(1024)).toBe('1.00 KB');
      expect(formatFileSize(1048576)).toBe('1.00 MB');
      expect(formatFileSize(1073741824)).toBe('1.00 GB');
    });

    it('should format for different languages', () => {
      expect(formatFileSize(1024, 'fr-FR')).toBe('1.00 Ko');
      expect(formatFileSize(1048576, 'fr-FR')).toBe('1.00 Mo');
    });
  });

  describe('slugify', () => {
    it('should create valid slugs', () => {
      expect(slugify('Hello World')).toBe('hello-world');
      expect(slugify('Test Document 123')).toBe('test-document-123');
      expect(slugify('Special!@#$%Characters')).toBe('specialcharacters');
    });

    it('should handle Portuguese characters', () => {
      expect(slugify('Documentação Técnica')).toBe('documentao-tcnica');
      expect(slugify('Relatório Mensal')).toBe('relatrio-mensal');
    });
  });

  describe('truncateText', () => {
    it('should truncate long text', () => {
      const longText = 'This is a very long text that should be truncated';
      expect(truncateText(longText, 20)).toBe('This is a very lo...');
    });

    it('should not truncate short text', () => {
      const shortText = 'Short text';
      expect(truncateText(shortText, 20)).toBe('Short text');
    });

    it('should use custom suffix', () => {
      const text = 'This is a long text';
      expect(truncateText(text, 10, '---')).toBe('This is---');
    });
  });

  describe('capitalizeWords', () => {
    it('should capitalize each word', () => {
      expect(capitalizeWords('hello world')).toBe('Hello World');
      expect(capitalizeWords('UPPERCASE TEXT')).toBe('Uppercase Text');
      expect(capitalizeWords('mixed CaSe TeXt')).toBe('Mixed Case Text');
    });
  });

  describe('generateRandomString', () => {
    it('should generate string of correct length', () => {
      expect(generateRandomString(10)).toHaveLength(10);
      expect(generateRandomString(20)).toHaveLength(20);
    });

    it('should generate different strings', () => {
      const str1 = generateRandomString(10);
      const str2 = generateRandomString(10);
      expect(str1).not.toBe(str2);
    });
  });

  describe('deepClone', () => {
    it('should clone primitive values', () => {
      expect(deepClone(42)).toBe(42);
      expect(deepClone('hello')).toBe('hello');
      expect(deepClone(true)).toBe(true);
      expect(deepClone(null)).toBe(null);
    });

    it('should clone arrays', () => {
      const original = [1, 2, { a: 3 }];
      const cloned = deepClone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned[2]).not.toBe(original[2]);
    });

    it('should clone objects', () => {
      const original = { a: 1, b: { c: 2 } };
      const cloned = deepClone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.b).not.toBe(original.b);
    });

    it('should clone dates', () => {
      const original = new Date('2023-01-01');
      const cloned = deepClone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
    });
  });

  describe('isEmpty', () => {
    it('should detect empty values', () => {
      expect(isEmpty(null)).toBe(true);
      expect(isEmpty(undefined)).toBe(true);
      expect(isEmpty('')).toBe(true);
      expect(isEmpty([])).toBe(true);
      expect(isEmpty({})).toBe(true);
    });

    it('should detect non-empty values', () => {
      expect(isEmpty('hello')).toBe(false);
      expect(isEmpty([1, 2, 3])).toBe(false);
      expect(isEmpty({ a: 1 })).toBe(false);
      expect(isEmpty(0)).toBe(false);
      expect(isEmpty(false)).toBe(false);
    });
  });

  describe('getFileExtension', () => {
    it('should extract file extensions', () => {
      expect(getFileExtension('document.pdf')).toBe('pdf');
      expect(getFileExtension('image.jpg')).toBe('jpg');
      expect(getFileExtension('archive.tar.gz')).toBe('gz');
    });

    it('should handle files without extensions', () => {
      expect(getFileExtension('filename')).toBe('');
    });
  });

  describe('getMimeTypeFromExtension', () => {
    it('should return correct MIME types', () => {
      expect(getMimeTypeFromExtension('pdf')).toBe('application/pdf');
      expect(getMimeTypeFromExtension('jpg')).toBe('image/jpeg');
      expect(getMimeTypeFromExtension('png')).toBe('image/png');
    });

    it('should return default for unknown extensions', () => {
      expect(getMimeTypeFromExtension('unknown')).toBe('application/octet-stream');
    });
  });

  describe('calculateChecksum', () => {
    it('should calculate consistent checksums', () => {
      const content = 'test content';
      const checksum1 = calculateChecksum(content);
      const checksum2 = calculateChecksum(content);
      
      expect(checksum1).toBe(checksum2);
      expect(checksum1).toMatch(/^[0-9a-f]+$/);
    });

    it('should handle Buffer input', () => {
      const buffer = Buffer.from('test content');
      const checksum = calculateChecksum(buffer);
      
      expect(checksum).toMatch(/^[0-9a-f]+$/);
    });
  });

  describe('parseUserAgent', () => {
    it('should parse Chrome user agent', () => {
      const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
      const parsed = parseUserAgent(ua);
      
      expect(parsed.browser).toBe('Chrome');
      expect(parsed.os).toBe('Windows');
      expect(parsed.version).toBe('91.0');
    });

    it('should parse Firefox user agent', () => {
      const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0';
      const parsed = parseUserAgent(ua);
      
      expect(parsed.browser).toBe('Firefox');
      expect(parsed.os).toBe('Windows');
      expect(parsed.version).toBe('89.0');
    });

    it('should handle unknown user agents', () => {
      const ua = 'Unknown Browser/1.0';
      const parsed = parseUserAgent(ua);
      
      expect(parsed.browser).toBe('Unknown');
      expect(parsed.os).toBe('Unknown');
      expect(parsed.version).toBe('Unknown');
    });
  });
});