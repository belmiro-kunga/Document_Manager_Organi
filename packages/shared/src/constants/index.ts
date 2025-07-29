// Constants for Advanced Document Management System
// Constantes para o Sistema de Gestão Documental Avançado

import type { LocalizationConfig, SupportedLanguage } from '../types';

// Supported Languages Configuration
export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['pt-PT', 'en-US', 'fr-FR'];

export const DEFAULT_LANGUAGE: SupportedLanguage = 'pt-PT';

export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  'pt-PT': 'Português',
  'en-US': 'English',
  'fr-FR': 'Français',
};

export const LANGUAGE_FLAGS: Record<SupportedLanguage, string> = {
  'pt-PT': '🇵🇹',
  'en-US': '🇺🇸',
  'fr-FR': '🇫🇷',
};

// Localization Configuration
export const LOCALIZATION_CONFIG: LocalizationConfig = {
  defaultLanguage: 'pt-PT',
  supportedLanguages: SUPPORTED_LANGUAGES,
  fallbackLanguage: 'pt-PT',
  dateFormats: {
    'pt-PT': 'DD/MM/YYYY',
    'en-US': 'MM/DD/YYYY',
    'fr-FR': 'DD/MM/YYYY',
  },
  numberFormats: {
    'pt-PT': {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true,
    },
    'en-US': {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true,
    },
    'fr-FR': {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true,
    },
  },
  currencyFormats: {
    'pt-PT': 'AOA', // Angolan Kwanza
    'en-US': 'USD',
    'fr-FR': 'EUR',
  },
  timezones: {
    'pt-PT': 'Africa/Luanda', // West Africa Time (WAT)
    'en-US': 'America/New_York',
    'fr-FR': 'Europe/Paris',
  },
};

// File Type Constants
export const SUPPORTED_FILE_TYPES = {
  DOCUMENTS: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'application/rtf',
  ],
  IMAGES: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/bmp',
    'image/tiff',
    'image/webp',
    'image/svg+xml',
  ],
  ARCHIVES: [
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'application/x-tar',
    'application/gzip',
  ],
} as const;

export const MAX_FILE_SIZE = {
  DOCUMENT: 100 * 1024 * 1024, // 100MB
  IMAGE: 10 * 1024 * 1024, // 10MB
  ARCHIVE: 500 * 1024 * 1024, // 500MB
} as const;

// Permission Constants
export const PERMISSIONS = {
  DOCUMENTS: {
    READ: 'documents:read',
    WRITE: 'documents:write',
    DELETE: 'documents:delete',
    SHARE: 'documents:share',
    DOWNLOAD: 'documents:download',
    COMMENT: 'documents:comment',
    VERSION: 'documents:version',
  },
  FOLDERS: {
    READ: 'folders:read',
    WRITE: 'folders:write',
    DELETE: 'folders:delete',
    CREATE: 'folders:create',
    MANAGE: 'folders:manage',
  },
  USERS: {
    READ: 'users:read',
    WRITE: 'users:write',
    DELETE: 'users:delete',
    MANAGE_ROLES: 'users:manage_roles',
  },
  SYSTEM: {
    ADMIN: 'system:admin',
    AUDIT: 'system:audit',
    BACKUP: 'system:backup',
    SETTINGS: 'system:settings',
  },
} as const;

// Default Roles
export const DEFAULT_ROLES = {
  ADMIN: {
    name: 'Administrator',
    permissions: Object.values(PERMISSIONS).flatMap(group => Object.values(group)),
  },
  MANAGER: {
    name: 'Manager',
    permissions: [
      ...Object.values(PERMISSIONS.DOCUMENTS),
      ...Object.values(PERMISSIONS.FOLDERS),
      PERMISSIONS.USERS.READ,
      PERMISSIONS.SYSTEM.AUDIT,
    ],
  },
  USER: {
    name: 'User',
    permissions: [
      PERMISSIONS.DOCUMENTS.READ,
      PERMISSIONS.DOCUMENTS.WRITE,
      PERMISSIONS.DOCUMENTS.COMMENT,
      PERMISSIONS.DOCUMENTS.DOWNLOAD,
      PERMISSIONS.FOLDERS.READ,
      PERMISSIONS.FOLDERS.CREATE,
    ],
  },
  VIEWER: {
    name: 'Viewer',
    permissions: [
      PERMISSIONS.DOCUMENTS.READ,
      PERMISSIONS.DOCUMENTS.DOWNLOAD,
      PERMISSIONS.DOCUMENTS.COMMENT,
      PERMISSIONS.FOLDERS.READ,
    ],
  },
} as const;

// Storage Provider Constants
export const STORAGE_PROVIDERS = {
  LOCAL: 'local',
  S3: 's3',
  R2: 'r2',
  WASABI: 'wasabi',
} as const;

// OCR Language Codes (Tesseract)
export const OCR_LANGUAGES: Record<SupportedLanguage, string> = {
  'pt-PT': 'por',
  'en-US': 'eng',
  'fr-FR': 'fra',
};

// NLP Model Names (spaCy)
export const NLP_MODELS: Record<SupportedLanguage, string> = {
  'pt-PT': 'pt_core_news_lg',
  'en-US': 'en_core_web_lg',
  'fr-FR': 'fr_core_news_lg',
};

// API Constants
export const API_VERSIONS = {
  V1: 'v1',
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Error Codes
export const ERROR_CODES = {
  // Authentication & Authorization
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  
  // Resources
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_IN_USE: 'RESOURCE_IN_USE',
  
  // Storage
  STORAGE_ERROR: 'STORAGE_ERROR',
  STORAGE_QUOTA_EXCEEDED: 'STORAGE_QUOTA_EXCEEDED',
  
  // Processing
  OCR_PROCESSING_FAILED: 'OCR_PROCESSING_FAILED',
  AI_PROCESSING_FAILED: 'AI_PROCESSING_FAILED',
  
  // System
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;

// Regex Patterns
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  PHONE: /^\+?[1-9]\d{1,14}$/,
} as const;

// Cache TTL (Time To Live) in seconds
export const CACHE_TTL = {
  SHORT: 300, // 5 minutes
  MEDIUM: 1800, // 30 minutes
  LONG: 3600, // 1 hour
  VERY_LONG: 86400, // 24 hours
} as const;

// Pagination Defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;