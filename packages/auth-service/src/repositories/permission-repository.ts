// Permission repository for Authentication Service
// Repositório de permissão para o Serviço de Autenticação

import { Pool, PoolClient } from 'pg';
import {
  Permission,
  PermissionRow,
  CreatePermissionInput,
  UpdatePermissionInput,
  PermissionSearchFilters,
  PermissionCheckInput,
  PermissionEvaluationResult,
  PermissionContext,
  PermissionInheritanceChain,
  PermissionStatistics,
  BulkPermissionOperation,
  PermissionAuditLog,
  ResourceType,
  PermissionAction,
  PermissionEffect,
  PermissionScope,
  PermissionInheritance,
} from '../models/permission';
import { DatabaseService } from '../services/database';
import { Logger } from '../utils/logger';

export class PermissionRepository {
  private db: DatabaseService;
  private logger: Logger;

  constructor(db: DatabaseService, logger: Logger) {
    this.db = db;
    this.logger = logger;
  }

  /**
   * Create a new permission
   */
  async create(input: CreatePermissionInput, createdBy: string): Promise<Permission> {
    const client = await this.db.getClient();

    try {
      await client.query('BEGIN');

      const query = `
        INSERT INTO permissions (
          id, name, description, subject_type, subject_id, resource_type, resource_id,
          actions, effect, scope, inheritance, conditions, constraints,
          valid_from, valid_until, priority, metadata, is_active, is_system,
          usage_count, created_by, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
          $13, $14, $15, $16, true, false, 0, $17, NOW(), NOW()
        ) RETURNING *
      `;

      const values = [
        input.name,
        input.description || null,
        input.subjectType,
        input.subjectId,
        input.resourceType,
        input.resourceId || null,
        JSON.stringify(input.actions),
        input.effect || PermissionEffect.ALLOW,
        input.scope || PermissionScope.RESOURCE,
        PermissionInheritance.NONE,
        input.conditions ? JSON.stringify(input.conditions) : null,
        input.constraints ? JSON.stringify(input.constraints) : null,
        input.validFrom || null,
        input.validUntil || null,
        input.priority || 100,
        input.metadata ? JSON.stringify(input.metadata) : null,
        createdBy,
      ];

      const result = await client.query(query, values);
      const permission = this.mapRowToPermission(result.rows[0]);

      // Log permission creation
      await this.logPermissionAudit(client, {
        permissionId: permission.id,
        action: 'created',
        subjectId: input.subjectId,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        permissionAction: input.actions[0], // Log first action
        result: 'success',
        context: {
          userId: createdBy,
          userRoles: [],
          userGroups: [],
          timestamp: new Date(),
        },
      });

      await client.query('COMMIT');

      this.logger.info('Permission created', {
        permissionId: permission.id,
        name: permission.name,
        createdBy,
      });

      return permission;
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error('Error creating permission', { error, input });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Find permission by ID
   */
  async findById(id: string): Promise<Permission | null> {
    const query = `
      SELECT * FROM permissions 
      WHERE id = $1 AND deleted_at IS NULL
    `;

    const result = await this.db.query(query, [id]);
    return result.rows.length > 0 ? this.mapRowToPermission(result.rows[0]) : null;
  }

  /**
   * Update permission
   */
  async update(
    id: string,
    input: UpdatePermissionInput,
    updatedBy: string
  ): Promise<Permission | null> {
    const client = await this.db.getClient();

    try {
      await client.query('BEGIN');

      const setClauses: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (input.name !== undefined) {
        setClauses.push(`name = $${paramIndex++}`);
        values.push(input.name);
      }
      if (input.description !== undefined) {
        setClauses.push(`description = $${paramIndex++}`);
        values.push(input.description);
      }
      if (input.actions !== undefined) {
        setClauses.push(`actions = $${paramIndex++}`);
        values.push(JSON.stringify(input.actions));
      }
      if (input.effect !== undefined) {
        setClauses.push(`effect = $${paramIndex++}`);
        values.push(input.effect);
      }
      if (input.scope !== undefined) {
        setClauses.push(`scope = $${paramIndex++}`);
        values.push(input.scope);
      }
      if (input.conditions !== undefined) {
        setClauses.push(`conditions = $${paramIndex++}`);
        values.push(input.conditions ? JSON.stringify(input.conditions) : null);
      }
      if (input.constraints !== undefined) {
        setClauses.push(`constraints = $${paramIndex++}`);
        values.push(input.constraints ? JSON.stringify(input.constraints) : null);
      }
      if (input.validFrom !== undefined) {
        setClauses.push(`valid_from = $${paramIndex++}`);
        values.push(input.validFrom);
      }
      if (input.validUntil !== undefined) {
        setClauses.push(`valid_until = $${paramIndex++}`);
        values.push(input.validUntil);
      }
      if (input.isActive !== undefined) {
        setClauses.push(`is_active = $${paramIndex++}`);
        values.push(input.isActive);
      }
      if (input.priority !== undefined) {
        setClauses.push(`priority = $${paramIndex++}`);
        values.push(input.priority);
      }
      if (input.metadata !== undefined) {
        setClauses.push(`metadata = $${paramIndex++}`);
        values.push(input.metadata ? JSON.stringify(input.metadata) : null);
      }

      if (setClauses.length === 0) {
        await client.query('ROLLBACK');
        return await this.findById(id);
      }

      setClauses.push(`updated_at = NOW()`);
      setClauses.push(`updated_by = $${paramIndex++}`);
      values.push(updatedBy);
      values.push(id);

      const query = `
        UPDATE permissions 
        SET ${setClauses.join(', ')}
        WHERE id = $${paramIndex} AND deleted_at IS NULL
        RETURNING *
      `;

      const result = await client.query(query, values);

      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }

      const permission = this.mapRowToPermission(result.rows[0]);

      // Log permission update
      await this.logPermissionAudit(client, {
        permissionId: permission.id,
        action: 'updated',
        subjectId: permission.subjectId,
        resourceType: permission.resourceType,
        resourceId: permission.resourceId,
        permissionAction: permission.actions[0],
        result: 'success',
        context: {
          userId: updatedBy,
          userRoles: [],
          userGroups: [],
          timestamp: new Date(),
        },
      });

      await client.query('COMMIT');

      this.logger.info('Permission updated', {
        permissionId: permission.id,
        updatedBy,
      });

      return permission;
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error('Error updating permission', { error, id, input });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Delete permission (soft delete)
   */
  async delete(id: string, deletedBy: string): Promise<boolean> {
    const client = await this.db.getClient();

    try {
      await client.query('BEGIN');

      const query = `
        UPDATE permissions 
        SET deleted_at = NOW(), updated_by = $2, is_active = false
        WHERE id = $1 AND deleted_at IS NULL
        RETURNING *
      `;

      const result = await client.query(query, [id, deletedBy]);

      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return false;
      }

      const permission = this.mapRowToPermission(result.rows[0]);

      // Log permission deletion
      await this.logPermissionAudit(client, {
        permissionId: permission.id,
        action: 'deleted',
        subjectId: permission.subjectId,
        resourceType: permission.resourceType,
        resourceId: permission.resourceId,
        permissionAction: permission.actions[0],
        result: 'success',
        context: {
          userId: deletedBy,
          userRoles: [],
          userGroups: [],
          timestamp: new Date(),
        },
      });

      await client.query('COMMIT');

      this.logger.info('Permission deleted', {
        permissionId: id,
        deletedBy,
      });

      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error('Error deleting permission', { error, id });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Search permissions with filters
   */
  async search(filters: PermissionSearchFilters): Promise<{
    permissions: Permission[];
    total: number;
    page: number;
    limit: number;
  }> {
    const whereClauses: string[] = ['deleted_at IS NULL'];
    const values: any[] = [];
    let paramIndex = 1;

    // Build WHERE clauses
    if (filters.query) {
      whereClauses.push(`(name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`);
      values.push(`%${filters.query}%`);
      paramIndex++;
    }

    if (filters.subjectType) {
      whereClauses.push(`subject_type = $${paramIndex++}`);
      values.push(filters.subjectType);
    }

    if (filters.subjectId) {
      whereClauses.push(`subject_id = $${paramIndex++}`);
      values.push(filters.subjectId);
    }

    if (filters.resourceType) {
      whereClauses.push(`resource_type = $${paramIndex++}`);
      values.push(filters.resourceType);
    }

    if (filters.resourceId) {
      whereClauses.push(`resource_id = $${paramIndex++}`);
      values.push(filters.resourceId);
    }

    if (filters.actions && filters.actions.length > 0) {
      whereClauses.push(`actions ?| $${paramIndex++}`);
      values.push(filters.actions);
    }

    if (filters.effect) {
      whereClauses.push(`effect = $${paramIndex++}`);
      values.push(filters.effect);
    }

    if (filters.scope) {
      whereClauses.push(`scope = $${paramIndex++}`);
      values.push(filters.scope);
    }

    if (filters.inheritance) {
      whereClauses.push(`inheritance = $${paramIndex++}`);
      values.push(filters.inheritance);
    }

    if (filters.isActive !== undefined) {
      whereClauses.push(`is_active = $${paramIndex++}`);
      values.push(filters.isActive);
    }

    if (filters.isSystem !== undefined) {
      whereClauses.push(`is_system = $${paramIndex++}`);
      values.push(filters.isSystem);
    }

    if (filters.validAt) {
      whereClauses.push(
        `(valid_from IS NULL OR valid_from <= $${paramIndex}) AND (valid_until IS NULL OR valid_until >= $${paramIndex})`
      );
      values.push(filters.validAt);
      paramIndex++;
    }

    if (filters.createdBy) {
      whereClauses.push(`created_by = $${paramIndex++}`);
      values.push(filters.createdBy);
    }

    if (filters.createdAfter) {
      whereClauses.push(`created_at >= $${paramIndex++}`);
      values.push(filters.createdAfter);
    }

    if (filters.createdBefore) {
      whereClauses.push(`created_at <= $${paramIndex++}`);
      values.push(filters.createdBefore);
    }

    if (filters.lastUsedAfter) {
      whereClauses.push(`last_used_at >= $${paramIndex++}`);
      values.push(filters.lastUsedAfter);
    }

    if (filters.lastUsedBefore) {
      whereClauses.push(`last_used_at <= $${paramIndex++}`);
      values.push(filters.lastUsedBefore);
    }

    const whereClause = whereClauses.join(' AND ');

    // Count total
    const countQuery = `SELECT COUNT(*) FROM permissions WHERE ${whereClause}`;
    const countResult = await this.db.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count);

    // Get permissions with pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;
    const sortBy = filters.sortBy || 'created_at';
    const sortOrder = filters.sortOrder || 'desc';

    const query = `
      SELECT * FROM permissions 
      WHERE ${whereClause}
      ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    values.push(limit, offset);
    const result = await this.db.query(query, values);
    const permissions = result.rows.map(row => this.mapRowToPermission(row));

    return {
      permissions,
      total,
      page,
      limit,
    };
  }

  /**
   * Check if a subject has permission for a specific action on a resource
   */
  async checkPermission(input: PermissionCheckInput): Promise<PermissionEvaluationResult> {
    const context: PermissionContext = {
      userId: input.context?.userId || input.subjectId,
      userRoles: input.context?.userRoles || [],
      userGroups: input.context?.userGroups || [],
      department: input.context?.department,
      organization: input.context?.organization,
      ipAddress: input.context?.ipAddress,
      userAgent: input.context?.userAgent,
      timestamp: new Date(),
      resourceOwner: input.context?.resourceOwner,
      resourceMetadata: input.context?.resourceMetadata,
    };

    try {
      // Get all applicable permissions with inheritance
      const permissions = await this.getApplicablePermissions(input);

      // Evaluate permissions
      const result = await this.evaluatePermissions(permissions, input, context);

      // Log permission check
      await this.logPermissionAudit(null, {
        permissionId: result.matchedPermissions[0]?.id || 'none',
        action: result.granted ? 'granted' : 'denied',
        subjectId: input.subjectId,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        permissionAction: input.action,
        result: result.granted ? 'success' : 'failure',
        reason: result.reason,
        context,
      });

      return result;
    } catch (error) {
      this.logger.error('Error checking permission', { error, input });

      return {
        granted: false,
        effect: PermissionEffect.DENY,
        matchedPermissions: [],
        reason: 'Error evaluating permissions',
        evaluatedAt: new Date(),
        context,
      };
    }
  }

  /**
   * Get permission inheritance chain for a subject
   */
  async getPermissionInheritanceChain(
    subjectId: string,
    resourceType: ResourceType,
    resourceId?: string
  ): Promise<PermissionInheritanceChain[]> {
    const query = `
      WITH RECURSIVE permission_hierarchy AS (
        -- Direct permissions
        SELECT 
          p.*,
          'direct' as source,
          p.subject_id as source_id,
          p.name as source_name,
          0 as level,
          false as is_overridden,
          null::uuid as overridden_by
        FROM permissions p
        WHERE p.subject_type = 'user' 
          AND p.subject_id = $1
          AND p.resource_type = $2
          AND ($3::uuid IS NULL OR p.resource_id = $3 OR p.resource_id IS NULL)
          AND p.deleted_at IS NULL
          AND p.is_active = true
        
        UNION ALL
        
        -- Role-based permissions
        SELECT 
          p.*,
          'role' as source,
          ur.role_id as source_id,
          r.name as source_name,
          1 as level,
          false as is_overridden,
          null::uuid as overridden_by
        FROM permissions p
        JOIN user_roles ur ON ur.role_id = p.subject_id
        JOIN roles r ON r.id = ur.role_id
        WHERE p.subject_type = 'role'
          AND ur.user_id = $1
          AND p.resource_type = $2
          AND ($3::uuid IS NULL OR p.resource_id = $3 OR p.resource_id IS NULL)
          AND p.deleted_at IS NULL
          AND p.is_active = true
          AND ur.deleted_at IS NULL
          AND r.deleted_at IS NULL
        
        UNION ALL
        
        -- Group-based permissions
        SELECT 
          p.*,
          'group' as source,
          ug.group_id as source_id,
          g.name as source_name,
          2 as level,
          false as is_overridden,
          null::uuid as overridden_by
        FROM permissions p
        JOIN user_groups ug ON ug.group_id = p.subject_id
        JOIN groups g ON g.id = ug.group_id
        WHERE p.subject_type = 'group'
          AND ug.user_id = $1
          AND p.resource_type = $2
          AND ($3::uuid IS NULL OR p.resource_id = $3 OR p.resource_id IS NULL)
          AND p.deleted_at IS NULL
          AND p.is_active = true
          AND ug.deleted_at IS NULL
          AND g.deleted_at IS NULL
      )
      SELECT * FROM permission_hierarchy
      ORDER BY level ASC, priority DESC, created_at ASC
    `;

    const result = await this.db.query(query, [subjectId, resourceType, resourceId]);

    return result.rows.map(row => ({
      permission: this.mapRowToPermission(row),
      source: row.source as 'direct' | 'role' | 'group' | 'parent' | 'system',
      sourceId: row.source_id,
      sourceName: row.source_name,
      level: row.level,
      isOverridden: row.is_overridden,
      overriddenBy: row.overridden_by ? this.mapRowToPermission(row) : undefined,
    }));
  }

  /**
   * Get permission statistics
   */
  async getStatistics(): Promise<PermissionStatistics> {
    const queries = {
      total: 'SELECT COUNT(*) as count FROM permissions WHERE deleted_at IS NULL',
      active:
        'SELECT COUNT(*) as count FROM permissions WHERE deleted_at IS NULL AND is_active = true',
      byType: `
        SELECT resource_type, COUNT(*) as count 
        FROM permissions 
        WHERE deleted_at IS NULL 
        GROUP BY resource_type
      `,
      byAction: `
        SELECT action, COUNT(*) as count
        FROM permissions p,
        LATERAL jsonb_array_elements_text(p.actions) as action
        WHERE p.deleted_at IS NULL
        GROUP BY action
      `,
      byEffect: `
        SELECT effect, COUNT(*) as count 
        FROM permissions 
        WHERE deleted_at IS NULL 
        GROUP BY effect
      `,
      byScope: `
        SELECT scope, COUNT(*) as count 
        FROM permissions 
        WHERE deleted_at IS NULL 
        GROUP BY scope
      `,
      mostUsed: `
        SELECT id, name, usage_count 
        FROM permissions 
        WHERE deleted_at IS NULL 
        ORDER BY usage_count DESC 
        LIMIT 10
      `,
      recentlyCreated: `
        SELECT * FROM permissions 
        WHERE deleted_at IS NULL 
        ORDER BY created_at DESC 
        LIMIT 10
      `,
      expiring: `
        SELECT * FROM permissions 
        WHERE deleted_at IS NULL 
          AND valid_until IS NOT NULL 
          AND valid_until <= NOW() + INTERVAL '7 days'
        ORDER BY valid_until ASC
      `,
      unused: `
        SELECT * FROM permissions 
        WHERE deleted_at IS NULL 
          AND usage_count = 0 
          AND created_at <= NOW() - INTERVAL '30 days'
        ORDER BY created_at ASC
        LIMIT 10
      `,
    };

    const [
      totalResult,
      activeResult,
      byTypeResult,
      byActionResult,
      byEffectResult,
      byScopeResult,
      mostUsedResult,
      recentlyCreatedResult,
      expiringResult,
      unusedResult,
    ] = await Promise.all([
      this.db.query(queries.total),
      this.db.query(queries.active),
      this.db.query(queries.byType),
      this.db.query(queries.byAction),
      this.db.query(queries.byEffect),
      this.db.query(queries.byScope),
      this.db.query(queries.mostUsed),
      this.db.query(queries.recentlyCreated),
      this.db.query(queries.expiring),
      this.db.query(queries.unused),
    ]);

    return {
      totalPermissions: parseInt(totalResult.rows[0].count),
      activePermissions: parseInt(activeResult.rows[0].count),
      permissionsByType: byTypeResult.rows.reduce(
        (acc, row) => {
          acc[row.resource_type as ResourceType] = parseInt(row.count);
          return acc;
        },
        {} as Record<ResourceType, number>
      ),
      permissionsByAction: byActionResult.rows.reduce(
        (acc, row) => {
          acc[row.action as PermissionAction] = parseInt(row.count);
          return acc;
        },
        {} as Record<PermissionAction, number>
      ),
      permissionsByEffect: byEffectResult.rows.reduce(
        (acc, row) => {
          acc[row.effect as PermissionEffect] = parseInt(row.count);
          return acc;
        },
        {} as Record<PermissionEffect, number>
      ),
      permissionsByScope: byScopeResult.rows.reduce(
        (acc, row) => {
          acc[row.scope as PermissionScope] = parseInt(row.count);
          return acc;
        },
        {} as Record<PermissionScope, number>
      ),
      mostUsedPermissions: mostUsedResult.rows.map(row => ({
        id: row.id,
        name: row.name,
        usageCount: row.usage_count,
      })),
      recentlyCreated: recentlyCreatedResult.rows.map(row => this.mapRowToPermission(row)),
      expiringPermissions: expiringResult.rows.map(row => this.mapRowToPermission(row)),
      unusedPermissions: unusedResult.rows.map(row => this.mapRowToPermission(row)),
      conflictingPermissions: [], // TODO: Implement conflict detection
    };
  }

  /**
   * Perform bulk operations on permissions
   */
  async bulkOperation(
    operation: BulkPermissionOperation,
    operatedBy: string
  ): Promise<{
    success: number;
    failed: number;
    errors: Array<{ id: string; error: string }>;
  }> {
    const client = await this.db.getClient();
    const results = { success: 0, failed: 0, errors: [] as Array<{ id: string; error: string }> };

    try {
      await client.query('BEGIN');

      for (const permissionId of operation.permissionIds) {
        try {
          let query = '';
          let values: any[] = [];

          switch (operation.operation) {
            case 'activate':
              query =
                'UPDATE permissions SET is_active = true, updated_by = $2, updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL';
              values = [permissionId, operatedBy];
              break;
            case 'deactivate':
              query =
                'UPDATE permissions SET is_active = false, updated_by = $2, updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL';
              values = [permissionId, operatedBy];
              break;
            case 'delete':
              query =
                'UPDATE permissions SET deleted_at = NOW(), updated_by = $2, is_active = false WHERE id = $1 AND deleted_at IS NULL';
              values = [permissionId, operatedBy];
              break;
            case 'update_priority':
              if (!operation.parameters?.priority) {
                throw new Error('Priority parameter required');
              }
              query =
                'UPDATE permissions SET priority = $3, updated_by = $2, updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL';
              values = [permissionId, operatedBy, operation.parameters.priority];
              break;
            case 'extend_validity':
              if (!operation.parameters?.validUntil) {
                throw new Error('ValidUntil parameter required');
              }
              query =
                'UPDATE permissions SET valid_until = $3, updated_by = $2, updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL';
              values = [permissionId, operatedBy, operation.parameters.validUntil];
              break;
            default:
              throw new Error(`Unknown operation: ${operation.operation}`);
          }

          const result = await client.query(query, values);

          if (result.rowCount === 0) {
            results.failed++;
            results.errors.push({
              id: permissionId,
              error: 'Permission not found or already deleted',
            });
          } else {
            results.success++;
          }
        } catch (error) {
          results.failed++;
          results.errors.push({
            id: permissionId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      await client.query('COMMIT');

      this.logger.info('Bulk permission operation completed', {
        operation: operation.operation,
        success: results.success,
        failed: results.failed,
        operatedBy,
      });

      return results;
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error('Error in bulk permission operation', { error, operation });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get applicable permissions for a permission check
   */
  private async getApplicablePermissions(input: PermissionCheckInput): Promise<Permission[]> {
    const query = `
      SELECT DISTINCT p.* FROM permissions p
      LEFT JOIN user_roles ur ON ur.role_id = p.subject_id AND p.subject_type = 'role'
      LEFT JOIN user_groups ug ON ug.group_id = p.subject_id AND p.subject_type = 'group'
      WHERE p.deleted_at IS NULL 
        AND p.is_active = true
        AND (
          (p.subject_type = $1 AND p.subject_id = $2) OR
          (p.subject_type = 'role' AND ur.user_id = $2 AND ur.deleted_at IS NULL) OR
          (p.subject_type = 'group' AND ug.user_id = $2 AND ug.deleted_at IS NULL)
        )
        AND p.resource_type = $3
        AND ($4::uuid IS NULL OR p.resource_id = $4 OR p.resource_id IS NULL)
        AND p.actions ? $5
        AND (p.valid_from IS NULL OR p.valid_from <= NOW())
        AND (p.valid_until IS NULL OR p.valid_until >= NOW())
      ORDER BY p.priority DESC, p.created_at ASC
    `;

    const result = await this.db.query(query, [
      input.subjectType,
      input.subjectId,
      input.resourceType,
      input.resourceId,
      input.action,
    ]);

    return result.rows.map(row => this.mapRowToPermission(row));
  }

  /**
   * Evaluate permissions and return result
   */
  private async evaluatePermissions(
    permissions: Permission[],
    input: PermissionCheckInput,
    context: PermissionContext
  ): Promise<PermissionEvaluationResult> {
    if (permissions.length === 0) {
      return {
        granted: false,
        effect: PermissionEffect.DENY,
        matchedPermissions: [],
        reason: 'No applicable permissions found',
        evaluatedAt: new Date(),
        context,
      };
    }

    // Check for explicit DENY permissions first (highest priority)
    const denyPermissions = permissions.filter(p => p.effect === PermissionEffect.DENY);
    for (const permission of denyPermissions) {
      if (await this.evaluateConditions(permission, context)) {
        return {
          granted: false,
          effect: PermissionEffect.DENY,
          matchedPermissions: [permission],
          deniedBy: permission,
          reason: 'Explicitly denied by permission',
          evaluatedAt: new Date(),
          context,
        };
      }
    }

    // Check for ALLOW permissions
    const allowPermissions = permissions.filter(p => p.effect === PermissionEffect.ALLOW);
    const matchedPermissions: Permission[] = [];

    for (const permission of allowPermissions) {
      if (await this.evaluateConditions(permission, context)) {
        matchedPermissions.push(permission);
      }
    }

    if (matchedPermissions.length > 0) {
      return {
        granted: true,
        effect: PermissionEffect.ALLOW,
        matchedPermissions,
        reason: 'Permission granted',
        evaluatedAt: new Date(),
        context,
      };
    }

    return {
      granted: false,
      effect: PermissionEffect.DENY,
      matchedPermissions: [],
      reason: 'No matching permissions found',
      evaluatedAt: new Date(),
      context,
    };
  }

  /**
   * Evaluate permission conditions
   */
  private async evaluateConditions(
    permission: Permission,
    context: PermissionContext
  ): Promise<boolean> {
    if (!permission.conditions || permission.conditions.length === 0) {
      return true; // No conditions means permission applies
    }

    // TODO: Implement condition evaluation logic
    // This would evaluate conditions like time-based restrictions, IP-based access, etc.
    return true;
  }

  /**
   * Log permission audit event
   */
  private async logPermissionAudit(
    client: PoolClient | null,
    audit: Omit<PermissionAuditLog, 'id' | 'timestamp'>
  ): Promise<void> {
    const query = `
      INSERT INTO permission_audit_logs (
        id, permission_id, action, subject_id, resource_type, resource_id,
        permission_action, result, reason, context, timestamp, metadata
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), $10
      )
    `;

    const values = [
      audit.permissionId,
      audit.action,
      audit.subjectId,
      audit.resourceType,
      audit.resourceId,
      audit.permissionAction,
      audit.result,
      audit.reason,
      JSON.stringify(audit.context),
      audit.metadata ? JSON.stringify(audit.metadata) : null,
    ];

    if (client) {
      await client.query(query, values);
    } else {
      await this.db.query(query, values);
    }
  }

  /**
   * Map database row to Permission object
   */
  private mapRowToPermission(row: PermissionRow): Permission {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      subjectType: row.subject_type as 'user' | 'role' | 'group' | 'api_key',
      subjectId: row.subject_id,
      resourceType: row.resource_type as ResourceType,
      resourceId: row.resource_id,
      actions: Array.isArray(row.actions) ? row.actions : JSON.parse(row.actions || '[]'),
      effect: row.effect as PermissionEffect,
      scope: row.scope as PermissionScope,
      inheritance: row.inheritance as PermissionInheritance,
      inheritedFrom: row.inherited_from,
      conditions: row.conditions ? JSON.parse(row.conditions) : undefined,
      constraints: row.constraints ? JSON.parse(row.constraints) : undefined,
      validFrom: row.valid_from,
      validUntil: row.valid_until,
      lastUsedAt: row.last_used_at,
      usageCount: row.usage_count,
      isActive: row.is_active,
      isSystem: row.is_system,
      priority: row.priority,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
      createdBy: row.created_by,
      updatedBy: row.updated_by,
    };
  }
}
