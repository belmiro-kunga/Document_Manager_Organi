// Validation schemas using Zod for Advanced Document Management System
// Esquemas de validação usando Zod para o Sistema de Gestão Documental Avançado

import { z } from 'zod';
import { SUPPORTED_LANGUAGES, REGEX_PATTERNS, SUPPORTED_FILE_TYPES, MAX_FILE_SIZE } from '../constants';

// Base validation schemas
export const uuidSchema = z.string().regex(REGEX_PATTERNS.UUID, 'Invalid UUID format');

export const emailSchema = z.string().email('Invalid email format');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(
    REGEX_PATTERNS.PASSWORD,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  );

export const languageSchema = z.enum(SUPPORTED_LANGUAGES);

export const slugSchema = z.string().regex(REGEX_PATTERNS.SLUG, 'Invalid slug format');

// User validation schemas
export const createUserSchema = z.object({
  email: emailSchema,
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  password: passwordSchema,
  language: languageSchema.optional().default('pt-PT'),
  timezone: z.string().optional().default('Africa/Luanda'),
});

export const updateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long').optional(),
  language: languageSchema.optional(),
  timezone: z.string().optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

// Document validation schemas
export const documentMetadataSchema = z.object({
  title: z.string().max(255, 'Title too long').optional(),
  description: z.string().max(1000, 'Description too long').optional(),
  author: z.string().max(100, 'Author name too long').optional(),
  subject: z.string().max(255, 'Subject too long').optional(),
  keywords: z.array(z.string().max(50, 'Keyword too long')).max(20, 'Too many keywords').optional(),
  customFields: z.record(z.unknown()).optional().default({}),
});

export const createDocumentSchema = z.object({
  name: z.string().min(1, 'Document name is required').max(255, 'Document name too long'),
  folderId: uuidSchema.optional(),
  metadata: documentMetadataSchema.optional().default({}),
  tags: z.array(z.string().max(30, 'Tag too long')).max(10, 'Too many tags').optional().default([]),
  language: languageSchema.optional(),
});

export const updateDocumentSchema = z.object({
  name: z.string().min(1, 'Document name is required').max(255, 'Document name too long').optional(),
  folderId: uuidSchema.optional(),
  metadata: documentMetadataSchema.optional(),
  tags: z.array(z.string().max(30, 'Tag too long')).max(10, 'Too many tags').optional(),
  language: languageSchema.optional(),
});

// File upload validation
export const fileUploadSchema = z.object({
  originalname: z.string().min(1, 'Filename is required'),
  mimetype: z.string().refine(
    (mime) => [
      ...SUPPORTED_FILE_TYPES.DOCUMENTS,
      ...SUPPORTED_FILE_TYPES.IMAGES,
      ...SUPPORTED_FILE_TYPES.ARCHIVES,
    ].includes(mime),
    'Unsupported file type'
  ),
  size: z.number().max(MAX_FILE_SIZE.DOCUMENT, 'File too large'),
  buffer: z.instanceof(Buffer),
});

// Folder validation schemas
export const createFolderSchema = z.object({
  name: z.string().min(1, 'Folder name is required').max(100, 'Folder name too long'),
  parentId: uuidSchema.optional(),
});

export const updateFolderSchema = z.object({
  name: z.string().min(1, 'Folder name is required').max(100, 'Folder name too long').optional(),
  parentId: uuidSchema.optional(),
});

// Comment validation schemas
export const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required').max(1000, 'Comment too long'),
  pageNumber: z.number().int().positive().optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number().optional(),
    height: z.number().optional(),
  }).optional(),
  parentId: uuidSchema.optional(),
  language: languageSchema.optional().default('pt-PT'),
});

export const updateCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required').max(1000, 'Comment too long'),
});

// Permission validation schemas
export const permissionSchema = z.object({
  resource: z.string().min(1, 'Resource is required'),
  action: z.string().min(1, 'Action is required'),
  conditions: z.record(z.unknown()).optional(),
});

export const assignPermissionSchema = z.object({
  userId: uuidSchema.optional(),
  roleId: uuidSchema.optional(),
  permissions: z.array(z.string()).min(1, 'At least one permission is required'),
  expiresAt: z.string().datetime().optional(),
}).refine(
  (data) => data.userId || data.roleId,
  'Either userId or roleId must be provided'
);

// Share link validation schemas
export const createShareLinkSchema = z.object({
  permissions: z.array(z.string()).min(1, 'At least one permission is required'),
  expiresAt: z.string().datetime().optional(),
  password: z.string().min(4, 'Password must be at least 4 characters').optional(),
  maxDownloads: z.number().int().positive().optional(),
});

// Workflow validation schemas
export const stepConditionSchema = z.object({
  field: z.string().min(1, 'Field is required'),
  operator: z.enum(['equals', 'not_equals', 'contains', 'greater_than', 'less_than']),
  value: z.unknown(),
});

export const stepActionSchema = z.object({
  type: z.enum(['email', 'webhook', 'update_field', 'create_task']),
  config: z.record(z.unknown()),
});

export const workflowStepSchema = z.object({
  name: z.string().min(1, 'Step name is required').max(100, 'Step name too long'),
  type: z.enum(['approval', 'review', 'notification', 'automation']),
  assignees: z.array(uuidSchema).min(1, 'At least one assignee is required'),
  conditions: z.array(stepConditionSchema).optional().default([]),
  actions: z.array(stepActionSchema).optional().default([]),
  timeoutHours: z.number().int().positive().optional(),
  order: z.number().int().nonnegative(),
});

export const createWorkflowSchema = z.object({
  name: z.string().min(1, 'Workflow name is required').max(100, 'Workflow name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  steps: z.array(workflowStepSchema).min(1, 'At least one step is required'),
  language: languageSchema.optional().default('pt-PT'),
});

export const updateWorkflowSchema = z.object({
  name: z.string().min(1, 'Workflow name is required').max(100, 'Workflow name too long').optional(),
  description: z.string().max(500, 'Description too long').optional(),
  steps: z.array(workflowStepSchema).optional(),
  isActive: z.boolean().optional(),
});

// Task validation schemas
export const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(200, 'Task title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  assigneeId: uuidSchema,
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium'),
  dueDate: z.string().datetime().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(200, 'Task title too long').optional(),
  description: z.string().max(1000, 'Description too long').optional(),
  assigneeId: uuidSchema.optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  dueDate: z.string().datetime().optional(),
});

// Search validation schemas
export const searchQuerySchema = z.object({
  query: z.string().min(1, 'Search query is required').max(200, 'Query too long'),
  filters: z.object({
    type: z.array(z.string()).optional(),
    language: z.array(languageSchema).optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    folderId: uuidSchema.optional(),
    tags: z.array(z.string()).optional(),
    ownerId: uuidSchema.optional(),
  }).optional().default({}),
  sort: z.object({
    field: z.enum(['name', 'createdAt', 'updatedAt', 'size', 'relevance']).optional().default('relevance'),
    order: z.enum(['asc', 'desc']).optional().default('desc'),
  }).optional().default({}),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(20),
});

// Pagination validation schemas
export const paginationSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(20),
});

// Storage configuration validation schemas
export const storageConfigSchema = z.object({
  local: z.object({
    basePath: z.string().min(1, 'Base path is required'),
    maxSize: z.number().int().positive(),
    backupEnabled: z.boolean().optional().default(false),
  }).optional(),
  s3: z.object({
    bucket: z.string().min(1, 'Bucket name is required'),
    region: z.string().min(1, 'Region is required'),
    accessKeyId: z.string().min(1, 'Access key ID is required'),
    secretAccessKey: z.string().min(1, 'Secret access key is required'),
    endpoint: z.string().url().optional(),
  }).optional(),
  r2: z.object({
    bucket: z.string().min(1, 'Bucket name is required'),
    accountId: z.string().min(1, 'Account ID is required'),
    accessKeyId: z.string().min(1, 'Access key ID is required'),
    secretAccessKey: z.string().min(1, 'Secret access key is required'),
  }).optional(),
  wasabi: z.object({
    bucket: z.string().min(1, 'Bucket name is required'),
    region: z.string().min(1, 'Region is required'),
    accessKeyId: z.string().min(1, 'Access key ID is required'),
    secretAccessKey: z.string().min(1, 'Secret access key is required'),
  }).optional(),
});

// Environment validation schema
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).pipe(z.number().int().positive()).default('3000'),
  
  // Database
  DATABASE_URL: z.string().url(),
  DATABASE_HOST: z.string().default('localhost'),
  DATABASE_PORT: z.string().transform(Number).pipe(z.number().int().positive()).default('5432'),
  DATABASE_NAME: z.string().min(1),
  DATABASE_USER: z.string().min(1),
  DATABASE_PASSWORD: z.string().min(1),
  
  // Redis
  REDIS_URL: z.string().url().optional(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().transform(Number).pipe(z.number().int().positive()).default('6379'),
  
  // ElasticSearch
  ELASTICSEARCH_URL: z.string().url().optional(),
  ELASTICSEARCH_HOST: z.string().default('localhost'),
  ELASTICSEARCH_PORT: z.string().transform(Number).pipe(z.number().int().positive()).default('9200'),
  
  // JWT
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  
  // Storage
  STORAGE_PROVIDER: z.enum(['local', 's3', 'r2', 'wasabi']).default('local'),
  LOCAL_STORAGE_PATH: z.string().default('./storage'),
  
  // External APIs
  OPENAI_API_KEY: z.string().optional(),
  
  // Email
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).pipe(z.number().int().positive()).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  
  // Security
  BCRYPT_ROUNDS: z.string().transform(Number).pipe(z.number().int().positive()).default('12'),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).pipe(z.number().int().positive()).default('900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).pipe(z.number().int().positive()).default('100'),
});

// Type exports for TypeScript inference
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
export type FileUploadInput = z.infer<typeof fileUploadSchema>;
export type CreateFolderInput = z.infer<typeof createFolderSchema>;
export type UpdateFolderInput = z.infer<typeof updateFolderSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
export type AssignPermissionInput = z.infer<typeof assignPermissionSchema>;
export type CreateShareLinkInput = z.infer<typeof createShareLinkSchema>;
export type CreateWorkflowInput = z.infer<typeof createWorkflowSchema>;
export type UpdateWorkflowInput = z.infer<typeof updateWorkflowSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type SearchQueryInput = z.infer<typeof searchQuerySchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type StorageConfigInput = z.infer<typeof storageConfigSchema>;
export type EnvInput = z.infer<typeof envSchema>;