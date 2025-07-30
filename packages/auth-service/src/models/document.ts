// Document model for Authentication Service
// Modelo de documento para o Serviço de Autenticação

import { BaseEntity, SoftDeletable, Auditable } from './user';

/**
 * Document status enum
 */
export enum DocumentStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  DELETED = 'deleted',
  PROCESSING = 'processing',
  ERROR = 'error'
}

/**
 * Document type enum
 */
export enum DocumentType {
  PDF = 'pdf',
  WORD = 'word',
  EXCEL = 'excel',
  POWERPOINT = 'powerpoint',
  IMAGE = 'image',
  TEXT = 'text',
  VIDEO = 'video',
  AUDIO = 'audio',
  OTHER = 'other'
}

/**
 * Document access level enum
 */
export enum DocumentAccessLevel {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  CONFIDENTIAL = 'confidential',
  RESTRICTED = 'restricted'
}

/**
 * Document version status enum
 */
export enum DocumentVersionStatus {
  CURRENT = 'current',
  PREVIOUS = 'previous',
  DRAFT = 'draft'
}

/**
 * Document metadata interface
 */
export interface DocumentMetadata {
  // File information
  originalName: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  extension: string;
  checksum: string;

  // Content information
  pageCount?: number;
  wordCount?: number;
  characterCount?: number;
  language?: string;
  encoding?: string;

  // Media information (for images/videos)
  width?: number;
  height?: number;
  duration?: number; // in seconds
  bitrate?: number;
  format?: string;

  // Document properties
  title?: string;
  subject?: string;
  author?: string;
  creator?: string;
  producer?: string;
  keywords?: string[];
  description?: string;

  // Timestamps
  creationDate?: Date;
  modificationDate?: Date;
  lastAccessDate?: Date;

  // Security
  isEncrypted: boolean;
  hasPassword: boolean;
  hasDigitalSignature: boolean;

  // Processing information
  ocrProcessed: boolean;
  ocrText?: string;
  ocrConfidence?: number;
  ocrLanguage?: string;

  // AI analysis
  aiProcessed: boolean;
  aiSummary?: string;
  aiKeywords?: string[];
  aiCategories?: string[];
  aiSentiment?: 'positive' | 'negative' | 'neutral';
  aiConfidence?: number;

  // Custom metadata
  customFields?: Record<string, any>;
}

/**
 * Document storage information
 */
export interface DocumentStorage {
  provider: 'local' | 's3' | 'azure' | 'gcp' | 'minio';
  bucket?: string;
  path: string;
  url?: string;
  region?: string;
  storageClass?: string;
  isPublic: boolean;
  cdnUrl?: string;
}

/**
 * Document version interface
 */
export interface DocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  status: DocumentVersionStatus;
  comment?: string;
  storage: DocumentStorage;
  metadata: DocumentMetadata;
  createdAt: Date;
  createdBy: string;
  size: number;
  checksum: string;
}

/**
 * Document permission interface
 */
export interface DocumentPermission {
  id: string;
  documentId: string;
  userId?: string;
  groupId?: string;
  roleId?: string;
  permissions: DocumentPermissionType[];
  grantedBy: string;
  grantedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
}

/**
 * Document permission types
 */
export enum DocumentPermissionType {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  SHARE = 'share',
  COMMENT = 'comment',
  DOWNLOAD = 'download',
  PRINT = 'print',
  COPY = 'copy',
  ADMIN = 'admin'
}

/**
 * Document tag interface
 */
export interface DocumentTag {
  id: string;
  name: string;
  color?: string;
  description?: string;
  createdBy: string;
  createdAt: Date;
}

/**
 * Document comment interface
 */
export interface DocumentComment {
  id: string;
  documentId: string;
  userId: string;
  content: string;
  parentId?: string; // for threaded comments
  mentions?: string[]; // user IDs mentioned
  attachments?: string[]; // file URLs
  isResolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

/**
 * Document activity interface
 */
export interface DocumentActivity {
  id: string;
  documentId: string;
  userId: string;
  action: DocumentActivityType;
  description: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

/**
 * Document activity types
 */
export enum DocumentActivityType {
  CREATED = 'created',
  UPDATED = 'updated',
  DELETED = 'deleted',
  RESTORED = 'restored',
  VIEWED = 'viewed',
  DOWNLOADED = 'downloaded',
  SHARED = 'shared',
  COMMENTED = 'commented',
  TAGGED = 'tagged',
  MOVED = 'moved',
  COPIED = 'copied',
  RENAMED = 'renamed',
  PERMISSION_CHANGED = 'permission_changed',
  VERSION_CREATED = 'version_created',
  OCR_PROCESSED = 'ocr_processed',
  AI_PROCESSED = 'ai_processed'
}

/**
 * Main document interface
 */
export interface Document extends BaseEntity, SoftDeletable, Auditable {
  // Basic information
  name: string;
  description?: string;
  type: DocumentType;
  status: DocumentStatus;
  accessLevel: DocumentAccessLevel;

  // Hierarchy
  folderId?: string;
  path: string; // full path for quick access

  // Current version information
  currentVersionId: string;
  versionCount: number;

  // Storage
  storage: DocumentStorage;

  // Metadata
  metadata: DocumentMetadata;

  // Relationships
  versions: DocumentVersion[];
  permissions: DocumentPermission[];
  tags: DocumentTag[];
  comments: DocumentComment[];
  activities: DocumentActivity[];

  // Statistics
  viewCount: number;
  downloadCount: number;
  shareCount: number;
  commentCount: number;

  // Timestamps
  lastViewedAt?: Date;
  lastDownloadedAt?: Date;
  lastModifiedAt: Date;

  // Flags
  isFavorite: boolean;
  isLocked: boolean;
  lockedBy?: string;
  lockedAt?: Date;
  lockReason?: string;

  // Search and indexing
  searchableText?: string;
  indexedAt?: Date;
  searchVector?: string; // for full-text search
}

/**
 * Document creation input
 */
export interface CreateDocumentInput {
  name: string;
  description?: string;
  type: DocumentType;
  accessLevel?: DocumentAccessLevel;
  folderId?: string;
  tags?: string[];
  metadata?: Partial<DocumentMetadata>;
  file: {
    originalName: string;
    buffer: Buffer;
    mimeType: string;
    size: number;
  };
}

/**
 * Document update input
 */
export interface UpdateDocumentInput {
  name?: string;
  description?: string;
  type?: DocumentType;
  status?: DocumentStatus;
  accessLevel?: DocumentAccessLevel;
  folderId?: string;
  tags?: string[];
  metadata?: Partial<DocumentMetadata>;
  isFavorite?: boolean;
}

/**
 * Document search filters
 */
export interface DocumentSearchFilters {
  query?: string;
  type?: DocumentType;
  status?: DocumentStatus;
  accessLevel?: DocumentAccessLevel;
  folderId?: string;
  tags?: string[];
  createdBy?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  modifiedAfter?: Date;
  modifiedBefore?: Date;
  minSize?: number;
  maxSize?: number;
  hasOcr?: boolean;
  hasAi?: boolean;
  isFavorite?: boolean;
  isLocked?: boolean;
}

/**
 * Document search result
 */
export interface DocumentSearchResult {
  documents: Document[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  facets?: {
    types: Array<{ type: DocumentType; count: number }>;
    statuses: Array<{ status: DocumentStatus; count: number }>;
    tags: Array<{ tag: string; count: number }>;
    folders: Array<{ folderId: string; folderName: string; count: number }>;
  };
}

/**
 * Document statistics
 */
export interface DocumentStatistics {
  totalDocuments: number;
  totalSize: number; // in bytes
  documentsByType: Record<DocumentType, number>;
  documentsByStatus: Record<DocumentStatus, number>;
  documentsByAccessLevel: Record<DocumentAccessLevel, number>;
  averageFileSize: number;
  mostViewedDocuments: Array<{ id: string; name: string; viewCount: number }>;
  mostDownloadedDocuments: Array<{ id: string; name: string; downloadCount: number }>;
  recentActivity: DocumentActivity[];
  storageUsage: Array<{ provider: string; size: number; count: number }>;
}

/**
 * Document share link
 */
export interface DocumentShareLink {
  id: string;
  documentId: string;
  token: string;
  permissions: DocumentPermissionType[];
  expiresAt?: Date;
  password?: string;
  maxDownloads?: number;
  downloadCount: number;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  lastAccessedAt?: Date;
  accessCount: number;
}

/**
 * Document database row interface (matches database schema)
 */
export interface DocumentRow {
  id: string;
  name: string;
  description?: string;
  type: string;
  status: string;
  access_level: string;
  folder_id?: string;
  path: string;
  current_version_id: string;
  version_count: number;
  storage: any; // JSONB
  metadata: any; // JSONB
  view_count: number;
  download_count: number;
  share_count: number;
  comment_count: number;
  last_viewed_at?: Date;
  last_downloaded_at?: Date;
  last_modified_at: Date;
  is_favorite: boolean;
  is_locked: boolean;
  locked_by?: string;
  locked_at?: Date;
  lock_reason?: string;
  searchable_text?: string;
  indexed_at?: Date;
  search_vector?: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
  created_by?: string;
  updated_by?: string;
}

/**
 * Bulk document operation input
 */
export interface BulkDocumentOperation {
  documentIds: string[];
  operation: 'delete' | 'restore' | 'move' | 'copy' | 'tag' | 'untag' | 'change_access_level';
  parameters?: {
    folderId?: string;
    tags?: string[];
    accessLevel?: DocumentAccessLevel;
    [key: string]: any;
  };
}

/**
 * Document upload progress
 */
export interface DocumentUploadProgress {
  documentId: string;
  fileName: string;
  totalSize: number;
  uploadedSize: number;
  percentage: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
  startedAt: Date;
  completedAt?: Date;
}

/**
 * Document processing job
 */
export interface DocumentProcessingJob {
  id: string;
  documentId: string;
  type: 'ocr' | 'ai_analysis' | 'thumbnail' | 'preview' | 'virus_scan';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  result?: any;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  retryCount: number;
  maxRetries: number;
}