// Permission model tests for Authentication Service
// Testes do modelo de permissão para o Serviço de Autenticação

import {
  Permission,
  ResourceType,
  PermissionAction,
  PermissionEffect,
  PermissionScope,
  PermissionInheritance,
  CreatePermissionInput,
  UpdatePermissionInput,
  PermissionCheckInput,
  PermissionContext,
  PermissionCondition,
} from '../../models/permission';

describe('Permission Model', () => {
  describe('Permission Interface', () => {
    it('should have all required properties', () => {
      const permission: Permission = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Read Document',
        description: 'Permission to read documents',
        subjectType: 'user',
        subjectId: '123e4567-e89b-12d3-a456-426614174001',
        resourceType: ResourceType.DOCUMENT,
        resourceId: '123e4567-e89b-12d3-a456-426614174002',
        actions: [PermissionAction.READ],
        effect: PermissionEffect.ALLOW,
        scope: PermissionScope.RESOURCE,
        inheritance: PermissionInheritance.NONE,
        usageCount: 0,
        isActive: true,
        isSystem: false,
        priority: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(permission.id).toBeDefined();
      expect(permission.name).toBeDefined();
      expect(permission.subjectType).toBeDefined();
      expect(permission.subjectId).toBeDefined();
      expect(permission.resourceType).toBeDefined();
      expect(permission.actions).toBeDefined();
      expect(permission.effect).toBeDefined();
      expect(permission.scope).toBeDefined();
      expect(permission.inheritance).toBeDefined();
      expect(permission.usageCount).toBeDefined();
      expect(permission.isActive).toBeDefined();
      expect(permission.isSystem).toBeDefined();
      expect(permission.priority).toBeDefined();
      expect(permission.createdAt).toBeDefined();
      expect(permission.updatedAt).toBeDefined();
    });

    it('should support optional properties', () => {
      const permission: Permission = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Global Admin',
        subjectType: 'role',
        subjectId: '123e4567-e89b-12d3-a456-426614174001',
        resourceType: ResourceType.SYSTEM,
        actions: [PermissionAction.ADMIN],
        effect: PermissionEffect.ALLOW,
        scope: PermissionScope.GLOBAL,
        inheritance: PermissionInheritance.ROLE,
        usageCount: 0,
        isActive: true,
        isSystem: true,
        priority: 1000,
        createdAt: new Date(),
        updatedAt: new Date(),
        // Optional properties
        description: 'Global system administration',
        resourceId: undefined, // Global permission
        inheritedFrom: '123e4567-e89b-12d3-a456-426614174003',
        conditions: [
          {
            field: 'time',
            operator: 'gte',
            value: '09:00',
          },
        ],
        constraints: {
          maxUsage: 100,
        },
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        lastUsedAt: new Date(),
        metadata: {
          department: 'IT',
          level: 'senior',
        },
        deletedAt: undefined,
        createdBy: '123e4567-e89b-12d3-a456-426614174004',
        updatedBy: '123e4567-e89b-12d3-a456-426614174005',
      };

      expect(permission.description).toBe('Global system administration');
      expect(permission.resourceId).toBeUndefined();
      expect(permission.inheritedFrom).toBeDefined();
      expect(permission.conditions).toHaveLength(1);
      expect(permission.constraints).toBeDefined();
      expect(permission.validFrom).toBeDefined();
      expect(permission.validUntil).toBeDefined();
      expect(permission.lastUsedAt).toBeDefined();
      expect(permission.metadata).toBeDefined();
      expect(permission.createdBy).toBeDefined();
      expect(permission.updatedBy).toBeDefined();
    });
  });

  describe('ResourceType Enum', () => {
    it('should contain all expected resource types', () => {
      const expectedTypes = [
        'document',
        'folder',
        'user',
        'system',
        'api',
        'workflow',
        'report',
        'template',
      ];

      const actualTypes = Object.values(ResourceType);
      expect(actualTypes).toEqual(expect.arrayContaining(expectedTypes));
      expect(actualTypes).toHaveLength(expectedTypes.length);
    });
  });

  describe('PermissionAction Enum', () => {
    it('should contain all expected actions', () => {
      const expectedActions = [
        'create',
        'read',
        'update',
        'delete',
        'download',
        'upload',
        'version',
        'comment',
        'approve',
        'reject',
        'list',
        'enter',
        'create_subfolder',
        'share',
        'grant_permission',
        'revoke_permission',
        'admin',
        'manage_users',
        'manage_roles',
        'manage_system',
        'start_workflow',
        'complete_task',
        'assign_task',
        'view_reports',
        'create_reports',
        'export_data',
      ];

      const actualActions = Object.values(PermissionAction);
      expect(actualActions).toEqual(expect.arrayContaining(expectedActions));
      expect(actualActions).toHaveLength(expectedActions.length);
    });
  });

  describe('PermissionEffect Enum', () => {
    it('should contain allow and deny effects', () => {
      expect(Object.values(PermissionEffect)).toEqual(['allow', 'deny']);
    });
  });

  describe('PermissionScope Enum', () => {
    it('should contain all expected scopes', () => {
      const expectedScopes = ['global', 'organization', 'department', 'project', 'resource'];
      const actualScopes = Object.values(PermissionScope);
      expect(actualScopes).toEqual(expect.arrayContaining(expectedScopes));
      expect(actualScopes).toHaveLength(expectedScopes.length);
    });
  });

  describe('PermissionInheritance Enum', () => {
    it('should contain all expected inheritance types', () => {
      const expectedTypes = ['none', 'parent', 'role', 'group', 'system'];
      const actualTypes = Object.values(PermissionInheritance);
      expect(actualTypes).toEqual(expect.arrayContaining(expectedTypes));
      expect(actualTypes).toHaveLength(expectedTypes.length);
    });
  });

  describe('CreatePermissionInput Interface', () => {
    it('should validate required fields', () => {
      const input: CreatePermissionInput = {
        name: 'Test Permission',
        subjectType: 'user',
        subjectId: '123e4567-e89b-12d3-a456-426614174000',
        resourceType: ResourceType.DOCUMENT,
        actions: [PermissionAction.READ],
      };

      expect(input.name).toBeDefined();
      expect(input.subjectType).toBeDefined();
      expect(input.subjectId).toBeDefined();
      expect(input.resourceType).toBeDefined();
      expect(input.actions).toBeDefined();
      expect(input.actions).toHaveLength(1);
    });

    it('should support optional fields with defaults', () => {
      const input: CreatePermissionInput = {
        name: 'Test Permission',
        description: 'Test description',
        subjectType: 'role',
        subjectId: '123e4567-e89b-12d3-a456-426614174000',
        resourceType: ResourceType.FOLDER,
        resourceId: '123e4567-e89b-12d3-a456-426614174001',
        actions: [PermissionAction.READ, PermissionAction.LIST],
        effect: PermissionEffect.DENY,
        scope: PermissionScope.DEPARTMENT,
        conditions: [
          {
            field: 'department',
            operator: 'eq',
            value: 'IT',
          },
        ],
        constraints: {
          timeRestriction: true,
        },
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        priority: 200,
        metadata: {
          source: 'manual',
        },
      };

      expect(input.description).toBe('Test description');
      expect(input.resourceId).toBeDefined();
      expect(input.effect).toBe(PermissionEffect.DENY);
      expect(input.scope).toBe(PermissionScope.DEPARTMENT);
      expect(input.conditions).toHaveLength(1);
      expect(input.constraints).toBeDefined();
      expect(input.validFrom).toBeDefined();
      expect(input.validUntil).toBeDefined();
      expect(input.priority).toBe(200);
      expect(input.metadata).toBeDefined();
    });
  });

  describe('UpdatePermissionInput Interface', () => {
    it('should allow partial updates', () => {
      const input: UpdatePermissionInput = {
        name: 'Updated Permission Name',
      };

      expect(input.name).toBe('Updated Permission Name');
      expect(input.description).toBeUndefined();
      expect(input.actions).toBeUndefined();
    });

    it('should support all updatable fields', () => {
      const input: UpdatePermissionInput = {
        name: 'Updated Permission',
        description: 'Updated description',
        actions: [PermissionAction.READ, PermissionAction.UPDATE],
        effect: PermissionEffect.ALLOW,
        scope: PermissionScope.PROJECT,
        conditions: [
          {
            field: 'role',
            operator: 'in',
            value: ['admin', 'manager'],
          },
        ],
        constraints: {
          maxDaily: 50,
        },
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
        isActive: false,
        priority: 150,
        metadata: {
          updated: true,
        },
      };

      expect(input.name).toBe('Updated Permission');
      expect(input.description).toBe('Updated description');
      expect(input.actions).toHaveLength(2);
      expect(input.effect).toBe(PermissionEffect.ALLOW);
      expect(input.scope).toBe(PermissionScope.PROJECT);
      expect(input.conditions).toHaveLength(1);
      expect(input.constraints).toBeDefined();
      expect(input.validFrom).toBeDefined();
      expect(input.validUntil).toBeDefined();
      expect(input.isActive).toBe(false);
      expect(input.priority).toBe(150);
      expect(input.metadata).toBeDefined();
    });
  });

  describe('PermissionCheckInput Interface', () => {
    it('should validate permission check structure', () => {
      const input: PermissionCheckInput = {
        subjectType: 'user',
        subjectId: '123e4567-e89b-12d3-a456-426614174000',
        resourceType: ResourceType.DOCUMENT,
        resourceId: '123e4567-e89b-12d3-a456-426614174001',
        action: PermissionAction.READ,
      };

      expect(input.subjectType).toBe('user');
      expect(input.subjectId).toBeDefined();
      expect(input.resourceType).toBe(ResourceType.DOCUMENT);
      expect(input.resourceId).toBeDefined();
      expect(input.action).toBe(PermissionAction.READ);
    });

    it('should support optional context', () => {
      const input: PermissionCheckInput = {
        subjectType: 'user',
        subjectId: '123e4567-e89b-12d3-a456-426614174000',
        resourceType: ResourceType.FOLDER,
        action: PermissionAction.LIST,
        context: {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          userRoles: ['123e4567-e89b-12d3-a456-426614174002'],
          userGroups: ['123e4567-e89b-12d3-a456-426614174003'],
          department: 'Engineering',
          organization: 'TechCorp',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0...',
          resourceOwner: '123e4567-e89b-12d3-a456-426614174004',
          resourceMetadata: {
            classification: 'confidential',
          },
        },
      };

      expect(input.context).toBeDefined();
      expect(input.context?.userId).toBeDefined();
      expect(input.context?.userRoles).toHaveLength(1);
      expect(input.context?.userGroups).toHaveLength(1);
      expect(input.context?.department).toBe('Engineering');
      expect(input.context?.organization).toBe('TechCorp');
      expect(input.context?.ipAddress).toBe('192.168.1.100');
      expect(input.context?.userAgent).toBeDefined();
      expect(input.context?.resourceOwner).toBeDefined();
      expect(input.context?.resourceMetadata).toBeDefined();
    });
  });

  describe('PermissionContext Interface', () => {
    it('should contain all context information', () => {
      const context: PermissionContext = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        userRoles: ['role1', 'role2'],
        userGroups: ['group1'],
        department: 'IT',
        organization: 'Company',
        ipAddress: '10.0.0.1',
        userAgent: 'TestAgent/1.0',
        timestamp: new Date(),
        resourceOwner: '123e4567-e89b-12d3-a456-426614174001',
        resourceMetadata: {
          sensitivity: 'high',
        },
      };

      expect(context.userId).toBeDefined();
      expect(context.userRoles).toHaveLength(2);
      expect(context.userGroups).toHaveLength(1);
      expect(context.department).toBe('IT');
      expect(context.organization).toBe('Company');
      expect(context.ipAddress).toBe('10.0.0.1');
      expect(context.userAgent).toBe('TestAgent/1.0');
      expect(context.timestamp).toBeInstanceOf(Date);
      expect(context.resourceOwner).toBeDefined();
      expect(context.resourceMetadata).toBeDefined();
    });
  });

  describe('PermissionCondition Interface', () => {
    it('should support different operators', () => {
      const conditions: PermissionCondition[] = [
        {
          field: 'time',
          operator: 'gte',
          value: '09:00',
        },
        {
          field: 'department',
          operator: 'eq',
          value: 'IT',
        },
        {
          field: 'roles',
          operator: 'in',
          value: ['admin', 'manager'],
        },
        {
          field: 'ip',
          operator: 'regex',
          value: '^192\\.168\\.',
        },
        {
          field: 'usage_count',
          operator: 'lt',
          value: 100,
        },
      ];

      expect(conditions).toHaveLength(5);
      expect(conditions[0].operator).toBe('gte');
      expect(conditions[1].operator).toBe('eq');
      expect(conditions[2].operator).toBe('in');
      expect(conditions[3].operator).toBe('regex');
      expect(conditions[4].operator).toBe('lt');
    });

    it('should support logical operators', () => {
      const condition: PermissionCondition = {
        field: 'department',
        operator: 'eq',
        value: 'IT',
        logicalOperator: 'and',
      };

      expect(condition.logicalOperator).toBe('and');
    });
  });

  describe('Permission Validation Logic', () => {
    it('should validate time-based permissions', () => {
      const permission: Permission = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Time-based Permission',
        subjectType: 'user',
        subjectId: '123e4567-e89b-12d3-a456-426614174001',
        resourceType: ResourceType.DOCUMENT,
        actions: [PermissionAction.READ],
        effect: PermissionEffect.ALLOW,
        scope: PermissionScope.RESOURCE,
        inheritance: PermissionInheritance.NONE,
        validFrom: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        usageCount: 0,
        isActive: true,
        isSystem: false,
        priority: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const now = new Date();
      const isValid = permission.validFrom! <= now && permission.validUntil! >= now;
      expect(isValid).toBe(true);
    });

    it('should validate expired permissions', () => {
      const permission: Permission = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Expired Permission',
        subjectType: 'user',
        subjectId: '123e4567-e89b-12d3-a456-426614174001',
        resourceType: ResourceType.DOCUMENT,
        actions: [PermissionAction.READ],
        effect: PermissionEffect.ALLOW,
        scope: PermissionScope.RESOURCE,
        inheritance: PermissionInheritance.NONE,
        validFrom: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
        validUntil: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        usageCount: 0,
        isActive: true,
        isSystem: false,
        priority: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const now = new Date();
      const isValid = permission.validFrom! <= now && permission.validUntil! >= now;
      expect(isValid).toBe(false);
    });

    it('should handle permissions without time restrictions', () => {
      const permission: Permission = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Permanent Permission',
        subjectType: 'user',
        subjectId: '123e4567-e89b-12d3-a456-426614174001',
        resourceType: ResourceType.DOCUMENT,
        actions: [PermissionAction.READ],
        effect: PermissionEffect.ALLOW,
        scope: PermissionScope.RESOURCE,
        inheritance: PermissionInheritance.NONE,
        usageCount: 0,
        isActive: true,
        isSystem: false,
        priority: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // No time restrictions means always valid
      expect(permission.validFrom).toBeUndefined();
      expect(permission.validUntil).toBeUndefined();
    });
  });

  describe('Permission Priority Logic', () => {
    it('should handle system permissions with high priority', () => {
      const systemPermission: Permission = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'System Permission',
        subjectType: 'role',
        subjectId: '123e4567-e89b-12d3-a456-426614174001',
        resourceType: ResourceType.SYSTEM,
        actions: [PermissionAction.ADMIN],
        effect: PermissionEffect.ALLOW,
        scope: PermissionScope.GLOBAL,
        inheritance: PermissionInheritance.SYSTEM,
        usageCount: 0,
        isActive: true,
        isSystem: true,
        priority: 1000, // High priority for system permissions
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(systemPermission.isSystem).toBe(true);
      expect(systemPermission.priority).toBe(1000);
      expect(systemPermission.inheritance).toBe(PermissionInheritance.SYSTEM);
    });

    it('should handle user permissions with normal priority', () => {
      const userPermission: Permission = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'User Permission',
        subjectType: 'user',
        subjectId: '123e4567-e89b-12d3-a456-426614174001',
        resourceType: ResourceType.DOCUMENT,
        actions: [PermissionAction.READ],
        effect: PermissionEffect.ALLOW,
        scope: PermissionScope.RESOURCE,
        inheritance: PermissionInheritance.NONE,
        usageCount: 0,
        isActive: true,
        isSystem: false,
        priority: 100, // Normal priority for user permissions
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(userPermission.isSystem).toBe(false);
      expect(userPermission.priority).toBe(100);
      expect(userPermission.inheritance).toBe(PermissionInheritance.NONE);
    });
  });

  describe('Permission Scope Logic', () => {
    it('should handle global permissions without resource ID', () => {
      const globalPermission: Permission = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Global Permission',
        subjectType: 'role',
        subjectId: '123e4567-e89b-12d3-a456-426614174001',
        resourceType: ResourceType.SYSTEM,
        resourceId: undefined, // Global permissions don't have specific resource
        actions: [PermissionAction.MANAGE_SYSTEM],
        effect: PermissionEffect.ALLOW,
        scope: PermissionScope.GLOBAL,
        inheritance: PermissionInheritance.ROLE,
        usageCount: 0,
        isActive: true,
        isSystem: false,
        priority: 500,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(globalPermission.scope).toBe(PermissionScope.GLOBAL);
      expect(globalPermission.resourceId).toBeUndefined();
    });

    it('should handle resource-specific permissions with resource ID', () => {
      const resourcePermission: Permission = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Resource Permission',
        subjectType: 'user',
        subjectId: '123e4567-e89b-12d3-a456-426614174001',
        resourceType: ResourceType.DOCUMENT,
        resourceId: '123e4567-e89b-12d3-a456-426614174002', // Specific resource
        actions: [PermissionAction.READ, PermissionAction.UPDATE],
        effect: PermissionEffect.ALLOW,
        scope: PermissionScope.RESOURCE,
        inheritance: PermissionInheritance.NONE,
        usageCount: 0,
        isActive: true,
        isSystem: false,
        priority: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(resourcePermission.scope).toBe(PermissionScope.RESOURCE);
      expect(resourcePermission.resourceId).toBeDefined();
    });
  });
});
