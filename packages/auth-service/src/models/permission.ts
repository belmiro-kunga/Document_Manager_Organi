// Permission model for Authentication Service
// Modelo de permissão para o Serviço de Autenticação

import { BaseEntity, SoftDeletable, Auditable } from './user';

/**
 * Permission types enum
 */
export enum PermissionType {
  // Document permissions
  DOCUMENT_READ = 'document:read',
  DOCUMENT_WRITE = 'document:write',
  DOCUMENT_DELETE = 'document:delete',
  DOCUMENT_SHARE = 'document:share',
  DOCUMENT_COMMENT = 'document:comment',
  DOCUMENT_DOWNLOAD = 'document:download',
  DOCUMENT_PRINT = 'document:print',
  DOCUMENT_COPY = 'document:copy',
  DOCUMENT_VERSION = 'document:version',
  DOCUMENT_ADMIN = 'document:admin',

  // Folder permissions
  FOLDER_READ = 'folder:read',
  FOLDER_WRITE = 'folder:write',
  FOLDER_DELETE = 'folder:delete',
  FOLDER_CREATE_SUBFOLDER = 'folder:create_subfolder',
  FOLDER_UPLOAD = 'folder:upload',
  FOLDER_SHARE = 'folder:share',
  FOLDER_ADMIN = 'folder:admin',
  FOLDER_INHERIT = 'folder:inherit',

  // System permissions
  SYSTEM_ADMIN = 'system:admin',
  SYSTEM_USER_MANAGE = 'system:user_manage',
  SYSTEM_ROLE_MANAGE = 'system:role_manage',
  SYSTEM_PERMISSION_MANAGE = 'system:permission_manage',
  SYSTEM_AUDIT_VIEW = 'system:audit_view',
  SYSTEM_SETTINGS_MANAGE = 'system:settings_manage',
  SYSTEM_BACKUP = 'system:backup',
  SYSTEM_RESTORE = 'system:restore',

  // Workflow permissions
  WORKFLOW_CREATE = 'workflow:create',
  WORKFLOW_EDIT = 'workflow:edit',
  WORKFLOW_DELETE = 'workflow:delete',
  WORKFLOW_EXECUTE = 'workflow:execute',
  WORKFLOW_APPROVE = 'workflow:approve',
  WORKFLOW_ADMIN = 'workflow:admin',

  // Report permissions
  REPORT_VIEW = 'report:view',
  REPORT_CREATE = 'report:create',
  REPORT_EDIT = 'report:edit',
  REPORT_DELETE = 'report:delete',
  REPORT_EXPORT = 'report:export',
  REPORT_ADMIN = 'report:admin',
}

/**
 * Permission scope enum
 */
export enum PermissionScope {
  GLOBAL = 'global',
  ORGANIZATION = 'organization',
  DEPARTMENT = 'department',
  PROJECT = 'project',
  FOLDER = 'folder',
  DOCUMENT = 'document',
}

/**
 * Permission effect enum
 */
export enum PermissionEffect {
  ALLOW = 'allow',
  DENY = 'deny',
}

/**
 * Permission inheritance type enum
 */
export enum PermissionInheritanceType {
  NONE = 'none',
  INHERIT = 'inherit',
  OVERRIDE = 'override',
  MERGE = 'merge',
}

/**
 * Permission condition interface
 */
export interface PermissionCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains' | 'regex';
  value: any;
  caseSensitive?: boolean;
}

/**
 * Permission constraint interface
 */
export interface PermissionConstraint {
  type: 'time' | 'ip' | 'location' | 'device' | 'custom';
  conditions: PermissionCondition[];
  description?: string;
}

/**
 * Permission metadata interface
 */
export interface PermissionMetadata {
  description?: string;
  tags?: string[];
  category?: string;
  priority: number; // Higher number = higher priority
  isSystemGenerated: boolean;
  isTemporary: boolean;
  reason?: string;
  approvedBy?: string;
  approvedAt?: Date;
  customFields?: Record<string, any>;
}

/**
 * Permission activity interface
 */
export interface PermissionActivity {
  id: string;
  permissionId: string;
  userId: string;
  action: PermissionActivityType;
  description: string;
  oldValue?: any;
  newValue?: any;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

/**
 * Permission activity types
 */
export enum PermissionActivityType {
  GRANTED = 'granted',
  REVOKED = 'revoked',
  MODIFIED = 'modified',
  INHERITED = 'inherited',
  OVERRIDDEN = 'overridden',
  EXPIRED = 'expired',
  ACTIVATED = 'activated',
  DEACTIVATED = 'deactivated',
  EVALUATED = 'evaluated',
  DENIED = 'denied',
}

/**
 * Main permission interface
 */
export interface Permission extends BaseEntity, SoftDeletable, Auditable {
  // Basic information
  name: string;
  description?: string;
  type: PermissionType;
  effect: PermissionEffect;
  scope: PermissionScope;

  // Subject (who has the permission)
  subjectType: 'user' | 'group' | 'role';
  subjectId: string;

  // Resource (what the permission applies to)
  resourceType: 'document' | 'folder' | 'system' | 'workflow' | 'report' | 'global';
  resourceId?: string; // null for global permissions

  // Inheritance
  inheritanceType: PermissionInheritanceType;
  parentPermissionId?: string;
  isInherited: boolean;
  inheritedFrom?: string; // resource ID where permission was inherited from

  // Constraints and conditions
  constraints: PermissionConstraint[];
  conditions: PermissionCondition[];

  // Temporal settings
  validFrom?: Date;
  validUntil?: Date;
  isActive: boolean;

  // Metadata
  metadata: PermissionMetadata;

  // Relationships
  activities: PermissionActivity[];

  // Evaluation cache (for performance)
  lastEvaluatedAt?: Date;
  evaluationResult?: boolean;
  evaluationContext?: Record<string, any>;
}

/**
 * Permission creation input
 */
export interface CreatePermissionInput {
  name?: string;
  description?: string;
  type: PermissionType;
  effect?: PermissionEffect;
  scope: PermissionScope;
  subjectType: 'user' | 'group' | 'role';
  subjectId: string;
  resourceType: 'document' | 'folder' | 'system' | 'workflow' | 'report' | 'global';
  resourceId?: string;
  inheritanceType?: PermissionInheritanceType;
  constraints?: PermissionConstraint[];
  conditions?: PermissionCondition[];
  validFrom?: Date;
  validUntil?: Date;
  metadata?: Partial<PermissionMetadata>;
}

/**
 * Permission update input
 */
export interface UpdatePermissionInput {
  name?: string;
  description?: string;
  effect?: PermissionEffect;
  constraints?: PermissionConstraint[];
  conditions?: PermissionCondition[];
  validFrom?: Date;
  validUntil?: Date;
  isActive?: boolean;
  metadata?: Partial<PermissionMetadata>;
}

/**
 * Permission evaluation context
 */
export interface PermissionEvaluationContext {
  userId: string;
  resourceType: string;
  resourceId?: string;
  action: PermissionType;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  location?: {
    country: string;
    city: string;
    coordinates?: [number, number];
  };
  device?: {
    type: string;
    os: string;
    browser: string;
  };
  customContext?: Record<string, any>;
}

/**
 * Permission evaluation result
 */
export interface PermissionEvaluationResult {
  allowed: boolean;
  permissions: Permission[];
  deniedPermissions: Permission[];
  inheritedPermissions: Permission[];
  effectivePermissions: PermissionType[];
  evaluationTime: number; // in milliseconds
  cacheHit: boolean;
  reason?: string;
  constraints?: PermissionConstraint[];
}

/**
 * Permission search filters
 */
export interface PermissionSearchFilters {
  query?: string;
  type?: PermissionType;
  effect?: PermissionEffect;
  scope?: PermissionScope;
  subjectType?: 'user' | 'group' | 'role';
  subjectId?: string;
  resourceType?: 'document' | 'folder' | 'system' | 'workflow' | 'report' | 'global';
  resourceId?: string;
  inheritanceType?: PermissionInheritanceType;
  isInherited?: boolean;
  isActive?: boolean;
  isExpired?: boolean;
  hasConstraints?: boolean;
  hasConditions?: boolean;
  createdBy?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  validFrom?: Date;
  validUntil?: Date;
  tags?: string[];
  category?: string;
}

/**
 * Permission search result
 */
export interface PermissionSearchResult {
  permissions: Permission[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  facets?: {
    types: Array<{ type: PermissionType; count: number }>;
    effects: Array<{ effect: PermissionEffect; count: number }>;
    scopes: Array<{ scope: PermissionScope; count: number }>;
    subjectTypes: Array<{ subjectType: string; count: number }>;
    resourceTypes: Array<{ resourceType: string; count: number }>;
  };
}

/**
 * Permission statistics
 */
export interface PermissionStatistics {
  totalPermissions: number;
  activePermissions: number;
  inheritedPermissions: number;
  expiredPermissions: number;
  permissionsByType: Record<PermissionType, number>;
  permissionsByEffect: Record<PermissionEffect, number>;
  permissionsByScope: Record<PermissionScope, number>;
  permissionsBySubjectType: Record<string, number>;
  permissionsByResourceType: Record<string, number>;
  mostUsedPermissions: Array<{ type: PermissionType; count: number }>;
  recentActivity: PermissionActivity[];
  evaluationMetrics: {
    totalEvaluations: number;
    averageEvaluationTime: number;
    cacheHitRate: number;
    deniedEvaluations: number;
  };
}

/**
 * Permission template interface
 */
export interface PermissionTemplate {
  id: string;
  name: string;
  description?: string;
  permissions: CreatePermissionInput[];
  isSystemTemplate: boolean;
  isPublic: boolean;
  usageCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Permission role interface
 */
export interface PermissionRole {
  id: string;
  name: string;
  description?: string;
  permissions: PermissionType[];
  isSystemRole: boolean;
  isActive: boolean;
  userCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Permission group interface
 */
export interface PermissionGroup {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
  members: string[]; // user IDs
  isSystemGroup: boolean;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Permission database row interface (matches database schema)
 */
export interface PermissionRow {
  id: string;
  name: string;
  description?: string;
  type: string;
  effect: string;
  scope: string;
  subject_type: string;
  subject_id: string;
  resource_type: string;
  resource_id?: string;
  inheritance_type: string;
  parent_permission_id?: string;
  is_inherited: boolean;
  inherited_from?: string;
  constraints: any; // JSONB
  conditions: any; // JSONB
  valid_from?: Date;
  valid_until?: Date;
  is_active: boolean;
  metadata: any; // JSONB
  last_evaluated_at?: Date;
  evaluation_result?: boolean;
  evaluation_context: any; // JSONB
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
  created_by?: string;
  updated_by?: string;
}

/**
 * Bulk permission operation input
 */
export interface BulkPermissionOperation {
  permissionIds: string[];
  operation: 'activate' | 'deactivate' | 'delete' | 'extend' | 'revoke' | 'copy';
  parameters?: {
    validUntil?: Date;
    targetSubjectId?: string;
    reason?: string;
    [key: string]: any;
  };
}

/**
 * Permission conflict resolution
 */
export interface PermissionConflict {
  resourceId: string;
  resourceType: string;
  subjectId: string;
  conflictingPermissions: Permission[];
  resolution: 'allow' | 'deny' | 'manual';
  resolvedBy?: string;
  resolvedAt?: Date;
  reason?: string;
}

/**
 * Permission inheritance chain
 */
export interface PermissionInheritanceChain {
  resourceId: string;
  resourceType: string;
  chain: Array<{
    resourceId: string;
    resourceType: string;
    permissions: Permission[];
    level: number;
  }>;
  effectivePermissions: Permission[];
}

/**
 * Permission audit log entry
 */
export interface PermissionAuditLog {
  id: string;
  permissionId: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  result: 'allowed' | 'denied';
  reason?: string;
  evaluationTime: number;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  context?: Record<string, any>;
}

/**
 * Permission cache entry
 */
export interface PermissionCacheEntry {
  key: string;
  userId: string;
  resourceType: string;
  resourceId?: string;
  permissions: PermissionType[];
  result: boolean;
  expiresAt: Date;
  createdAt: Date;
  hitCount: number;
  lastAccessedAt: Date;
}

/**
 * Permission recommendation
 */
export interface PermissionRecommendation {
  subjectId: string;
  subjectType: 'user' | 'group' | 'role';
  recommendedPermissions: PermissionType[];
  reason: string;
  confidence: number; // 0-1
  basedOn: 'role' | 'similar_users' | 'resource_access' | 'manual';
  metadata?: Record<string, any>;
}

/**
 * Permission compliance report
 */
export interface PermissionComplianceReport {
  reportId: string;
  generatedAt: Date;
  generatedBy: string;
  scope: {
    resourceType?: string;
    resourceIds?: string[];
    subjectIds?: string[];
  };
  findings: {
    excessivePermissions: Permission[];
    missingPermissions: PermissionRecommendation[];
    expiredPermissions: Permission[];
    conflictingPermissions: PermissionConflict[];
    unusedPermissions: Permission[];
  };
  summary: {
    totalPermissions: number;
    compliantPermissions: number;
    nonCompliantPermissions: number;
    complianceScore: number; // 0-100
  };
}
