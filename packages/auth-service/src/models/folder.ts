// Folder model for Authentication Service
// Modelo de pasta para o Serviço de Autenticação

import { BaseEntity, SoftDeletable, Auditable } from './user';

/**
 * Folder access level enum
 */
export enum FolderAccessLevel {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  CONFIDENTIAL = 'confidential',
  RESTRICTED = 'restricted'
}

/**
 * Folder type enum
 */
export enum FolderType {
  REGULAR = 'regular',
  SYSTEM = 'system',
  SHARED = 'shared',
  TEMPLATE = 'template',
  ARCHIVE = 'archive',
  TRASH = 'trash'
}

/**
 * Folder status enum
 */
export enum FolderStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  LOCKED = 'locked',
  DELETED = 'deleted'
}

/**
 * Folder permission interface
 */
export interface FolderPermission {
  id: string;
  folderId: string;
  userId?: string;
  groupId?: string;
  roleId?: string;
  permissions: FolderPermissionType[];
  inherited: boolean;
  grantedBy: string;
  grantedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
}

/**
 * Folder permission types
 */
export enum FolderPermissionType {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  CREATE_SUBFOLDER = 'create_subfolder',
  UPLOAD = 'upload',
  SHARE = 'share',
  ADMIN = 'admin',
  INHERIT = 'inherit'
}

/**
 * Folder metadata interface
 */
export interface FolderMetadata {
  // Basic information
  description?: string;
  tags?: string[];
  color?: string;
  icon?: string;

  // Statistics
  totalSize: number; // in bytes
  documentCount: number;
  subfolderCount: number;
  totalDocuments: number; // including subfolders
  totalSubfolders: number; // including nested

  // Settings
  allowedFileTypes?: string[];
  maxFileSize?: number; // in bytes
  maxDocuments?: number;
  autoArchiveAfterDays?: number;
  requireApproval: boolean;
  enableVersioning: boolean;
  enableComments: boolean;

  // Template settings (for template folders)
  isTemplate: boolean;
  templateName?: string;
  templateDescription?: string;
  templateStructure?: FolderTemplateStructure[];

  // Custom metadata
  customFields?: Record<string, any>;
}

/**
 * Folder template structure
 */
export interface FolderTemplateStructure {
  name: string;
  type: 'folder' | 'document_placeholder';
  description?: string;
  required: boolean;
  children?: FolderTemplateStructure[];
}

/**
 * Folder activity interface
 */
export interface FolderActivity {
  id: string;
  folderId: string;
  userId: string;
  action: FolderActivityType;
  description: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

/**
 * Folder activity types
 */
export enum FolderActivityType {
  CREATED = 'created',
  UPDATED = 'updated',
  DELETED = 'deleted',
  RESTORED = 'restored',
  MOVED = 'moved',
  COPIED = 'copied',
  RENAMED = 'renamed',
  SHARED = 'shared',
  PERMISSION_CHANGED = 'permission_changed',
  ARCHIVED = 'archived',
  LOCKED = 'locked',
  UNLOCKED = 'unlocked',
  DOCUMENT_ADDED = 'document_added',
  DOCUMENT_REMOVED = 'document_removed',
  SUBFOLDER_ADDED = 'subfolder_added',
  SUBFOLDER_REMOVED = 'subfolder_removed'
}

/**
 * Folder tree node interface
 */
export interface FolderTreeNode {
  id: string;
  name: string;
  path: string;
  level: number;
  parentId?: string;
  hasChildren: boolean;
  children?: FolderTreeNode[];
  documentCount: number;
  totalSize: number;
  permissions: FolderPermissionType[];
  isExpanded?: boolean;
}

/**
 * Main folder interface
 */
export interface Folder extends BaseEntity, SoftDeletable, Auditable {
  // Basic information
  name: string;
  description?: string;
  type: FolderType;
  status: FolderStatus;
  accessLevel: FolderAccessLevel;

  // Hierarchy
  parentId?: string;
  path: string; // full path for quick access (e.g., "/root/documents/projects")
  level: number; // depth in hierarchy (0 = root)
  position: number; // order within parent folder

  // Tree structure helpers
  leftBound: number; // for nested set model
  rightBound: number; // for nested set model
  hasChildren: boolean;

  // Metadata
  metadata: FolderMetadata;

  // Relationships
  permissions: FolderPermission[];
  activities: FolderActivity[];

  // Statistics (cached for performance)
  documentCount: number;
  subfolderCount: number;
  totalSize: number; // in bytes
  lastActivityAt?: Date;

  // Flags
  isShared: boolean;
  isLocked: boolean;
  lockedBy?: string;
  lockedAt?: Date;
  lockReason?: string;

  // Template information
  templateId?: string; // if created from template
  isTemplate: boolean;
}

/**
 * Folder creation input
 */
export interface CreateFolderInput {
  name: string;
  description?: string;
  type?: FolderType;
  accessLevel?: FolderAccessLevel;
  parentId?: string;
  position?: number;
  metadata?: Partial<FolderMetadata>;
  permissions?: Array<{
    userId?: string;
    groupId?: string;
    roleId?: string;
    permissions: FolderPermissionType[];
  }>;
  templateId?: string; // create from template
}

/**
 * Folder update input
 */
export interface UpdateFolderInput {
  name?: string;
  description?: string;
  type?: FolderType;
  status?: FolderStatus;
  accessLevel?: FolderAccessLevel;
  position?: number;
  metadata?: Partial<FolderMetadata>;
  isShared?: boolean;
}

/**
 * Folder move input
 */
export interface MoveFolderInput {
  targetParentId?: string;
  position?: number;
  preservePermissions?: boolean;
}

/**
 * Folder copy input
 */
export interface CopyFolderInput {
  targetParentId?: string;
  newName?: string;
  copyPermissions?: boolean;
  copyDocuments?: boolean;
  copySubfolders?: boolean;
  recursive?: boolean;
}

/**
 * Folder search filters
 */
export interface FolderSearchFilters {
  query?: string;
  type?: FolderType;
  status?: FolderStatus;
  accessLevel?: FolderAccessLevel;
  parentId?: string;
  level?: number;
  hasChildren?: boolean;
  isShared?: boolean;
  isLocked?: boolean;
  isTemplate?: boolean;
  createdBy?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  modifiedAfter?: Date;
  modifiedBefore?: Date;
  minSize?: number;
  maxSize?: number;
  minDocuments?: number;
  maxDocuments?: number;
  tags?: string[];
}

/**
 * Folder search result
 */
export interface FolderSearchResult {
  folders: Folder[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  facets?: {
    types: Array<{ type: FolderType; count: number }>;
    statuses: Array<{ status: FolderStatus; count: number }>;
    levels: Array<{ level: number; count: number }>;
    accessLevels: Array<{ accessLevel: FolderAccessLevel; count: number }>;
  };
}

/**
 * Folder statistics
 */
export interface FolderStatistics {
  totalFolders: number;
  totalSize: number; // in bytes
  foldersByType: Record<FolderType, number>;
  foldersByStatus: Record<FolderStatus, number>;
  foldersByAccessLevel: Record<FolderAccessLevel, number>;
  foldersByLevel: Array<{ level: number; count: number }>;
  averageFolderSize: number;
  largestFolders: Array<{ id: string; name: string; size: number }>;
  mostActiveFolders: Array<{ id: string; name: string; activityCount: number }>;
  recentActivity: FolderActivity[];
  orphanedFolders: number; // folders without valid parent
}

/**
 * Folder breadcrumb
 */
export interface FolderBreadcrumb {
  id: string;
  name: string;
  path: string;
  level: number;
}

/**
 * Folder database row interface (matches database schema)
 */
export interface FolderRow {
  id: string;
  name: string;
  description?: string;
  type: string;
  status: string;
  access_level: string;
  parent_id?: string;
  path: string;
  level: number;
  position: number;
  left_bound: number;
  right_bound: number;
  has_children: boolean;
  metadata: any; // JSONB
  document_count: number;
  subfolder_count: number;
  total_size: number;
  last_activity_at?: Date;
  is_shared: boolean;
  is_locked: boolean;
  locked_by?: string;
  locked_at?: Date;
  lock_reason?: string;
  template_id?: string;
  is_template: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
  created_by?: string;
  updated_by?: string;
}

/**
 * Bulk folder operation input
 */
export interface BulkFolderOperation {
  folderIds: string[];
  operation: 'delete' | 'restore' | 'move' | 'copy' | 'archive' | 'change_access_level' | 'lock' | 'unlock';
  parameters?: {
    targetParentId?: string;
    accessLevel?: FolderAccessLevel;
    lockReason?: string;
    [key: string]: any;
  };
}

/**
 * Folder template
 */
export interface FolderTemplate {
  id: string;
  name: string;
  description?: string;
  structure: FolderTemplateStructure[];
  metadata: FolderMetadata;
  isPublic: boolean;
  usageCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Folder quota information
 */
export interface FolderQuota {
  folderId: string;
  maxSize?: number; // in bytes
  maxDocuments?: number;
  maxSubfolders?: number;
  currentSize: number;
  currentDocuments: number;
  currentSubfolders: number;
  quotaExceeded: boolean;
  warningThreshold: number; // percentage (0-100)
  isWarning: boolean;
}

/**
 * Folder sync status (for external integrations)
 */
export interface FolderSyncStatus {
  folderId: string;
  provider: string; // 'sharepoint', 'googledrive', 'dropbox', etc.
  externalId: string;
  lastSyncAt: Date;
  syncStatus: 'synced' | 'pending' | 'error' | 'conflict';
  syncError?: string;
  conflictResolution?: 'local' | 'remote' | 'manual';
}

/**
 * Folder access log entry
 */
export interface FolderAccessLog {
  id: string;
  folderId: string;
  userId: string;
  action: 'view' | 'enter' | 'list' | 'search';
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  duration?: number; // in milliseconds
}

/**
 * Folder sharing link
 */
export interface FolderShareLink {
  id: string;
  folderId: string;
  token: string;
  permissions: FolderPermissionType[];
  expiresAt?: Date;
  password?: string;
  maxAccess?: number;
  accessCount: number;
  allowDownload: boolean;
  allowUpload: boolean;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  lastAccessedAt?: Date;
}