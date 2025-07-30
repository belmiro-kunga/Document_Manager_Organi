// Permission validation for Authentication Service
// Validação de permissão para o Serviço de Autenticação
import Joi from 'joi';
import {
  PermissionType,
  PermissionEffect,
  PermissionScope,
  PermissionInheritanceType,
  CreatePermissionInput,
  UpdatePermissionInput,
  PermissionSearchFilters,
  BulkPermissionOperation,
  PermissionCondition,
  PermissionConstraint,
} from '../models/permission';

/**
 * Permission condition validation schema
 */
const permissionConditionSchema = Joi.object<PermissionCondition>({
  field: Joi.string().required().messages({
    'string.empty': 'Campo da condição é obrigatório',
  }),

  operator: Joi.string()
    .valid('eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'nin', 'contains', 'regex')
    .required()
    .messages({
      'any.only': 'Operador deve ser um dos valores válidos',
      'any.required': 'Operador é obrigatório',
    }),

  value: Joi.any().required().messages({
    'any.required': 'Valor da condição é obrigatório',
  }),

  caseSensitive: Joi.boolean().default(false),
});

/**
 * Permission constraint validation schema
 */
const permissionConstraintSchema = Joi.object<PermissionConstraint>({
  type: Joi.string().valid('time', 'ip', 'location', 'device', 'custom').required().messages({
    'any.only': 'Tipo de restrição deve ser um dos valores válidos',
    'any.required': 'Tipo de restrição é obrigatório',
  }),

  conditions: Joi.array().items(permissionConditionSchema).min(1).required().messages({
    'array.min': 'Deve ter pelo menos uma condição',
    'any.required': 'Condições são obrigatórias',
  }),

  description: Joi.string().max(500).optional().messages({
    'string.max': 'Descrição deve ter no máximo 500 caracteres',
  }),
});

/**
 * Permission creation validation schema
 */
export const createPermissionSchema = Joi.object<CreatePermissionInput>({
  name: Joi.string().min(3).max(255).optional().messages({
    'string.min': 'Nome deve ter pelo menos 3 caracteres',
    'string.max': 'Nome deve ter no máximo 255 caracteres',
  }),

  description: Joi.string().max(1000).optional().allow('').messages({
    'string.max': 'Descrição deve ter no máximo 1000 caracteres',
  }),

  type: Joi.string()
    .valid(...Object.values(PermissionType))
    .required()
    .messages({
      'any.only': 'Tipo de permissão deve ser um dos valores válidos',
      'any.required': 'Tipo de permissão é obrigatório',
    }),

  effect: Joi.string()
    .valid(...Object.values(PermissionEffect))
    .default(PermissionEffect.ALLOW)
    .messages({
      'any.only': 'Efeito deve ser um dos valores válidos',
    }),

  scope: Joi.string()
    .valid(...Object.values(PermissionScope))
    .required()
    .messages({
      'any.only': 'Escopo deve ser um dos valores válidos',
      'any.required': 'Escopo é obrigatório',
    }),

  subjectType: Joi.string().valid('user', 'group', 'role').required().messages({
    'any.only': 'Tipo de sujeito deve ser user, group ou role',
    'any.required': 'Tipo de sujeito é obrigatório',
  }),

  subjectId: Joi.string().uuid().required().messages({
    'string.uuid': 'ID do sujeito deve ser um UUID válido',
    'any.required': 'ID do sujeito é obrigatório',
  }),

  resourceType: Joi.string()
    .valid('document', 'folder', 'system', 'workflow', 'report', 'global')
    .required()
    .messages({
      'any.only': 'Tipo de recurso deve ser um dos valores válidos',
      'any.required': 'Tipo de recurso é obrigatório',
    }),

  resourceId: Joi.string().uuid().optional().allow(null).messages({
    'string.uuid': 'ID do recurso deve ser um UUID válido',
  }),

  inheritanceType: Joi.string()
    .valid(...Object.values(PermissionInheritanceType))
    .default(PermissionInheritanceType.NONE)
    .messages({
      'any.only': 'Tipo de herança deve ser um dos valores válidos',
    }),

  constraints: Joi.array().items(permissionConstraintSchema).optional().messages({
    'array.base': 'Restrições devem ser um array',
  }),

  conditions: Joi.array().items(permissionConditionSchema).optional().messages({
    'array.base': 'Condições devem ser um array',
  }),

  validFrom: Joi.date().optional().messages({
    'date.base': 'Data de início deve ser uma data válida',
  }),

  validUntil: Joi.date().optional().greater(Joi.ref('validFrom')).messages({
    'date.base': 'Data de fim deve ser uma data válida',
    'date.greater': 'Data de fim deve ser posterior à data de início',
  }),

  metadata: Joi.object({
    description: Joi.string().max(1000).optional(),
    tags: Joi.array().items(Joi.string().max(50)).max(20).optional(),
    category: Joi.string().max(100).optional(),
    priority: Joi.number().integer().min(0).max(100).default(50),
    isSystemGenerated: Joi.boolean().default(false),
    isTemporary: Joi.boolean().default(false),
    reason: Joi.string().max(500).optional(),
    approvedBy: Joi.string().uuid().optional(),
    approvedAt: Joi.date().optional(),
    customFields: Joi.object().optional(),
  }).optional(),
});

/**
 * Permission update validation schema
 */
export const updatePermissionSchema = Joi.object<UpdatePermissionInput>({
  name: Joi.string().min(3).max(255).optional().messages({
    'string.min': 'Nome deve ter pelo menos 3 caracteres',
    'string.max': 'Nome deve ter no máximo 255 caracteres',
  }),

  description: Joi.string().max(1000).optional().allow('').messages({
    'string.max': 'Descrição deve ter no máximo 1000 caracteres',
  }),

  effect: Joi.string()
    .valid(...Object.values(PermissionEffect))
    .optional()
    .messages({
      'any.only': 'Efeito deve ser um dos valores válidos',
    }),

  constraints: Joi.array().items(permissionConstraintSchema).optional().messages({
    'array.base': 'Restrições devem ser um array',
  }),

  conditions: Joi.array().items(permissionConditionSchema).optional().messages({
    'array.base': 'Condições devem ser um array',
  }),

  validFrom: Joi.date().optional().messages({
    'date.base': 'Data de início deve ser uma data válida',
  }),

  validUntil: Joi.date().optional().greater(Joi.ref('validFrom')).messages({
    'date.base': 'Data de fim deve ser uma data válida',
    'date.greater': 'Data de fim deve ser posterior à data de início',
  }),

  isActive: Joi.boolean().optional(),

  metadata: Joi.object({
    description: Joi.string().max(1000).optional(),
    tags: Joi.array().items(Joi.string().max(50)).max(20).optional(),
    category: Joi.string().max(100).optional(),
    priority: Joi.number().integer().min(0).max(100).optional(),
    isTemporary: Joi.boolean().optional(),
    reason: Joi.string().max(500).optional(),
    customFields: Joi.object().optional(),
  }).optional(),
});

/**
 * Permission search filters validation schema
 */
export const permissionSearchSchema = Joi.object<PermissionSearchFilters>({
  query: Joi.string().max(255).optional().messages({
    'string.max': 'Consulta deve ter no máximo 255 caracteres',
  }),

  type: Joi.string()
    .valid(...Object.values(PermissionType))
    .optional()
    .messages({
      'any.only': 'Tipo deve ser um dos valores válidos',
    }),

  effect: Joi.string()
    .valid(...Object.values(PermissionEffect))
    .optional()
    .messages({
      'any.only': 'Efeito deve ser um dos valores válidos',
    }),

  scope: Joi.string()
    .valid(...Object.values(PermissionScope))
    .optional()
    .messages({
      'any.only': 'Escopo deve ser um dos valores válidos',
    }),

  subjectType: Joi.string().valid('user', 'group', 'role').optional().messages({
    'any.only': 'Tipo de sujeito deve ser user, group ou role',
  }),

  subjectId: Joi.string().uuid().optional().messages({
    'string.uuid': 'ID do sujeito deve ser um UUID válido',
  }),

  resourceType: Joi.string()
    .valid('document', 'folder', 'system', 'workflow', 'report', 'global')
    .optional()
    .messages({
      'any.only': 'Tipo de recurso deve ser um dos valores válidos',
    }),

  resourceId: Joi.string().uuid().optional().messages({
    'string.uuid': 'ID do recurso deve ser um UUID válido',
  }),

  inheritanceType: Joi.string()
    .valid(...Object.values(PermissionInheritanceType))
    .optional()
    .messages({
      'any.only': 'Tipo de herança deve ser um dos valores válidos',
    }),

  isInherited: Joi.boolean().optional(),
  isActive: Joi.boolean().optional(),
  isExpired: Joi.boolean().optional(),
  hasConstraints: Joi.boolean().optional(),
  hasConditions: Joi.boolean().optional(),

  createdBy: Joi.string().uuid().optional().messages({
    'string.uuid': 'ID do criador deve ser um UUID válido',
  }),

  createdAfter: Joi.date().optional(),
  createdBefore: Joi.date().optional(),
  validFrom: Joi.date().optional(),
  validUntil: Joi.date().optional(),

  tags: Joi.array().items(Joi.string().max(50)).optional().messages({
    'string.max': 'Tag deve ter no máximo 50 caracteres',
  }),

  category: Joi.string().max(100).optional().messages({
    'string.max': 'Categoria deve ter no máximo 100 caracteres',
  }),

  page: Joi.number().integer().min(1).default(1).messages({
    'number.min': 'Página deve ser maior que 0',
  }),

  limit: Joi.number().integer().min(1).max(100).default(20).messages({
    'number.min': 'Limite deve ser maior que 0',
    'number.max': 'Limite deve ser no máximo 100',
  }),

  sortBy: Joi.string()
    .valid(
      'name',
      'type',
      'effect',
      'scope',
      'createdAt',
      'updatedAt',
      'validFrom',
      'validUntil',
      'priority'
    )
    .default('createdAt')
    .messages({
      'any.only': 'Ordenação deve ser um dos valores válidos',
    }),

  sortOrder: Joi.string().valid('asc', 'desc').default('desc').messages({
    'any.only': 'Ordem deve ser asc ou desc',
  }),
});

/**
 * Bulk permission operation validation schema
 */
export const bulkPermissionOperationSchema = Joi.object<BulkPermissionOperation>({
  permissionIds: Joi.array().items(Joi.string().uuid()).min(1).max(100).required().messages({
    'array.min': 'Deve selecionar pelo menos 1 permissão',
    'array.max': 'Pode selecionar no máximo 100 permissões',
    'string.uuid': 'ID da permissão deve ser um UUID válido',
  }),

  operation: Joi.string()
    .valid('activate', 'deactivate', 'delete', 'extend', 'revoke', 'copy')
    .required()
    .messages({
      'any.only': 'Operação deve ser um dos valores válidos',
      'any.required': 'Operação é obrigatória',
    }),

  parameters: Joi.object({
    validUntil: Joi.date().optional(),
    targetSubjectId: Joi.string().uuid().optional(),
    reason: Joi.string().max(500).optional(),
  }).optional(),
});

/**
 * Permission evaluation context validation schema
 */
export const permissionEvaluationContextSchema = Joi.object({
  userId: Joi.string().uuid().required().messages({
    'string.uuid': 'ID do usuário deve ser um UUID válido',
    'any.required': 'ID do usuário é obrigatório',
  }),

  resourceType: Joi.string().required().messages({
    'any.required': 'Tipo de recurso é obrigatório',
  }),

  resourceId: Joi.string().uuid().optional().messages({
    'string.uuid': 'ID do recurso deve ser um UUID válido',
  }),

  action: Joi.string()
    .valid(...Object.values(PermissionType))
    .required()
    .messages({
      'any.only': 'Ação deve ser um dos tipos de permissão válidos',
      'any.required': 'Ação é obrigatória',
    }),

  timestamp: Joi.date().default(() => new Date()),

  ipAddress: Joi.string().ip().optional().messages({
    'string.ip': 'Endereço IP deve ser válido',
  }),

  userAgent: Joi.string().max(500).optional().messages({
    'string.max': 'User Agent deve ter no máximo 500 caracteres',
  }),

  location: Joi.object({
    country: Joi.string().max(100).required(),
    city: Joi.string().max(100).required(),
    coordinates: Joi.array().items(Joi.number()).length(2).optional(),
  }).optional(),

  device: Joi.object({
    type: Joi.string().max(50).required(),
    os: Joi.string().max(100).required(),
    browser: Joi.string().max(100).required(),
  }).optional(),

  customContext: Joi.object().optional(),
});

/**
 * Validate permission creation input
 */
export const validateCreatePermission = (data: any) => {
  return createPermissionSchema.validate(data, { abortEarly: false });
};

/**
 * Validate permission update input
 */
export const validateUpdatePermission = (data: any) => {
  return updatePermissionSchema.validate(data, { abortEarly: false });
};

/**
 * Validate permission search filters
 */
export const validatePermissionSearch = (data: any) => {
  return permissionSearchSchema.validate(data, { abortEarly: false });
};

/**
 * Validate bulk permission operation
 */
export const validateBulkPermissionOperation = (data: any) => {
  return bulkPermissionOperationSchema.validate(data, { abortEarly: false });
};

/**
 * Validate permission evaluation context
 */
export const validatePermissionEvaluationContext = (data: any) => {
  return permissionEvaluationContextSchema.validate(data, { abortEarly: false });
};

/**
 * Custom validation functions
 */
export const customPermissionValidations = {
  /**
   * Check if permission type is valid for resource type
   */
  isPermissionTypeValidForResource: (
    permissionType: PermissionType,
    resourceType: string
  ): boolean => {
    const documentPermissions = Object.values(PermissionType).filter(p =>
      p.startsWith('document:')
    );
    const folderPermissions = Object.values(PermissionType).filter(p => p.startsWith('folder:'));
    const systemPermissions = Object.values(PermissionType).filter(p => p.startsWith('system:'));
    const workflowPermissions = Object.values(PermissionType).filter(p =>
      p.startsWith('workflow:')
    );
    const reportPermissions = Object.values(PermissionType).filter(p => p.startsWith('report:'));

    switch (resourceType) {
      case 'document':
        return documentPermissions.includes(permissionType);
      case 'folder':
        return folderPermissions.includes(permissionType);
      case 'system':
        return systemPermissions.includes(permissionType);
      case 'workflow':
        return workflowPermissions.includes(permissionType);
      case 'report':
        return reportPermissions.includes(permissionType);
      case 'global':
        return true; // Global permissions can have any type
      default:
        return false;
    }
  },

  /**
   * Check if scope is valid for resource type
   */
  isScopeValidForResource: (scope: PermissionScope, resourceType: string): boolean => {
    switch (resourceType) {
      case 'document':
        return [
          PermissionScope.DOCUMENT,
          PermissionScope.FOLDER,
          PermissionScope.PROJECT,
          PermissionScope.DEPARTMENT,
          PermissionScope.ORGANIZATION,
          PermissionScope.GLOBAL,
        ].includes(scope);
      case 'folder':
        return [
          PermissionScope.FOLDER,
          PermissionScope.PROJECT,
          PermissionScope.DEPARTMENT,
          PermissionScope.ORGANIZATION,
          PermissionScope.GLOBAL,
        ].includes(scope);
      case 'system':
        return [PermissionScope.GLOBAL, PermissionScope.ORGANIZATION].includes(scope);
      case 'workflow':
        return [
          PermissionScope.PROJECT,
          PermissionScope.DEPARTMENT,
          PermissionScope.ORGANIZATION,
          PermissionScope.GLOBAL,
        ].includes(scope);
      case 'report':
        return [
          PermissionScope.DEPARTMENT,
          PermissionScope.ORGANIZATION,
          PermissionScope.GLOBAL,
        ].includes(scope);
      case 'global':
        return scope === PermissionScope.GLOBAL;
      default:
        return false;
    }
  },

  /**
   * Check if condition operator is valid for field type
   */
  isOperatorValidForField: (
    operator: string,
    fieldType: 'string' | 'number' | 'date' | 'boolean' | 'array'
  ): boolean => {
    const stringOperators = ['eq', 'ne', 'contains', 'regex'];
    const numberOperators = ['eq', 'ne', 'gt', 'gte', 'lt', 'lte'];
    const dateOperators = ['eq', 'ne', 'gt', 'gte', 'lt', 'lte'];
    const booleanOperators = ['eq', 'ne'];
    const arrayOperators = ['in', 'nin'];

    switch (fieldType) {
      case 'string':
        return stringOperators.includes(operator);
      case 'number':
        return numberOperators.includes(operator);
      case 'date':
        return dateOperators.includes(operator);
      case 'boolean':
        return booleanOperators.includes(operator);
      case 'array':
        return arrayOperators.includes(operator);
      default:
        return false;
    }
  },

  /**
   * Check if permission dates are valid
   */
  arePermissionDatesValid: (validFrom?: Date, validUntil?: Date): boolean => {
    if (!validFrom && !validUntil) return true;
    if (validFrom && !validUntil) return validFrom <= new Date();
    if (!validFrom && validUntil) return validUntil > new Date();
    return validFrom <= validUntil && validUntil > new Date();
  },

  /**
   * Check if constraint type is valid for conditions
   */
  isConstraintTypeValidForConditions: (
    constraintType: string,
    conditions: PermissionCondition[]
  ): boolean => {
    const timeFields = ['hour', 'day', 'date', 'timezone'];
    const ipFields = ['ip', 'ip_range', 'country'];
    const locationFields = ['country', 'city', 'coordinates'];
    const deviceFields = ['device_type', 'os', 'browser', 'user_agent'];

    switch (constraintType) {
      case 'time':
        return conditions.every(c => timeFields.includes(c.field));
      case 'ip':
        return conditions.every(c => ipFields.includes(c.field));
      case 'location':
        return conditions.every(c => locationFields.includes(c.field));
      case 'device':
        return conditions.every(c => deviceFields.includes(c.field));
      case 'custom':
        return true; // Custom constraints can have any fields
      default:
        return false;
    }
  },
};
