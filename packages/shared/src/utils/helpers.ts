// General helper utilities for Advanced DMS
// Utilitários auxiliares gerais para o DMS Avançado

import * as crypto from 'crypto';
import * as path from 'path';
import { SupportedLanguage, DocumentType, MIME_TYPES } from '../types/common';

/**
 * Generate a random UUID v4
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Generate a random string of specified length
 */
export function generateRandomString(length: number = 32, charset: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
}

/**
 * Generate a secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash a password using bcrypt-compatible method
 */
export function hashPassword(password: string, saltRounds: number = 12): string {
  // In a real implementation, this would use bcrypt
  // For now, using a simple hash for demonstration
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify a password against a hash
 */
export function verifyPassword(password: string, hash: string): boolean {
  const [salt, storedHash] = hash.split(':');
  const computedHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return storedHash === computedHash;
}

/**
 * Calculate file checksum (SHA-256)
 */
export function calculateChecksum(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Calculate MD5 hash
 */
export function calculateMD5(data: string | Buffer): string {
  return crypto.createHash('md5').update(data).digest('hex');
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Parse file size string to bytes
 */
export function parseFileSize(sizeStr: string): number {
  const units: Record<string, number> = {
    'B': 1,
    'KB': 1024,
    'MB': 1024 * 1024,
    'GB': 1024 * 1024 * 1024,
    'TB': 1024 * 1024 * 1024 * 1024
  };

  const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB|TB)$/i);
  if (!match) {
    throw new Error('Invalid file size format');
  }

  const [, size, unit] = match;
  return parseFloat(size) * units[unit.toUpperCase()];
}

/**
 * Get document type from MIME type
 */
export function getDocumentTypeFromMimeType(mimeType: string): DocumentType {
  for (const [type, mimeTypes] of Object.entries(MIME_TYPES)) {
    if (mimeTypes.includes(mimeType)) {
      return type as DocumentType;
    }
  }
  return DocumentType.OTHER;
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return path.extname(filename).toLowerCase().slice(1);
}

/**
 * Get filename without extension
 */
export function getFilenameWithoutExtension(filename: string): string {
  return path.basename(filename, path.extname(filename));
}

/**
 * Sanitize filename for safe storage
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 255);
}

/**
 * Generate unique filename with timestamp
 */
export function generateUniqueFilename(originalFilename: string): string {
  const timestamp = Date.now();
  const random = generateRandomString(8);
  const extension = getFileExtension(originalFilename);
  const baseName = getFilenameWithoutExtension(originalFilename);
  const sanitizedBaseName = sanitizeFilename(baseName);
  
  return `${sanitizedBaseName}_${timestamp}_${random}${extension ? '.' + extension : ''}`;
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }

  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as unknown as T;
  }

  if (typeof obj === 'object') {
    const cloned = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }

  return obj;
}

/**
 * Deep merge two objects
 */
export function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target };

  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      const sourceValue = source[key];
      const targetValue = result[key];

      if (isObject(sourceValue) && isObject(targetValue)) {
        result[key] = deepMerge(targetValue, sourceValue);
      } else {
        result[key] = sourceValue as T[Extract<keyof T, string>];
      }
    }
  }

  return result;
}

/**
 * Check if value is an object
 */
export function isObject(value: any): value is Record<string, any> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Debounce function execution
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate: boolean = false
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };

    const callNow = immediate && !timeout;

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) func(...args);
  };
}

/**
 * Throttle function execution
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Retry function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000,
  maxDelay: number = 10000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxAttempts) {
        throw lastError;
      }

      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
      await sleep(delay);
    }
  }

  throw lastError!;
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Format date for display
 */
export function formatDate(date: Date, language: SupportedLanguage = 'pt-PT'): string {
  const locales: Record<SupportedLanguage, string> = {
    'pt-PT': 'pt-PT',
    'en-US': 'en-US',
    'fr-FR': 'fr-FR'
  };

  return date.toLocaleDateString(locales[language], {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Format date and time for display
 */
export function formatDateTime(date: Date, language: SupportedLanguage = 'pt-PT'): string {
  const locales: Record<SupportedLanguage, string> = {
    'pt-PT': 'pt-PT',
    'en-US': 'en-US',
    'fr-FR': 'fr-FR'
  };

  return date.toLocaleString(locales[language], {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date, language: SupportedLanguage = 'pt-PT'): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  const translations: Record<SupportedLanguage, Record<string, string>> = {
    'pt-PT': {
      'just_now': 'agora mesmo',
      'seconds_ago': 'há {0} segundos',
      'minute_ago': 'há 1 minuto',
      'minutes_ago': 'há {0} minutos',
      'hour_ago': 'há 1 hora',
      'hours_ago': 'há {0} horas',
      'day_ago': 'há 1 dia',
      'days_ago': 'há {0} dias'
    },
    'en-US': {
      'just_now': 'just now',
      'seconds_ago': '{0} seconds ago',
      'minute_ago': '1 minute ago',
      'minutes_ago': '{0} minutes ago',
      'hour_ago': '1 hour ago',
      'hours_ago': '{0} hours ago',
      'day_ago': '1 day ago',
      'days_ago': '{0} days ago'
    },
    'fr-FR': {
      'just_now': 'à l\'instant',
      'seconds_ago': 'il y a {0} secondes',
      'minute_ago': 'il y a 1 minute',
      'minutes_ago': 'il y a {0} minutes',
      'hour_ago': 'il y a 1 heure',
      'hours_ago': 'il y a {0} heures',
      'day_ago': 'il y a 1 jour',
      'days_ago': 'il y a {0} jours'
    }
  };

  const t = translations[language];

  if (diffSeconds < 30) {
    return t.just_now;
  } else if (diffSeconds < 60) {
    return t.seconds_ago.replace('{0}', diffSeconds.toString());
  } else if (diffMinutes === 1) {
    return t.minute_ago;
  } else if (diffMinutes < 60) {
    return t.minutes_ago.replace('{0}', diffMinutes.toString());
  } else if (diffHours === 1) {
    return t.hour_ago;
  } else if (diffHours < 24) {
    return t.hours_ago.replace('{0}', diffHours.toString());
  } else if (diffDays === 1) {
    return t.day_ago;
  } else {
    return t.days_ago.replace('{0}', diffDays.toString());
  }
}

/**
 * Truncate text to specified length
 */
export function truncateText(text: string, maxLength: number, suffix: string = '...'): string {
  if (text.length <= maxLength) {
    return text;
  }

  return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Capitalize first letter of each word
 */
export function capitalizeWords(text: string): string {
  return text.replace(/\b\w/g, char => char.toUpperCase());
}

/**
 * Convert string to slug format
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Extract initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2);
}

/**
 * Generate color from string (for avatars, etc.)
 */
export function generateColorFromString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue = hash % 360;
  return `hsl(${hue}, 70%, 50%)`;
}

/**
 * Check if string is valid JSON
 */
export function isValidJSON(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safe JSON parse with default value
 */
export function safeJSONParse<T>(str: string, defaultValue: T): T {
  try {
    return JSON.parse(str);
  } catch {
    return defaultValue;
  }
}

/**
 * Convert bytes to base64
 */
export function bytesToBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64');
}

/**
 * Convert base64 to bytes
 */
export function base64ToBytes(base64: string): Uint8Array {
  return new Uint8Array(Buffer.from(base64, 'base64'));
}

/**
 * Mask sensitive data (e.g., email, phone)
 */
export function maskEmail(email: string): string {
  const [username, domain] = email.split('@');
  if (username.length <= 2) {
    return `${username[0]}*@${domain}`;
  }
  return `${username.substring(0, 2)}${'*'.repeat(username.length - 2)}@${domain}`;
}

/**
 * Mask phone number
 */
export function maskPhoneNumber(phone: string): string {
  if (phone.length <= 4) {
    return '*'.repeat(phone.length);
  }
  return `${'*'.repeat(phone.length - 4)}${phone.slice(-4)}`;
}

/**
 * Generate pagination metadata
 */
export function generatePaginationMeta(page: number, limit: number, total: number) {
  const totalPages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
    offset: (page - 1) * limit
  };
}

/**
 * Array chunk utility
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Remove duplicates from array
 */
export function unique<T>(array: T[]): T[] {
  return [...new Set(array)];
}

/**
 * Group array by key
 */
export function groupBy<T, K extends keyof T>(array: T[], key: K): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const groupKey = String(item[key]);
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

/**
 * Sort array by multiple keys
 */
export function sortBy<T>(array: T[], ...keys: (keyof T)[]): T[] {
  return array.sort((a, b) => {
    for (const key of keys) {
      const aVal = a[key];
      const bVal = b[key];
      
      if (aVal < bVal) return -1;
      if (aVal > bVal) return 1;
    }
    return 0;
  });
}