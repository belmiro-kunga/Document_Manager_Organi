// Common TypeScript interfaces and types for Advanced DMS
// Interfaces e tipos TypeScript comuns para o DMS Avançado

/**
 * Supported languages in the system
 */
export type SupportedLanguage = 'pt-PT' | 'en-US' | 'fr-FR';

/**
 * User roles in the system
 */
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  USER = 'user',
  GUEST = 'guest'
}

/**
 * Document status enumeration
 */
export enum DocumentStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ARCHIVED = 'archived',
  DELETED = 'deleted'
}

/**
 * Document types supported by the system
 */
export enum DocumentType {
  PDF = 'pdf',
  WORD = 'word',
  EXCEL = 'excel',
  POWERPOINT = 'powerpoint',
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  OTHER = 'other'
}

/**
 * File MIME types mapping
 */
export const MIME_TYPES: Record<DocumentType, string[]> = {
  [DocumentType.PDF]: ['application/pdf'],
  [DocumentType.WORD]: [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  [DocumentType.EXCEL]: [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ],
  [DocumentType.POWERPOINT]: [
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ],
  [DocumentType.TEXT]: ['text/plain', 'text/csv', 'text/html'],
  [DocumentType.IMAGE]: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  [DocumentType.VIDEO]: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv'],
  [DocumentType.AUDIO]: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'],
  [DocumentType.OTHER]: ['application/octet-stream']
};

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

/**
 * Sorting parameters
 */
export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Search parameters
 */
export interface SearchParams {
  query?: string;
  filters?: Record<string, any>;
}

/**
 * API request parameters combining pagination, sorting, and search
 */
export interface ApiRequestParams extends PaginationParams, SortParams, SearchParams {
  include?: string[];
  fields?: string[];
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  meta?: Record<string, any>;
}

/**
 * API response structure
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
    version?: string;
  };
}

/**
 * Base entity interface
 */
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
  version?: number;
}

/**
 * Soft delete interface
 */
export interface SoftDeletable {
  deletedAt?: Date;
  deletedBy?: string;
  isDeleted: boolean;
}

/**
 * Audit trail interface
 */
export interface Auditable {
  auditTrail: AuditEntry[];
}

/**
 * Audit entry structure
 */
export interface AuditEntry {
  id: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  userId?: string;
  timestamp: Date;
  changes?: Record<string, { from: any; to: any }>;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Audit actions
 */
export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  VIEW = 'view',
  DOWNLOAD = 'download',
  SHARE = 'share',
  APPROVE = 'approve',
  REJECT = 'reject',
  ARCHIVE = 'archive',
  RESTORE = 'restore'
}

/**
 * User interface
 */
export interface User extends BaseEntity {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt?: Date;
  preferences: UserPreferences;
  permissions: string[];
  avatar?: string;
  department?: string;
  position?: string;
  phone?: string;
  language: SupportedLanguage;
  timezone: string;
}

/**
 * User preferences
 */
export interface UserPreferences {
  language: SupportedLanguage;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  theme: 'light' | 'dark' | 'auto';
  notifications: NotificationPreferences;
  dashboard: DashboardPreferences;
}

/**
 * Notification preferences
 */
export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  documentUpdates: boolean;
  workflowUpdates: boolean;
  systemUpdates: boolean;
  securityAlerts: boolean;
}

/**
 * Dashboard preferences
 */
export interface DashboardPreferences {
  widgets: string[];
  layout: 'grid' | 'list';
  defaultView: 'recent' | 'favorites' | 'assigned';
  itemsPerPage: number;
}

/**
 * Document interface
 */
export interface Document extends BaseEntity, SoftDeletable, Auditable {
  title: string;
  description?: string;
  type: DocumentType;
  mimeType: string;
  size: number;
  filename: string;
  originalFilename: string;
  path: string;
  url?: string;
  thumbnailUrl?: string;
  status: DocumentStatus;
  version: number;
  parentId?: string;
  folderId?: string;
  tags: string[];
  metadata: DocumentMetadata;
  permissions: DocumentPermissions;
  workflow?: WorkflowState;
  content?: DocumentContent;
  checksum: string;
  isEncrypted: boolean;
  encryptionKey?: string;
  expiresAt?: Date;
  downloadCount: number;
  viewCount: number;
  shareCount: number;
}

/**
 * Document metadata
 */
export interface DocumentMetadata {
  author?: string;
  subject?: string;
  keywords?: string[];
  language?: SupportedLanguage;
  pageCount?: number;
  wordCount?: number;
  duration?: number; // for video/audio files
  dimensions?: { width: number; height: number }; // for images/videos
  extractedText?: string;
  ocrText?: string;
  aiSummary?: string;
  aiTags?: string[];
  customFields?: Record<string, any>;
}

/**
 * Document permissions
 */
export interface DocumentPermissions {
  owner: string;
  readers: string[];
  writers: string[];
  admins: string[];
  public: boolean;
  shareableLink?: string;
  shareLinkExpires?: Date;
  downloadAllowed: boolean;
  printAllowed: boolean;
  copyAllowed: boolean;
}

/**
 * Document content for full-text search
 */
export interface DocumentContent {
  text: string;
  language: SupportedLanguage;
  extractedAt: Date;
  extractionMethod: 'ocr' | 'text' | 'ai';
  confidence?: number;
}

/**
 * Workflow state
 */
export interface WorkflowState {
  id: string;
  name: string;
  currentStep: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo?: string[];
  dueDate?: Date;
  completedSteps: WorkflowStep[];
  nextSteps: WorkflowStep[];
  history: WorkflowHistoryEntry[];
}

/**
 * Workflow step
 */
export interface WorkflowStep {
  id: string;
  name: string;
  type: 'approval' | 'review' | 'signature' | 'notification';
  assignedTo: string[];
  dueDate?: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  completedAt?: Date;
  completedBy?: string;
  comments?: string;
  attachments?: string[];
}

/**
 * Workflow history entry
 */
export interface WorkflowHistoryEntry {
  id: string;
  stepId: string;
  action: 'started' | 'completed' | 'approved' | 'rejected' | 'delegated';
  userId: string;
  timestamp: Date;
  comments?: string;
  metadata?: Record<string, any>;
}

/**
 * Folder interface
 */
export interface Folder extends BaseEntity, SoftDeletable {
  name: string;
  description?: string;
  parentId?: string;
  path: string;
  permissions: FolderPermissions;
  documentCount: number;
  subfolderCount: number;
  totalSize: number;
  color?: string;
  icon?: string;
}

/**
 * Folder permissions
 */
export interface FolderPermissions {
  owner: string;
  readers: string[];
  writers: string[];
  admins: string[];
  inherited: boolean;
}

/**
 * Search result interface
 */
export interface SearchResult {
  id: string;
  type: 'document' | 'folder' | 'user';
  title: string;
  description?: string;
  url: string;
  thumbnailUrl?: string;
  score: number;
  highlights: SearchHighlight[];
  metadata: Record<string, any>;
}

/**
 * Search highlight
 */
export interface SearchHighlight {
  field: string;
  fragments: string[];
}

/**
 * Activity log entry
 */
export interface ActivityLogEntry {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  entityTitle?: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

/**
 * System notification
 */
export interface SystemNotification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  userId?: string; // null for system-wide notifications
  isRead: boolean;
  createdAt: Date;
  expiresAt?: Date;
  actionUrl?: string;
  actionText?: string;
  metadata?: Record<string, any>;
}

/**
 * File upload progress
 */
export interface UploadProgress {
  fileId: string;
  filename: string;
  size: number;
  uploaded: number;
  percentage: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
  estimatedTimeRemaining?: number;
}

/**
 * Batch operation result
 */
export interface BatchOperationResult<T = any> {
  total: number;
  successful: number;
  failed: number;
  results: Array<{
    id: string;
    success: boolean;
    data?: T;
    error?: string;
  }>;
}

/**
 * Health check result
 */
export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Date;
  uptime: number;
  version: string;
  services: Record<string, ServiceHealthStatus>;
  metrics?: Record<string, any>;
}

/**
 * Service health status
 */
export interface ServiceHealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime?: number;
  error?: string;
  lastCheck: Date;
}

/**
 * Configuration interface
 */
export interface AppConfig {
  app: {
    name: string;
    version: string;
    environment: string;
    port: number;
    host: string;
  };
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
    ssl: boolean;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
  };
  storage: {
    provider: 'local' | 's3' | 'minio';
    path?: string;
    bucket?: string;
    region?: string;
    accessKey?: string;
    secretKey?: string;
  };
  auth: {
    jwtSecret: string;
    jwtExpiresIn: string;
    bcryptRounds: number;
  };
  features: {
    aiAnalysis: boolean;
    ocrProcessing: boolean;
    workflowEngine: boolean;
    digitalSignature: boolean;
    collaboration: boolean;
  };
  limits: {
    maxFileSize: number;
    maxFilesPerUpload: number;
    maxStoragePerUser: number;
    rateLimitRequests: number;
    rateLimitWindow: number;
  };
}