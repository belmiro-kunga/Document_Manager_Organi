// Core types for Advanced Document Management System
// Tipos principais para o Sistema de Gestão Documental Avançado

export interface User {
  id: string;
  email: string;
  name: string;
  roles: Role[];
  language: SupportedLanguage;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
}

export interface Role {
  id: string;
  name: string;
  permissions: Permission[];
  description?: string;
}

export interface Permission {
  id: string;
  resource: string;
  action: string;
  conditions?: Record<string, unknown>;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  mimeType: string;
  folderId?: string;
  ownerId: string;
  storageProvider: StorageProvider;
  storageKey: string;
  metadata: DocumentMetadata;
  versions: DocumentVersion[];
  permissions: DocumentPermission[];
  tags: string[];
  language?: SupportedLanguage;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentMetadata {
  title?: string;
  description?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  customFields: Record<string, unknown>;
  extractedText?: string;
  ocrProcessed: boolean;
  aiProcessed: boolean;
  classification?: DocumentClassification;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: string;
  storageKey: string;
  size: number;
  checksum: string;
  createdBy: string;
  createdAt: Date;
  comment?: string;
}

export interface DocumentPermission {
  id: string;
  documentId: string;
  userId?: string;
  roleId?: string;
  permissions: string[];
  expiresAt?: Date;
  createdAt: Date;
}

export interface Folder {
  id: string;
  name: string;
  parentId?: string;
  ownerId: string;
  path: string;
  permissions: FolderPermission[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FolderPermission {
  id: string;
  folderId: string;
  userId?: string;
  roleId?: string;
  permissions: string[];
  inherited: boolean;
  createdAt: Date;
}

export interface Comment {
  id: string;
  documentId: string;
  userId: string;
  content: string;
  language: SupportedLanguage;
  pageNumber?: number;
  position?: CommentPosition;
  parentId?: string;
  mentions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentPosition {
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export interface ShareLink {
  id: string;
  documentId: string;
  createdBy: string;
  token: string;
  permissions: string[];
  expiresAt?: Date;
  password?: string;
  downloadCount: number;
  maxDownloads?: number;
  createdAt: Date;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
  isActive: boolean;
  language: SupportedLanguage;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: WorkflowStepType;
  assignees: string[];
  conditions: StepCondition[];
  actions: StepAction[];
  timeoutHours?: number;
  order: number;
}

export interface WorkflowInstance {
  id: string;
  workflowId: string;
  documentId: string;
  currentStepId: string;
  status: WorkflowStatus;
  startedBy: string;
  startedAt: Date;
  completedAt?: Date;
  variables: Record<string, unknown>;
}

export interface Task {
  id: string;
  workflowInstanceId?: string;
  title: string;
  description?: string;
  assigneeId: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentClassification {
  type: string;
  confidence: number;
  categories: string[];
  entities: ExtractedEntity[];
  language: SupportedLanguage;
  processedAt: Date;
}

export interface ExtractedEntity {
  text: string;
  label: string;
  confidence: number;
  startChar: number;
  endChar: number;
}

// Enums and Union Types
export type SupportedLanguage = 'pt-PT' | 'en-US' | 'fr-FR';

export type StorageProvider = 'local' | 's3' | 'r2' | 'wasabi';

export type WorkflowStepType = 'approval' | 'review' | 'notification' | 'automation';

export type WorkflowStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'failed';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface StepCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: unknown;
}

export interface StepAction {
  type: 'email' | 'webhook' | 'update_field' | 'create_task';
  config: Record<string, unknown>;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Configuration Types
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  pool?: {
    min: number;
    max: number;
  };
}

export interface StorageConfig {
  local?: {
    basePath: string;
    maxSize: number;
    backupEnabled: boolean;
  };
  s3?: {
    bucket: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    endpoint?: string;
  };
  r2?: {
    bucket: string;
    accountId: string;
    accessKeyId: string;
    secretAccessKey: string;
  };
  wasabi?: {
    bucket: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
  };
}

export interface LocalizationConfig {
  defaultLanguage: SupportedLanguage;
  supportedLanguages: SupportedLanguage[];
  fallbackLanguage: SupportedLanguage;
  dateFormats: Record<SupportedLanguage, string>;
  numberFormats: Record<SupportedLanguage, Intl.NumberFormatOptions>;
  currencyFormats: Record<SupportedLanguage, string>;
  timezones: Record<SupportedLanguage, string>;
}