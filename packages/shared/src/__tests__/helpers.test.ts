// Tests for helper utilities
// Testes para utilitários auxiliares

import * as crypto from 'crypto';
import {
  generateUUID,
  generateRandomString,
  generateSecureToken,
  hashPassword,
  verifyPassword,
  calculateChecksum,
  calculateMD5,
  formatFileSize,
  parseFileSize,
  getDocumentTypeFromMimeType,
  getFileExtension,
  getFilenameWithoutExtension,
  sanitizeFilename,
  generateUniqueFilename,
  deepClone,
  deepMerge,
  isObject,
  debounce,
  throttle,
  retry,
  sleep,
  formatDate,
  formatDateTime,
  formatRelativeTime,
  truncateText,
  capitalizeWords,
  slugify,
  getInitials,
  generateColorFromString,
  isValidJSON,
  safeJSONParse,
  bytesToBase64,
  base64ToBytes,
  maskEmail,
  maskPhoneNumber,
  generatePaginationMeta,
  chunk,
  unique,
  groupBy,
  sortBy
} from '../utils/helpers';
import { DocumentType } from '../types/common';

// Mock crypto.randomUUID for consistent testing
jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomUUID: jest.fn(() => '123e4567-e89b-12d3-a456-426614174000')
}));

describe('Helper Utilities', () => {
  describe('UUID and Random Generation', () => {
    test('should generate UUID', () => {
      const uuid = generateUUID();
      expect(uuid).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(crypto.randomUUID).toHaveBeenCalled();
    });

    test('should generate random string', () => {
      const randomStr = generateRandomString(10);
      expect(randomStr).toHaveLength(10);
      expect(typeof randomStr).toBe('string');

      const customCharset = generateRandomString(5, 'ABC');
      expect(customCharset).toHaveLength(5);
      expect(/^[ABC]+$/.test(customCharset)).toBe(true);
    });

    test('should generate secure token', () => {
      const token = generateSecureToken(16);
      expect(token).toHaveLength(32); // 16 bytes = 32 hex chars
      expect(/^[0-9a-f]+$/.test(token)).toBe(true);
    });
  });

  describe('Password Hashing', () => {
    test('should hash and verify password', () => {
      const password = 'testPassword123';
      const hash = hashPassword(password);

      expect(hash).toContain(':');
      expect(hash.split(':').length).toBe(2);

      expect(verifyPassword(password, hash)).toBe(true);
      expect(verifyPassword('wrongPassword', hash)).toBe(false);
    });
  });

  describe('Checksum and Hashing', () => {
    test('should calculate checksum', () => {
      const buffer = Buffer.from('test data');
      const checksum = calculateChecksum(buffer);

      expect(checksum).toHaveLength(64); // SHA-256 produces 64 hex chars
      expect(/^[0-9a-f]+$/.test(checksum)).toBe(true);
    });

    test('should calculate MD5', () => {
      const data = 'test data';
      const md5 = calculateMD5(data);

      expect(md5).toHaveLength(32); // MD5 produces 32 hex chars
      expect(/^[0-9a-f]+$/.test(md5)).toBe(true);
    });
  });

  describe('File Size Utilities', () => {
    test('should format file size', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });

    test('should parse file size', () => {
      expect(parseFileSize('1024B')).toBe(1024);
      expect(parseFileSize('1KB')).toBe(1024);
      expect(parseFileSize('1MB')).toBe(1024 * 1024);
      expect(parseFileSize('1GB')).toBe(1024 * 1024 * 1024);
      expect(parseFileSize('1.5MB')).toBe(1.5 * 1024 * 1024);

      expect(() => parseFileSize('invalid')).toThrow('Invalid file size format');
    });
  });

  describe('File Utilities', () => {
    test('should get document type from MIME type', () => {
      expect(getDocumentTypeFromMimeType('application/pdf')).toBe(DocumentType.PDF);
      expect(getDocumentTypeFromMimeType('image/jpeg')).toBe(DocumentType.IMAGE);
      expect(getDocumentTypeFromMimeType('text/plain')).toBe(DocumentType.TEXT);
      expect(getDocumentTypeFromMimeType('unknown/type')).toBe(DocumentType.OTHER);
    });

    test('should get file extension', () => {
      expect(getFileExtension('document.pdf')).toBe('pdf');
      expect(getFileExtension('image.JPEG')).toBe('jpeg');
      expect(getFileExtension('file')).toBe('');
      expect(getFileExtension('archive.tar.gz')).toBe('gz');
    });

    test('should get filename without extension', () => {
      expect(getFilenameWithoutExtension('document.pdf')).toBe('document');
      expect(getFilenameWithoutExtension('path/to/file.txt')).toBe('file');
      expect(getFilenameWithoutExtension('noextension')).toBe('noextension');
    });

    test('should sanitize filename', () => {
      expect(sanitizeFilename('document.pdf')).toBe('document.pdf');
      expect(sanitizeFilename('my document (1).pdf')).toBe('my_document__1_.pdf');
      expect(sanitizeFilename('___test___')).toBe('test');
      expect(sanitizeFilename('a'.repeat(300))).toHaveLength(255);
    });

    test('should generate unique filename', () => {
      const original = 'document.pdf';
      const unique = generateUniqueFilename(original);

      expect(unique).toContain('document_');
      expect(unique).toContain('.pdf');
      expect(unique.length).toBeGreaterThan(original.length);
    });
  });

  describe('Object Utilities', () => {
    test('should deep clone objects', () => {
      const original = {
        name: 'test',
        nested: { value: 42 },
        array: [1, 2, { nested: true }],
        date: new Date('2023-01-01')
      };

      const cloned = deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.nested).not.toBe(original.nested);
      expect(cloned.array).not.toBe(original.array);
      expect(cloned.date).not.toBe(original.date);
      expect(cloned.date).toBeInstanceOf(Date);
    });

    test('should deep merge objects', () => {
      const target = {
        a: 1,
        b: { x: 1, y: 2 },
        c: [1, 2]
      };

      const source = {
        b: { x: 1, y: 3, z: 4 },
        d: 4
      } as any;

      const merged = deepMerge(target, source);

      expect(merged).toEqual({
        a: 1,
        b: { x: 1, y: 3, z: 4 },
        c: [1, 2],
        d: 4
      });
    });

    test('should check if value is object', () => {
      expect(isObject({})).toBe(true);
      expect(isObject({ key: 'value' })).toBe(true);
      expect(isObject([])).toBe(false);
      expect(isObject(null)).toBe(false);
      expect(isObject('string')).toBe(false);
      expect(isObject(42)).toBe(false);
    });
  });

  describe('Function Utilities', () => {
    test('should debounce function calls', (done) => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('call1');
      debouncedFn('call2');
      debouncedFn('call3');

      expect(mockFn).not.toHaveBeenCalled();

      setTimeout(() => {
        expect(mockFn).toHaveBeenCalledTimes(1);
        expect(mockFn).toHaveBeenCalledWith('call3');
        done();
      }, 150);
    });

    test('should throttle function calls', (done) => {
      const mockFn = jest.fn();
      const throttledFn = throttle(mockFn, 100);

      throttledFn('call1');
      throttledFn('call2');
      throttledFn('call3');

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('call1');

      setTimeout(() => {
        throttledFn('call4');
        expect(mockFn).toHaveBeenCalledTimes(2);
        expect(mockFn).toHaveBeenCalledWith('call4');
        done();
      }, 150);
    });

    test('should retry function with exponential backoff', async () => {
      let attempts = 0;
      const mockFn = jest.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return 'success';
      });

      const result = await retry(mockFn, 3, 10); // Short delay for testing

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    test('should fail after max retry attempts', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Persistent failure'));

      await expect(retry(mockFn, 2, 10)).rejects.toThrow('Persistent failure');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    test('should sleep for specified time', async () => {
      const start = Date.now();
      await sleep(50);
      const end = Date.now();

      expect(end - start).toBeGreaterThanOrEqual(45); // Allow some variance
    });
  });

  describe('Date Formatting', () => {
    const testDate = new Date('2023-06-15T14:30:00Z');

    test('should format date', () => {
      const formatted = formatDate(testDate, 'en-US');
      expect(formatted).toContain('June');
      expect(formatted).toContain('15');
      expect(formatted).toContain('2023');
    });

    test('should format date and time', () => {
      const formatted = formatDateTime(testDate, 'en-US');
      expect(formatted).toContain('June');
      expect(formatted).toContain('15');
      expect(formatted).toContain('2023');
      expect(formatted).toMatch(/\d{2}:\d{2}/); // Time format
    });

    test('should format relative time', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      expect(formatRelativeTime(oneHourAgo, 'en-US')).toContain('hour ago');
      expect(formatRelativeTime(oneDayAgo, 'en-US')).toContain('day ago');

      expect(formatRelativeTime(oneHourAgo, 'pt-PT')).toContain('há');
      expect(formatRelativeTime(oneDayAgo, 'pt-PT')).toContain('há');
    });
  });

  describe('String Utilities', () => {
    test('should truncate text', () => {
      const longText = 'This is a very long text that should be truncated';
      expect(truncateText(longText, 20)).toBe('This is a very lo...');
      expect(truncateText(longText, 20, '---')).toBe('This is a very l---');
      expect(truncateText('Short', 20)).toBe('Short');
    });

    test('should capitalize words', () => {
      expect(capitalizeWords('hello world')).toBe('Hello World');
      expect(capitalizeWords('HELLO WORLD')).toBe('HELLO WORLD');
      expect(capitalizeWords('hello-world')).toBe('Hello-World');
    });

    test('should create slug', () => {
      expect(slugify('Hello World')).toBe('hello-world');
      expect(slugify('Olá Mundo!')).toBe('ola-mundo');
      expect(slugify('  Multiple   Spaces  ')).toBe('multiple-spaces');
      expect(slugify('Special@#$Characters')).toBe('specialcharacters');
    });

    test('should get initials', () => {
      expect(getInitials('John Doe')).toBe('JD');
      expect(getInitials('Mary Jane Watson')).toBe('MJ');
      expect(getInitials('SingleName')).toBe('S');
      expect(getInitials('')).toBe('');
    });

    test('should generate color from string', () => {
      const color1 = generateColorFromString('test');
      const color2 = generateColorFromString('test');
      const color3 = generateColorFromString('different');

      expect(color1).toBe(color2); // Same input, same color
      expect(color1).not.toBe(color3); // Different input, different color
      expect(color1).toMatch(/^hsl\(\d+, 70%, 50%\)$/);
    });
  });

  describe('JSON Utilities', () => {
    test('should check valid JSON', () => {
      expect(isValidJSON('{"key": "value"}')).toBe(true);
      expect(isValidJSON('[1, 2, 3]')).toBe(true);
      expect(isValidJSON('invalid json')).toBe(false);
      expect(isValidJSON('{"key": value}')).toBe(false); // Missing quotes
    });

    test('should safely parse JSON', () => {
      const defaultValue = { default: true };

      expect(safeJSONParse('{"key": "value"}', defaultValue)).toEqual({ key: 'value' });
      expect(safeJSONParse('invalid json', defaultValue)).toBe(defaultValue);
    });
  });

  describe('Base64 Utilities', () => {
    test('should convert bytes to base64 and back', () => {
      const originalBytes = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
      const base64 = bytesToBase64(originalBytes);
      const convertedBytes = base64ToBytes(base64);

      expect(base64).toBe('SGVsbG8=');
      expect(convertedBytes).toEqual(originalBytes);
    });
  });

  describe('Masking Utilities', () => {
    test('should mask email', () => {
      expect(maskEmail('test@example.com')).toBe('te**@example.com');
      expect(maskEmail('a@example.com')).toBe('a*@example.com');
      expect(maskEmail('ab@example.com')).toBe('ab@example.com');
    });

    test('should mask phone number', () => {
      expect(maskPhoneNumber('1234567890')).toBe('******7890');
      expect(maskPhoneNumber('123')).toBe('***');
      expect(maskPhoneNumber('1234')).toBe('1234');
    });
  });

  describe('Pagination Utilities', () => {
    test('should generate pagination metadata', () => {
      const meta = generatePaginationMeta(2, 10, 25);

      expect(meta).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
        hasNext: true,
        hasPrev: true,
        offset: 10
      });

      const firstPage = generatePaginationMeta(1, 10, 25);
      expect(firstPage.hasPrev).toBe(false);

      const lastPage = generatePaginationMeta(3, 10, 25);
      expect(lastPage.hasNext).toBe(false);
    });
  });

  describe('Array Utilities', () => {
    test('should chunk array', () => {
      const array = [1, 2, 3, 4, 5, 6, 7];
      const chunks = chunk(array, 3);

      expect(chunks).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
      expect(chunk([], 3)).toEqual([]);
    });

    test('should remove duplicates', () => {
      expect(unique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
      expect(unique(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c']);
      expect(unique([])).toEqual([]);
    });

    test('should group by key', () => {
      const array = [
        { category: 'A', value: 1 },
        { category: 'B', value: 2 },
        { category: 'A', value: 3 }
      ];

      const grouped = groupBy(array, 'category');

      expect(grouped).toEqual({
        A: [{ category: 'A', value: 1 }, { category: 'A', value: 3 }],
        B: [{ category: 'B', value: 2 }]
      });
    });

    test('should sort by multiple keys', () => {
      const array = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
        { name: 'John', age: 20 }
      ];

      const sorted = sortBy(array, 'name', 'age');

      expect(sorted).toEqual([
        { name: 'Jane', age: 25 },
        { name: 'John', age: 20 },
        { name: 'John', age: 30 }
      ]);
    });
  });
});