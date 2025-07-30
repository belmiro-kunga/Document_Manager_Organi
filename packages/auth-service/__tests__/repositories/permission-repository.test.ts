// Permission repository tests for Authentication Service
// Testes do repositório de permissão para o Serviço de Autenticação
import { PermissionRepository } from '../../src/repositories/permission-repository';
import { DatabaseService } from '../../src/services/database';
import {
  PermissionType,
  PermissionEffect,
  PermissionScope,
  PermissionInheritanceType,
  CreatePermissionInput,
  UpdatePermissionInput,
  PermissionSearchFilters,
  PermissionEvaluationContext,
} from '../../src/models/permission';

// Mock the database service
jest.mock('../../src/services/database');

describe('PermissionRepository', () => {
  let permissionRepository: PermissionRepository;
  let mockDb: jest.Mocked<typeof DatabaseService>;

  beforeEach(() => {
    permissionRepository = new PermissionRepository();
    mockDb = DatabaseService as jest.Mocked<typeof DatabaseService>;
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new permission successfully', async () => {
      const permissionData: CreatePermissionInput = {
        type: PermissionType.DOCUMENT_READ,
        effect: PermissionEffect.ALLOW,
        scope: PermissionScope.DOCUMENT,
        subjectType: 'user',
        subjectId: 'user-123',
        resourceType: 'document',
        resourceId: 'doc-123',
        description: 'Allow user to read document',
      };

      const mockPermissionRow = {
        id: 'perm-123',
        name: 'user:document:read:document',
        description: permissionData.description,
        type: permissionData.type,
        effect: permissionData.effect,
        scope: permissionData.scope,
        subject_type: permissionData.subjectType,
        subject_id: permissionData.subjectId,
        resource_type: permissionData.resourceType,
        resource_id: permissionData.resourceId,
        inheritance_type: PermissionInheritanceType.NONE,
        parent_permission_id: null,
        is_inherited: false,
        inherited_from: null,
        constraints: [],
        conditions: [],
        valid_from: null,
        valid_until: null,
        is_active: true,
        metadata: { priority: 50, isSystemGenerated: false, isTemporary: false },
        last_evaluated_at: null,
        evaluation_result: null,
        evaluation_context: null,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
        created_by: 'admin-123',
        updated_by: null,
      };

      // Mock transaction
      mockDb.transaction.mockImplementation(async callback => {
        const mockClient = {
          query: jest.fn().mockResolvedValue({
            rows: [mockPermissionRow],
            rowCount: 1,
            command: 'INSERT',
            oid: 0,
            fields: [],
          }),
        };
        return await callback(mockClient as any);
      });

      const result = await permissionRepository.create(permissionData, 'admin-123');

      expect(result).toBeDefined();
      expect(result.type).toBe(permissionData.type);
      expect(result.effect).toBe(permissionData.effect);
      expect(result.scope).toBe(permissionData.scope);
      expect(result.subjectType).toBe(permissionData.subjectType);
      expect(result.subjectId).toBe(permissionData.subjectId);
      expect(result.resourceType).toBe(permissionData.resourceType);
      expect(result.resourceId).toBe(permissionData.resourceId);
      expect(result.isActive).toBe(true);

      expect(mockDb.transaction).toHaveBeenCalledTimes(1);
    });

    it('should create permission with default values', async () => {
      const permissionData: CreatePermissionInput = {
        type: PermissionType.FOLDER_READ,
        scope: PermissionScope.FOLDER,
        subjectType: 'user',
        subjectId: 'user-123',
        resourceType: 'folder',
        resourceId: 'folder-123',
      };

      const mockPermissionRow = {
        id: 'perm-123',
        name: 'user:folder:read:folder',
        description: null,
        type: permissionData.type,
        effect: PermissionEffect.ALLOW,
        scope: permissionData.scope,
        subject_type: permissionData.subjectType,
        subject_id: permissionData.subjectId,
        resource_type: permissionData.resourceType,
        resource_id: permissionData.resourceId,
        inheritance_type: PermissionInheritanceType.NONE,
        parent_permission_id: null,
        is_inherited: false,
        inherited_from: null,
        constraints: [],
        conditions: [],
        valid_from: null,
        valid_until: null,
        is_active: true,
        metadata: { priority: 50, isSystemGenerated: false, isTemporary: false },
        last_evaluated_at: null,
        evaluation_result: null,
        evaluation_context: null,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
        created_by: 'admin-123',
        updated_by: null,
      };

      mockDb.transaction.mockImplementation(async callback => {
        const mockClient = {
          query: jest.fn().mockResolvedValue({
            rows: [mockPermissionRow],
            rowCount: 1,
            command: 'INSERT',
            oid: 0,
            fields: [],
          }),
        };
        return await callback(mockClient as any);
      });

      const result = await permissionRepository.create(permissionData, 'admin-123');

      expect(result.effect).toBe(PermissionEffect.ALLOW);
      expect(result.inheritanceType).toBe(PermissionInheritanceType.NONE);
      expect(result.metadata.priority).toBe(50);
    });
  });

  describe('findById', () => {
    it('should find permission by ID', async () => {
      const permissionId = 'perm-123';
      const mockPermissionRow = {
        id: permissionId,
        name: 'test-permission',
        description: 'Test permission',
        type: PermissionType.DOCUMENT_READ,
        effect: PermissionEffect.ALLOW,
        scope: PermissionScope.DOCUMENT,
        subject_type: 'user',
        subject_id: 'user-123',
        resource_type: 'document',
        resource_id: 'doc-123',
        inheritance_type: PermissionInheritanceType.NONE,
        parent_permission_id: null,
        is_inherited: false,
        inherited_from: null,
        constraints: [],
        conditions: [],
        valid_from: null,
        valid_until: null,
        is_active: true,
        metadata: {},
        last_evaluated_at: null,
        evaluation_result: null,
        evaluation_context: null,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
        created_by: 'admin-123',
        updated_by: null,
      };

      mockDb.query.mockResolvedValue({
        rows: [mockPermissionRow],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await permissionRepository.findById(permissionId);

      expect(result).toBeDefined();
      expect(result?.id).toBe(permissionId);
      expect(result?.type).toBe(PermissionType.DOCUMENT_READ);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM permissions WHERE id = $1 AND deleted_at IS NULL'),
        [permissionId]
      );
    });

    it('should return null if permission not found', async () => {
      mockDb.query.mockResolvedValue({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await permissionRepository.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findBySubject', () => {
    it('should find permissions by subject', async () => {
      const subjectType = 'user';
      const subjectId = 'user-123';
      const mockPermissionRows = [
        {
          id: 'perm-1',
          name: 'permission-1',
          type: PermissionType.DOCUMENT_READ,
          subject_type: subjectType,
          subject_id: subjectId,
          is_inherited: false,
          // ... other fields
        },
        {
          id: 'perm-2',
          name: 'permission-2',
          type: PermissionType.DOCUMENT_WRITE,
          subject_type: subjectType,
          subject_id: subjectId,
          is_inherited: true,
          // ... other fields
        },
      ];

      mockDb.query.mockResolvedValue({
        rows: mockPermissionRows,
        rowCount: 2,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await permissionRepository.findBySubject(subjectType, subjectId);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('perm-1');
      expect(result[1].id).toBe('perm-2');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE subject_type = $1 AND subject_id = $2'),
        [subjectType, subjectId]
      );
    });

    it('should exclude inherited permissions when requested', async () => {
      const subjectType = 'user';
      const subjectId = 'user-123';

      mockDb.query.mockResolvedValue({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      await permissionRepository.findBySubject(subjectType, subjectId, false);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('AND is_inherited = false'),
        [subjectType, subjectId]
      );
    });
  });

  describe('findByResource', () => {
    it('should find permissions by resource', async () => {
      const resourceType = 'document';
      const resourceId = 'doc-123';

      const mockPermissionRows = [
        {
          id: 'perm-1',
          name: 'permission-1',
          resource_type: resourceType,
          resource_id: resourceId,
          // ... other fields
        },
      ];

      mockDb.query.mockResolvedValue({
        rows: mockPermissionRows,
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await permissionRepository.findByResource(resourceType, resourceId);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('perm-1');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE resource_type = $1 AND resource_id = $2'),
        [resourceType, resourceId]
      );
    });

    it('should find global permissions when resourceId is not provided', async () => {
      const resourceType = 'document';

      mockDb.query.mockResolvedValue({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      await permissionRepository.findByResource(resourceType);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE resource_type = $1 AND resource_id IS NULL'),
        [resourceType]
      );
    });
  });

  describe('evaluatePermissions', () => {
    it('should evaluate permissions and return result', async () => {
      const context: PermissionEvaluationContext = {
        userId: 'user-123',
        resourceType: 'document',
        resourceId: 'doc-123',
        action: PermissionType.DOCUMENT_READ,
        timestamp: new Date(),
      };

      // Mock the private methods
      jest.spyOn(permissionRepository as any, 'getFromCache').mockResolvedValue(null);
      jest.spyOn(permissionRepository as any, 'getApplicablePermissions').mockResolvedValue([
        {
          id: 'perm-1',
          type: PermissionType.DOCUMENT_READ,
          effect: PermissionEffect.ALLOW,
          isInherited: false,
          constraints: [],
          conditions: [],
        },
      ]);
      jest.spyOn(permissionRepository as any, 'filterValidPermissions').mockResolvedValue([
        {
          id: 'perm-1',
          type: PermissionType.DOCUMENT_READ,
          effect: PermissionEffect.ALLOW,
        },
      ]);
      jest.spyOn(permissionRepository as any, 'cacheResult').mockResolvedValue(undefined);
      jest.spyOn(permissionRepository as any, 'logEvaluation').mockResolvedValue(undefined);

      const result = await permissionRepository.evaluatePermissions(context);

      expect(result).toBeDefined();
      expect(result.allowed).toBe(true);
      expect(result.effectivePermissions).toContain(PermissionType.DOCUMENT_READ);
      expect(result.cacheHit).toBe(false);
      expect(typeof result.evaluationTime).toBe('number');
    });

    it('should return cached result when available', async () => {
      const context: PermissionEvaluationContext = {
        userId: 'user-123',
        resourceType: 'document',
        resourceId: 'doc-123',
        action: PermissionType.DOCUMENT_READ,
        timestamp: new Date(),
      };

      const cachedResult = {
        result: true,
        permissions: [PermissionType.DOCUMENT_READ],
      };

      jest.spyOn(permissionRepository as any, 'getFromCache').mockResolvedValue(cachedResult);

      const result = await permissionRepository.evaluatePermissions(context);

      expect(result.allowed).toBe(true);
      expect(result.cacheHit).toBe(true);
      expect(result.effectivePermissions).toEqual([PermissionType.DOCUMENT_READ]);
    });

    it('should deny access when deny permissions exist', async () => {
      const context: PermissionEvaluationContext = {
        userId: 'user-123',
        resourceType: 'document',
        resourceId: 'doc-123',
        action: PermissionType.DOCUMENT_READ,
        timestamp: new Date(),
      };

      jest.spyOn(permissionRepository as any, 'getFromCache').mockResolvedValue(null);
      jest.spyOn(permissionRepository as any, 'getApplicablePermissions').mockResolvedValue([
        {
          id: 'perm-1',
          type: PermissionType.DOCUMENT_READ,
          effect: PermissionEffect.DENY,
          isInherited: false,
        },
      ]);
      jest
        .spyOn(permissionRepository as any, 'filterValidPermissions')
        .mockResolvedValueOnce([]) // allow permissions
        .mockResolvedValueOnce([
          {
            // deny permissions
            id: 'perm-1',
            type: PermissionType.DOCUMENT_READ,
            effect: PermissionEffect.DENY,
          },
        ]);
      jest.spyOn(permissionRepository as any, 'cacheResult').mockResolvedValue(undefined);
      jest.spyOn(permissionRepository as any, 'logEvaluation').mockResolvedValue(undefined);

      const result = await permissionRepository.evaluatePermissions(context);

      expect(result.allowed).toBe(false);
      expect(result.deniedPermissions).toHaveLength(1);
      expect(result.effectivePermissions).toHaveLength(0);
    });
  });

  describe('update', () => {
    it('should update permission successfully', async () => {
      const permissionId = 'perm-123';
      const updateData: UpdatePermissionInput = {
        name: 'Updated Permission',
        description: 'Updated description',
        effect: PermissionEffect.DENY,
      };

      const mockUpdatedRow = {
        id: permissionId,
        name: updateData.name,
        description: updateData.description,
        type: PermissionType.DOCUMENT_READ,
        effect: updateData.effect,
        scope: PermissionScope.DOCUMENT,
        subject_type: 'user',
        subject_id: 'user-123',
        resource_type: 'document',
        resource_id: 'doc-123',
        inheritance_type: PermissionInheritanceType.NONE,
        parent_permission_id: null,
        is_inherited: false,
        inherited_from: null,
        constraints: [],
        conditions: [],
        valid_from: null,
        valid_until: null,
        is_active: true,
        metadata: {},
        last_evaluated_at: null,
        evaluation_result: null,
        evaluation_context: null,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
        created_by: 'admin-123',
        updated_by: 'admin-456',
      };

      // Mock findById for metadata merge
      jest.spyOn(permissionRepository, 'findById').mockResolvedValue({
        id: permissionId,
        metadata: { priority: 50 },
        // ... other fields
      } as any);

      // Mock transaction
      mockDb.transaction.mockImplementation(async callback => {
        const mockClient = {
          query: jest.fn().mockResolvedValue({
            rows: [mockUpdatedRow],
            rowCount: 1,
            command: 'UPDATE',
            oid: 0,
            fields: [],
          }),
        };
        return await callback(mockClient as any);
      });

      const result = await permissionRepository.update(permissionId, updateData, 'admin-456');

      expect(result).toBeDefined();
      expect(result?.name).toBe(updateData.name);
      expect(result?.description).toBe(updateData.description);
      expect(result?.effect).toBe(updateData.effect);

      expect(mockDb.transaction).toHaveBeenCalledTimes(1);
    });

    it('should return existing permission if no updates provided', async () => {
      const permissionId = 'perm-123';
      const existingPermission = {
        id: permissionId,
        name: 'Existing Permission',
        // ... other fields
      };

      jest.spyOn(permissionRepository, 'findById').mockResolvedValue(existingPermission as any);

      mockDb.transaction.mockImplementation(async callback => {
        const mockClient = {} as any;
        return await callback(mockClient);
      });

      const result = await permissionRepository.update(permissionId, {}, 'admin-456');

      expect(result).toBe(existingPermission);
      expect(permissionRepository.findById).toHaveBeenCalledWith(permissionId);
    });
  });

  describe('revoke', () => {
    it('should revoke permission successfully', async () => {
      const permissionId = 'perm-123';
      const permission = {
        id: permissionId,
        subjectId: 'user-123',
        resourceType: 'document',
        resourceId: 'doc-123',
      };

      jest.spyOn(permissionRepository, 'findById').mockResolvedValue(permission as any);

      mockDb.transaction.mockImplementation(async callback => {
        const mockClient = {
          query: jest.fn().mockResolvedValue({
            rows: [],
            rowCount: 1,
            command: 'UPDATE',
            oid: 0,
            fields: [],
          }),
        };
        return await callback(mockClient as any);
      });

      const result = await permissionRepository.revoke(
        permissionId,
        'admin-123',
        'No longer needed'
      );

      expect(result).toBe(true);
      expect(mockDb.transaction).toHaveBeenCalledTimes(1);
    });

    it('should return false if permission not found', async () => {
      jest.spyOn(permissionRepository, 'findById').mockResolvedValue(null);

      mockDb.transaction.mockImplementation(async callback => {
        const mockClient = {} as any;
        return await callback(mockClient);
      });

      const result = await permissionRepository.revoke('non-existent-id', 'admin-123');

      expect(result).toBe(false);
    });
  });

  describe('search', () => {
    it('should search permissions with filters and pagination', async () => {
      const filters: PermissionSearchFilters = {
        type: PermissionType.DOCUMENT_READ,
        effect: PermissionEffect.ALLOW,
        subjectType: 'user',
        page: 1,
        limit: 10,
      };

      const mockPermissionRow = {
        id: 'perm-123',
        name: 'test-permission',
        type: PermissionType.DOCUMENT_READ,
        effect: PermissionEffect.ALLOW,
        subject_type: 'user',
        // ... other fields
      };

      // Mock count query
      mockDb.query
        .mockResolvedValueOnce({
          rows: [{ count: '1' }],
          rowCount: 1,
          command: 'SELECT',
          oid: 0,
          fields: [],
        })
        // Mock search query
        .mockResolvedValueOnce({
          rows: [mockPermissionRow],
          rowCount: 1,
          command: 'SELECT',
          oid: 0,
          fields: [],
        });

      const result = await permissionRepository.search(filters);

      expect(result).toBeDefined();
      expect(result.permissions).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.pages).toBe(1);

      expect(mockDb.query).toHaveBeenCalledTimes(2);
    });
  });

  describe('getStatistics', () => {
    it('should return permission statistics', async () => {
      const mockResults = [
        { rows: [{ total: '100' }] }, // total permissions
        { rows: [{ active: '85' }] }, // active permissions
        { rows: [{ inherited: '25' }] }, // inherited permissions
        { rows: [{ expired: '5' }] }, // expired permissions
        {
          rows: [
            { type: 'document:read', count: '30' },
            { type: 'folder:read', count: '20' },
          ],
        }, // by type
        {
          rows: [
            { effect: 'allow', count: '90' },
            { effect: 'deny', count: '10' },
          ],
        }, // by effect
        {
          rows: [
            { scope: 'document', count: '50' },
            { scope: 'folder', count: '30' },
          ],
        }, // by scope
        {
          rows: [
            { subject_type: 'user', count: '70' },
            { subject_type: 'role', count: '30' },
          ],
        }, // by subject type
        {
          rows: [
            { resource_type: 'document', count: '60' },
            { resource_type: 'folder', count: '40' },
          ],
        }, // by resource type
      ];

      // Mock all queries
      mockResults.forEach((result, index) => {
        mockDb.query.mockResolvedValueOnce(result as any);
      });

      const result = await permissionRepository.getStatistics();

      expect(result).toBeDefined();
      expect(result.totalPermissions).toBe(100);
      expect(result.activePermissions).toBe(85);
      expect(result.inheritedPermissions).toBe(25);
      expect(result.expiredPermissions).toBe(5);
      expect(result.permissionsByType).toBeDefined();
      expect(result.permissionsByEffect).toBeDefined();
      expect(result.permissionsByScope).toBeDefined();
      expect(result.permissionsBySubjectType).toBeDefined();
      expect(result.permissionsByResourceType).toBeDefined();
      expect(result.mostUsedPermissions).toHaveLength(2);

      expect(mockDb.query).toHaveBeenCalledTimes(9);
    });
  });
});
