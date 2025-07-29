// Utility functions for Advanced Document Management System
// Funções utilitárias para o Sistema de Gestão Documental Avançado

import { v4 as uuidv4 } from 'uuid';
import { format, parseISO } from 'date-fns';
import type { SupportedLanguage } from '../types';
import { LOCALIZATION_CONFIG, REGEX_PATTERNS } from '../constants';

/**
 * Generate a new UUID v4
 * Gerar um novo UUID v4
 */
export const generateId = (): string => uuidv4();

/**
 * Validate email format
 * Validar formato de email
 */
export const isValidEmail = (email: string): boolean => {
  return REGEX_PATTERNS.EMAIL.test(email);
};

/**
 * Validate password strength
 * Validar força da senha
 */
export const isValidPassword = (password: string): boolean => {
  return REGEX_PATTERNS.PASSWORD.test(password);
};

/**
 * Validate UUID format
 * Validar formato UUID
 */
export const isValidUUID = (uuid: string): boolean => {
  return REGEX_PATTERNS.UUID.test(uuid);
};

/**
 * Format date according to language locale
 * Formatar data de acordo com a localização do idioma
 */
export const formatDate = (
  date: Date | string,
  language: SupportedLanguage = 'pt-PT'
): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const formatString = LOCALIZATION_CONFIG.dateFormats[language];
  
  // Convert format string to date-fns format
  const dateFnsFormat = formatString
    .replace('DD', 'dd')
    .replace('MM', 'MM')
    .replace('YYYY', 'yyyy');
  
  return format(dateObj, dateFnsFormat);
};

/**
 * Format number according to language locale
 * Formatar número de acordo com a localização do idioma
 */
export const formatNumber = (
  number: number,
  language: SupportedLanguage = 'pt-PT'
): string => {
  const locale = language === 'pt-PT' ? 'pt-AO' : language.replace('-', '-');
  const options = LOCALIZATION_CONFIG.numberFormats[language];
  
  return new Intl.NumberFormat(locale, options).format(number);
};

/**
 * Format currency according to language locale
 * Formatar moeda de acordo com a localização do idioma
 */
export const formatCurrency = (
  amount: number,
  language: SupportedLanguage = 'pt-PT'
): string => {
  const locale = language === 'pt-PT' ? 'pt-AO' : language.replace('-', '-');
  const currency = LOCALIZATION_CONFIG.currencyFormats[language];
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
};

/**
 * Format file size in human readable format
 * Formatar tamanho de arquivo em formato legível
 */
export const formatFileSize = (bytes: number, language: SupportedLanguage = 'pt-PT'): string => {
  const units = {
    'pt-PT': ['B', 'KB', 'MB', 'GB', 'TB'],
    'en-US': ['B', 'KB', 'MB', 'GB', 'TB'],
    'fr-FR': ['o', 'Ko', 'Mo', 'Go', 'To'],
  };
  
  if (bytes === 0) return `0 ${units[language][0]}`;
  
  const k = 1024;
  const dm = 2;
  const sizes = units[language];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${(bytes / Math.pow(k, i)).toFixed(dm)} ${sizes[i]}`;
};

/**
 * Slugify string for URLs
 * Converter string para slug para URLs
 */
export const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

/**
 * Truncate text to specified length
 * Truncar texto para comprimento especificado
 */
export const truncateText = (text: string, maxLength: number, suffix = '...'): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
};

/**
 * Capitalize first letter of each word
 * Capitalizar primeira letra de cada palavra
 */
export const capitalizeWords = (text: string): string => {
  return text.replace(/\w\S*/g, txt => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

/**
 * Generate random string
 * Gerar string aleatória
 */
export const generateRandomString = (length: number): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Deep clone object
 * Clonar objeto profundamente
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T;
  if (typeof obj === 'object') {
    const clonedObj = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  return obj;
};

/**
 * Debounce function
 * Função de debounce
 */
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function
 * Função de throttle
 */
export const throttle = <T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Check if object is empty
 * Verificar se objeto está vazio
 */
export const isEmpty = (obj: unknown): boolean => {
  if (obj === null || obj === undefined) return true;
  if (typeof obj === 'string' || Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  return false;
};

/**
 * Get file extension from filename
 * Obter extensão do arquivo a partir do nome
 */
export const getFileExtension = (filename: string): string => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

/**
 * Get MIME type from file extension
 * Obter tipo MIME a partir da extensão do arquivo
 */
export const getMimeTypeFromExtension = (extension: string): string => {
  const mimeTypes: Record<string, string> = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    txt: 'text/plain',
    csv: 'text/csv',
    rtf: 'application/rtf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    bmp: 'image/bmp',
    tiff: 'image/tiff',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
    tar: 'application/x-tar',
    gz: 'application/gzip',
  };
  
  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
};

/**
 * Calculate file checksum (simple hash)
 * Calcular checksum do arquivo (hash simples)
 */
export const calculateChecksum = (content: string | Buffer): string => {
  let hash = 0;
  const str = typeof content === 'string' ? content : content.toString();
  
  if (str.length === 0) return hash.toString();
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return Math.abs(hash).toString(16);
};

/**
 * Retry function with exponential backoff
 * Função de retry com backoff exponencial
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
};

/**
 * Parse user agent string
 * Analisar string do user agent
 */
export const parseUserAgent = (userAgent: string): {
  browser: string;
  version: string;
  os: string;
} => {
  // Simplified user agent parsing
  const browser = userAgent.includes('Chrome') ? 'Chrome' :
                 userAgent.includes('Firefox') ? 'Firefox' :
                 userAgent.includes('Safari') ? 'Safari' :
                 userAgent.includes('Edge') ? 'Edge' : 'Unknown';
  
  const os = userAgent.includes('Windows') ? 'Windows' :
            userAgent.includes('Mac') ? 'macOS' :
            userAgent.includes('Linux') ? 'Linux' :
            userAgent.includes('Android') ? 'Android' :
            userAgent.includes('iOS') ? 'iOS' : 'Unknown';
  
  // Extract version (simplified)
  const versionMatch = userAgent.match(/(?:Chrome|Firefox|Safari|Edge)\/(\d+\.\d+)/);
  const version: string = versionMatch?.[1] ?? 'Unknown';
  
  return { browser, version, os };
};