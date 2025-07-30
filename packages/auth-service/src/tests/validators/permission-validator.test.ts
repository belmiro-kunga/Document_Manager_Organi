// Permission validator tests for Authentication Service
// Testes do validador de permissão para o Serviço de Autenticação

import {
  validateCreatePermission,
  validateUpdatePermission,
  validatePermissionCheck,
  validatePermissionSearch,
  validateBulkPermissionOperation,
  validatePermissionDelegation,
  validatePermissionRequest,
  customPermissionValidations,
} from '../../validators/permission-validator';
import {
  ResourceType,
  PermissionAction,
  PermissionEffect,
  PermissionScope,
  PermissionInheritance,
} from '../../models/permission';

describe('Permission Validator', () => {
  describe('validateCreatePermission', () => {
    it('should validate valid permission creation input', () => {
      const validInput = {
        name: 'Test Permission',
        description: 'Test description',
        subjectType: 'user',
        subjectId: '123e4567-e89b-12d3-a456-426614174000',
        resourceType: ResourceType.DOCUMENT,
        resourceId: '123e4567-e89b-12d3-a456-426614174001',
        actions: [PermissionAction.READ, PermissionAction.UPDATE],
        effect: PermissionEffect.ALLOW,
        scope: PermissionScope.RESOURCE,
        priority: 100,
      };

      const { error, value } = validateCreatePermission(validInput);

      expect(error).toBeUndefined();
      expect(value).toBeDefined();
      expect(value.name).toBe('Test Permission');
      expect(value.actions).toHaveLength(2);
      expect(value.effect).toBe(PermissionEffect.ALLOW);
      expect(value.scope).toBe(PermissionScope.RESOURCE);
      expect(value.priority).toBe(100);
    });

    it('should apply default values', () => {
      const minimalInput = {
        name: 'Minimal Permission',
        subjectType: 'user',
        subjectId: '123e4567-e89b-12d3-a456-426614174000',
        resourceType: ResourceType.DOCUMENT,
        actions: [PermissionAction.READ],
      };

      const { error, value } = validateCreatePermission(minimalInput);

      expect(error).toBeUndefined();
      expect(value.effect).toBe(PermissionEffect.ALLOW); // Default
      expect(value.scope).toBe(PermissionScope.RESOURCE); // Default
      expect(value.priority).toBe(100); // Default
    });

    it('should reject invalid input - missing required fields', () => {
      const invalidInput = {
        name: 'Test Permission',
        // Missing required fields
      };

      const { error } = validateCreatePermission(invalidInput);

      expect(error).toBeDefined();
      expect(error?.details).toBeDefined();
      expect(error?.details.length).toBeGreaterThan(0);
    });

    it('should reject invalid input - invalid UUID', () => {
      const invalidInput = {
        name: 'Test Permission',
        subjectType: 'user',
        subjectId: 'invalid-uuid',
        resourceType: ResourceType.DOCUMENT,
        actions: [PermissionAction.READ],
      };

      const { error } = validateCreatePermission(invalidInput);

      expect(error).toBeDefined();
      expect(error?.details.some(d => d.message.includes('UUID'))).toBe(true);
    });

    it('should reject invalid input - empty actions array', () => {
      const invalidInput = {
        name: 'Test Permission',
        subjectType: 'user',
        subjectId: '123e4567-e89b-12d3-a456-426614174000',
        resourceType: ResourceType.DOCUMENT,
        actions: [],
      };

      const { error } = validateCreatePermission(invalidInput);

      expect(error).toBeDefined();
      expect(error?.details.some(d => d.message.includes('pelo menos uma ação'))).toBe(true);
    });

    it('should reject invalid input - invalid priority range', () => {
      const invalidInput = {
        name: 'Test Permission',
        subjectType: 'user',
        subjectId: '123e4567-e89b-12d3-a456-426614174000',
        resourceType: ResourceType.DOCUMENT,
        actions: [PermissionAction.READ],
        priority: 1001, // Above max
      };

      const { error } = validateCreatePermission(invalidInput);

      expect(error).toBeDefined();
      expect(error?.details.some(d => d.message.includes('1000'))).toBe(true);
    });

    it('should validate time constraints', () => {
      const validFrom = new Date();
      const validUntil = new Date(validFrom.getTime() + 24 * 60 * 60 * 1000); // 1 day later

      const validInput = {
        name: 'Time-based Permission',
        subjectType: 'user',
        subjectId: '123e4567-e89b-12d3-a456-426614174000',
        resourceType: ResourceType.DOCUMENT,
        actions: [PermissionAction.READ],
        validFrom,
        validUntil,
      };

      const { error } = validateCreatePermission(validInput);
      expect(error).toBeUndefined();
    });

    it('should reject invalid time constraints', () => {
      const validFrom = new Date();
      const validUntil = new Date(validFrom.getTime() - 24 * 60 * 60 * 1000); // 1 day before

      const invalidInput = {
        name: 'Invalid Time Permission',
        subjectType: 'user',
        subjectId: '123e4567-e89b-12d3-a456-426614174000',
        resourceType: ResourceType.DOCUMENT,
        actions: [PermissionAction.READ],
        validFrom,
        validUntil,
      };

      const { error } = validateCreatePermission(invalidInput);
      expect(error).toBeDefined();
      expect(error?.details.some(d => d.message.includes('posterior'))).toBe(true);
    });

    it('should validate conditions array', () => {
      const validInput = {
        name: 'Conditional Permission',
        subjectType: 'user',
        subjectId: '123e4567-e89b-12d3-a456-426614174000',
        resourceType: ResourceType.DOCUMENT,
        actions: [PermissionAction.READ],
        conditions: [
          {
            field: 'department',
            operator: 'eq',
            value: 'IT',
          },
          {
            field: 'time',
            operator: 'gte',
            value: '09:00',
            logicalOperator: 'and',
          },
        ],
      };

      const { error } = validateCreatePermission(validInput);
      expect(error).toBeUndefined();
    });
  });

  describe('validateUpdatePermission', () => {
    it('should validate partial updates', () => {
      const updateInput = {
        name: 'Updated Permission Name',
      };

      const { error, value } = validateUpdatePermission(updateInput);

      expect(error).toBeUndefined();
      expect(value.name).toBe('Updated Permission Name');
    });

    it('should validate multiple field updates', () => {
      const updateInput = {
        name: 'Updated Permission',
        description: 'Updated description',
        actions: [PermissionAction.READ, PermissionAction.UPDATE, PermissionAction.DELETE],
        effect: PermissionEffect.DENY,
        isActive: false,
        priority: 200,
      };

      const { error, value } = validateUpdatePermission(updateInput);

      expect(error).toBeUndefined();
      expect(value.name).toBe('Updated Permission');
      expect(value.actions).toHaveLength(3);
      expect(value.effect).toBe(PermissionEffect.DENY);
      expect(value.isActive).toBe(false);
      expect(value.priority).toBe(200);
    });

    it('should reject invalid updates', () => {
      const invalidInput = {
        name: '', // Empty name
        priority: -1, // Invalid priority
      };

      const { error } = validateUpdatePermission(invalidInput);
      expect(error).toBeDefined();
    });
  });

  describe('validatePermissionCheck', () => {
    it('should validate permission check input', () => {
      const checkInput = {
        subjectType: 'user',
        subjectId: '123e4567-e89b-12d3-a456-426614174000',
        resourceType: ResourceType.DOCUMENT,
        resourceId: '123e4567-e89b-12d3-a456-426614174001',
        action: PermissionAction.READ,
      };

      const { error, value } = validatePermissionCheck(checkInput);

      expect(error).toBeUndefined();
      expect(value.subjectType).toBe('user');
      expect(value.action).toBe(PermissionAction.READ);
    });

    it('should validate permission check with context', () => {
      const checkInput = {
        subjectType: 'user',
        subjectId: '123e4567-e89b-12d3-a456-426614174000',
        resourceType: ResourceType.FOLDER,
        action: PermissionAction.LIST,
        context: {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          userRoles: ['123e4567-e89b-12d3-a456-426614174002'],
          department: 'Engineering',
          ipAddress: '192.168.1.100',
        },
      };

      const { error, value } = validatePermissionCheck(checkInput);

      expect(error).toBeUndefined();
      expect(value.context).toBeDefined();
      expect(value.context?.department).toBe('Engineering');
    });

    it('should reject invalid permission check', () => {
      const invalidInput = {
        subjectType: 'invalid-type',
        subjectId: 'invalid-uuid',
        resourceType: 'invalid-resource',
        action: 'invalid-action',
      };

      const { error } = validatePermissionCheck(invalidInput);
      expect(error).toBeDefined();
      expect(error?.details.length).toBeGreaterThan(0);
    });
  });

  describe('validatePermissionSearch', () => {
    it('should validate search filters', () => {
      const searchFilters = {
        query: 'test permission',
        subjectType: 'user',
        resourceType: ResourceType.DOCUMENT,
        actions: [PermissionAction.READ],
        effect: PermissionEffect.ALLOW,
        isActive: true,
        page: 1,
        limit: 20,
        sortBy: 'name',
        sortOrder: 'asc',
      };

      const { error, value } = validatePermissionSearch(searchFilters);

      expect(error).toBeUndefined();
      expect(value.query).toBe('test permission');
      expect(value.page).toBe(1);
      expect(value.limit).toBe(20);
      expect(value.sortBy).toBe('name');
      expect(value.sortOrder).toBe('asc');
    });

    it('should apply default values for pagination', () => {
      const searchFilters = {
        query: 'test',
      };

      const { error, value } = validatePermissionSearch(searchFilters);

      expect(error).toBeUndefined();
      expect(value.page).toBe(1); // Default
      expect(value.limit).toBe(20); // Default
      expect(value.sortBy).toBe('createdAt'); // Default
      expect(value.sortOrder).toBe('desc'); // Default
    });

    it('should reject invalid search parameters', () => {
      const invalidFilters = {
        page: 0, // Invalid page
        limit: 101, // Above max limit
        sortBy: 'invalid-field',
        sortOrder: 'invalid-order',
      };

      const { error } = validatePermissionSearch(invalidFilters);
      expect(error).toBeDefined();
    });
  });

  describe('validateBulkPermissionOperation', () => {
    it('should validate bulk operation', () => {
      const bulkOperation = {
        permissionIds: [
          '123e4567-e89b-12d3-a456-426614174000',
          '123e4567-e89b-12d3-a456-426614174001',
        ],
        operation: 'activate',
        parameters: {
          isActive: true,
        },
      };

      const { error, value } = validateBulkPermissionOperation(bulkOperation);

      expect(error).toBeUndefined();
      expect(value.permissionIds).toHaveLength(2);
      expect(value.operation).toBe('activate');
    });

    it('should reject invalid bulk operation', () => {
      const invalidOperation = {
        permissionIds: [], // Empty array
        operation: 'invalid-operation',
      };

      const { error } = validateBulkPermissionOperation(invalidOperation);
      expect(error).toBeDefined();
    });

    it('should reject too many permission IDs', () => {
      const tooManyIds = Array.from(
        { length: 101 },
        (_, i) => `123e4567-e89b-12d3-a456-42661417400${i.toString().padStart(1, '0')}`
      );

      const invalidOperation = {
        permissionIds: tooManyIds,
        operation: 'activate',
      };

      const { error } = validateBulkPermissionOperation(invalidOperation);
      expect(error).toBeDefined();
      expect(error?.details.some(d => d.message.includes('100'))).toBe(true);
    });
  });

  describe('validatePermissionDelegation', () => {
    it('should validate permission delegation', () => {
      const delegation = {
        delegateeId: '123e4567-e89b-12d3-a456-426614174000',
        permissionId: '123e4567-e89b-12d3-a456-426614174001',
        resourceType: ResourceType.DOCUMENT,
        resourceId: '123e4567-e89b-12d3-a456-426614174002',
        actions: [PermissionAction.READ, PermissionAction.UPDATE],
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        canDelegate: false,
        reason: 'Temporary access for project',
      };

      const { error, value } = validatePermissionDelegation(delegation);

      expect(error).toBeUndefined();
      expect(value.delegateeId).toBeDefined();
      expect(value.actions).toHaveLength(2);
      expect(value.canDelegate).toBe(false);
    });

    it('should reject invalid delegation dates', () => {
      const invalidDelegation = {
        delegateeId: '123e4567-e89b-12d3-a456-426614174000',
        permissionId: '123e4567-e89b-12d3-a456-426614174001',
        resourceType: ResourceType.DOCUMENT,
        actions: [PermissionAction.READ],
        validFrom: new Date(),
        validUntil: new Date(Date.now() - 24 * 60 * 60 * 1000), // Past date
      };

      const { error } = validatePermissionDelegation(invalidDelegation);
      expect(error).toBeDefined();
    });
  });

  describe('validatePermissionRequest', () => {
    it('should validate permission request', () => {
      const request = {
        resourceType: ResourceType.DOCUMENT,
        resourceId: '123e4567-e89b-12d3-a456-426614174000',
        actions: [PermissionAction.READ, PermissionAction.UPDATE],
        justification:
          'I need access to this document to complete my assigned task and review the content for accuracy.',
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      };

      const { error, value } = validatePermissionRequest(request);

      expect(error).toBeUndefined();
      expect(value.resourceType).toBe(ResourceType.DOCUMENT);
      expect(value.actions).toHaveLength(2);
      expect(value.justification.length).toBeGreaterThan(10);
    });

    it('should reject insufficient justification', () => {
      const invalidRequest = {
        resourceType: ResourceType.DOCUMENT,
        actions: [PermissionAction.READ],
        justification: 'Need it', // Too short
      };

      const { error } = validatePermissionRequest(invalidRequest);
      expect(error).toBeDefined();
      expect(error?.details.some(d => d.message.includes('10 caracteres'))).toBe(true);
    });
  });

  describe('customPermissionValidations', () => {
    describe('areActionsCompatible', () => {
      it('should validate compatible actions for document resource', () => {
        const isCompatible = customPermissionValidations.areActionsCompatible(
          ResourceType.DOCUMENT,
          [PermissionAction.READ, PermissionAction.UPDATE, PermissionAction.DOWNLOAD]
        );

        expect(isCompatible).toBe(true);
      });

      it('should reject incompatible actions for document resource', () => {
        const isCompatible = customPermissionValidations.areActionsCompatible(
          ResourceType.DOCUMENT,
          [PermissionAction.START_WORKFLOW] // Not compatible with document
        );

        expect(isCompatible).toBe(false);
      });

      it('should validate compatible actions for workflow resource', () => {
        const isCompatible = customPermissionValidations.areActionsCompatible(
          ResourceType.WORKFLOW,
          [PermissionAction.START_WORKFLOW, PermissionAction.COMPLETE_TASK]
        );

        expect(isCompatible).toBe(true);
      });
    });

    describe('isConditionValid', () => {
      it('should validate basic condition', () => {
        const condition = {
          field: 'department',
          operator: 'eq' as const,
          value: 'IT',
        };

        const isValid = customPermissionValidations.isConditionValid(condition);
        expect(isValid).toBe(true);
      });

      it('should validate array condition for "in" operator', () => {
        const condition = {
          field: 'roles',
          operator: 'in' as const,
          value: ['admin', 'manager'],
        };

        const isValid = customPermissionValidations.isConditionValid(condition);
        expect(isValid).toBe(true);
      });

      it('should reject invalid array condition for "in" operator', () => {
        const condition = {
          field: 'roles',
          operator: 'in' as const,
          value: 'admin', // Should be array
        };

        const isValid = customPermissionValidations.isConditionValid(condition);
        expect(isValid).toBe(false);
      });

      it('should validate regex condition', () => {
        const condition = {
          field: 'ip',
          operator: 'regex' as const,
          value: '^192\\.168\\.',
        };

        const isValid = customPermissionValidations.isConditionValid(condition);
        expect(isValid).toBe(true);
      });

      it('should reject invalid regex condition', () => {
        const condition = {
          field: 'ip',
          operator: 'regex' as const,
          value: '[invalid-regex',
        };

        const isValid = customPermissionValidations.isConditionValid(condition);
        expect(isValid).toBe(false);
      });
    });

    describe('isPriorityValid', () => {
      it('should validate system permission priority', () => {
        const isValid = customPermissionValidations.isPriorityValid(950, true);
        expect(isValid).toBe(true);
      });

      it('should reject low priority for system permission', () => {
        const isValid = customPermissionValidations.isPriorityValid(100, true);
        expect(isValid).toBe(false);
      });

      it('should validate normal permission priority', () => {
        const isValid = customPermissionValidations.isPriorityValid(100, false);
        expect(isValid).toBe(true);
      });

      it('should reject invalid priority range', () => {
        const isValid = customPermissionValidations.isPriorityValid(1001, false);
        expect(isValid).toBe(false);
      });
    });

    describe('areDatesValid', () => {
      it('should validate no date restrictions', () => {
        const isValid = customPermissionValidations.areDatesValid();
        expect(isValid).toBe(true);
      });

      it('should validate valid date range', () => {
        const validFrom = new Date();
        const validUntil = new Date(validFrom.getTime() + 24 * 60 * 60 * 1000);

        const isValid = customPermissionValidations.areDatesValid(validFrom, validUntil);
        expect(isValid).toBe(true);
      });

      it('should reject invalid date range', () => {
        const validFrom = new Date();
        const validUntil = new Date(validFrom.getTime() - 24 * 60 * 60 * 1000);

        const isValid = customPermissionValidations.areDatesValid(validFrom, validUntil);
        expect(isValid).toBe(false);
      });
    });

    describe('isScopeAppropriate', () => {
      it('should validate global scope without resource ID', () => {
        const isValid = customPermissionValidations.isScopeAppropriate(PermissionScope.GLOBAL);
        expect(isValid).toBe(true);
      });

      it('should reject global scope with resource ID', () => {
        const isValid = customPermissionValidations.isScopeAppropriate(
          PermissionScope.GLOBAL,
          '123e4567-e89b-12d3-a456-426614174000'
        );
        expect(isValid).toBe(false);
      });

      it('should validate resource scope with resource ID', () => {
        const isValid = customPermissionValidations.isScopeAppropriate(
          PermissionScope.RESOURCE,
          '123e4567-e89b-12d3-a456-426614174000'
        );
        expect(isValid).toBe(true);
      });

      it('should reject resource scope without resource ID', () => {
        const isValid = customPermissionValidations.isScopeAppropriate(PermissionScope.RESOURCE);
        expect(isValid).toBe(false);
      });
    });
  });
});
