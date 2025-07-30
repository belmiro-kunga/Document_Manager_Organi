// Folder validation for Authentication Service
// Validação de pasta para o Serviço de Autenticação
import Joi from 'joi';
import { 
  FolderType, 
  FolderStatus, 
  FolderAccessLevel, 
  FolderPermissionType,
  CreateFolderInput, 
  UpdateFolderInput, 
  MoveFolderInput,
  CopyFolderInput,
  FolderSearchFilters,
  BulkFolderOperation
} from '../models/folder';

/**
 * Folder creation validation schema
 */
export const createFolderSchema = Joi.object<CreateFolderInput>({
  name: Joi.string()
    .min(1)
    .max(255)
    .required()
    .pattern(/^[^<>:"/\\|?*]+$/)
    .messages({
      'string.min': 'Nome da pasta deve ter pelo menos 1 caractere',
      'string.max': 'Nome da pasta deve ter no máximo 255 caracteres',
      'string.empty': 'Nome da pasta é obrigatório',
      'string.pattern.base': 'Nome da pasta contém caracteres inválidos'
    }),

  description: Joi.string()
    .max(1000)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Descrição deve ter no máximo 1000 caracteres'
    }),

  type: Joi.string()
    .valid(...Object.values(FolderType))
    .default(FolderType.REGULAR)
    .messages({
      'any.only': 'Tipo de pasta deve ser um dos valores válidos'
    }),

  accessLevel: Joi.string()
    .valid(...Object.values(FolderAccessLevel))
    .default(FolderAccessLevel.INTERNAL)
    .messages({
      'any.only': 'Nível de acesso deve ser um dos valores válidos'
    }),

  parentId: Joi.string()
    .uuid()
    .optional()
    .allow(null)
    .messages({
      'string.uuid': 'ID da pasta pai deve ser um UUID válido'
    }),

  position: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.integer': 'Posição deve ser um número inteiro',
      'number.min': 'Posição deve ser maior ou igual a 0'
    }),

  metadata: Joi.object({
    description: Joi.string().max(1000).optional(),
    tags: Joi.array().items(Joi.string().max(50)).max(20).optional(),
    color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional(),
    icon: Joi.string().max(50).optional(),
    allowedFileTypes: Joi.array().items(Joi.string().max(10)).optional(),
    maxFileSize: Joi.number().integer().min(1).optional(),
    maxDocuments: Joi.number().integer().min(1).optional(),
    autoArchiveAfterDays: Joi.number().integer().min(1).optional(),
    requireApproval: Joi.boolean().default(false),
    enableVersioning: Joi.boolean().default(true),
    enableComments: Joi.boolean().default(true),
    isTemplate: Joi.boolean().default(false),
    templateName: Joi.string().max(255).optional(),
    templateDescription: Joi.string().max(1000).optional(),
    customFields: Joi.object().optional()
  }).optional(),

  permissions: Joi.array().items(
    Joi.object({
      userId: Joi.string().uuid().optional(),
      groupId: Joi.string().uuid().optional(),
      roleId: Joi.string().uuid().optional(),
      permissions: Joi.array()
        .items(Joi.string().valid(...Object.values(FolderPermissionType)))
        .min(1)
        .required()
    }).xor('userId', 'groupId', 'roleId')
  ).optional(),

  templateId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.uuid': 'ID do template deve ser um UUID válido'
    })
});

/**
 * Folder update validation schema
 */
export const updateFolderSchema = Joi.object<UpdateFolderInput>({
  name: Joi.string()
    .min(1)
    .max(255)
    .pattern(/^[^<>:"/\\|?*]+$/)
    .optional()
    .messages({
      'string.min': 'Nome da pasta deve ter pelo menos 1 caractere',
      'string.max': 'Nome da pasta deve ter no máximo 255 caracteres',
      'string.pattern.base': 'Nome da pasta contém caracteres inválidos'
    }),

  description: Joi.string()
    .max(1000)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Descrição deve ter no máximo 1000 caracteres'
    }),

  type: Joi.string()
    .valid(...Object.values(FolderType))
    .optional()
    .messages({
      'any.only': 'Tipo de pasta deve ser um dos valores válidos'
    }),

  status: Joi.string()
    .valid(...Object.values(FolderStatus))
    .optional()
    .messages({
      'any.only': 'Status da pasta deve ser um dos valores válidos'
    }),

  accessLevel: Joi.string()
    .valid(...Object.values(FolderAccessLevel))
    .optional()
    .messages({
      'any.only': 'Nível de acesso deve ser um dos valores válidos'
    }),

  position: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.integer': 'Posição deve ser um número inteiro',
      'number.min': 'Posição deve ser maior ou igual a 0'
    }),

  metadata: Joi.object({
    description: Joi.string().max(1000).optional(),
    tags: Joi.array().items(Joi.string().max(50)).max(20).optional(),
    color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional(),
    icon: Joi.string().max(50).optional(),
    allowedFileTypes: Joi.array().items(Joi.string().max(10)).optional(),
    maxFileSize: Joi.number().integer().min(1).optional(),
    maxDocuments: Joi.number().integer().min(1).optional(),
    autoArchiveAfterDays: Joi.number().integer().min(1).optional(),
    requireApproval: Joi.boolean().optional(),
    enableVersioning: Joi.boolean().optional(),
    enableComments: Joi.boolean().optional(),
    customFields: Joi.object().optional()
  }).optional(),

  isShared: Joi.boolean().optional()
});

/**
 * Folder move validation schema
 */
export const moveFolderSchema = Joi.object<MoveFolderInput>({
  targetParentId: Joi.string()
    .uuid()
    .optional()
    .allow(null)
    .messages({
      'string.uuid': 'ID da pasta de destino deve ser um UUID válido'
    }),

  position: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.integer': 'Posição deve ser um número inteiro',
      'number.min': 'Posição deve ser maior ou igual a 0'
    }),

  preservePermissions: Joi.boolean()
    .default(true)
});

/**
 * Folder copy validation schema
 */
export const copyFolderSchema = Joi.object<CopyFolderInput>({
  targetParentId: Joi.string()
    .uuid()
    .optional()
    .allow(null)
    .messages({
      'string.uuid': 'ID da pasta de destino deve ser um UUID válido'
    }),

  newName: Joi.string()
    .min(1)
    .max(255)
    .pattern(/^[^<>:"/\\|?*]+$/)
    .optional()
    .messages({
      'string.min': 'Novo nome deve ter pelo menos 1 caractere',
      'string.max': 'Novo nome deve ter no máximo 255 caracteres',
      'string.pattern.base': 'Novo nome contém caracteres inválidos'
    }),

  copyPermissions: Joi.boolean().default(false),
  copyDocuments: Joi.boolean().default(true),
  copySubfolders: Joi.boolean().default(true),
  recursive: Joi.boolean().default(true)
});

/**
 * Folder search filters validation schema
 */
export const folderSearchSchema = Joi.object<FolderSearchFilters>({
  query: Joi.string()
    .max(255)
    .optional()
    .messages({
      'string.max': 'Consulta deve ter no máximo 255 caracteres'
    }),

  type: Joi.string()
    .valid(...Object.values(FolderType))
    .optional()
    .messages({
      'any.only': 'Tipo deve ser um dos valores válidos'
    }),

  status: Joi.string()
    .valid(...Object.values(FolderStatus))
    .optional()
    .messages({
      'any.only': 'Status deve ser um dos valores válidos'
    }),

  accessLevel: Joi.string()
    .valid(...Object.values(FolderAccessLevel))
    .optional()
    .messages({
      'any.only': 'Nível de acesso deve ser um dos valores válidos'
    }),

  parentId: Joi.string()
    .uuid()
    .optional()
    .allow(null)
    .messages({
      'string.uuid': 'ID da pasta pai deve ser um UUID válido'
    }),

  level: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.integer': 'Nível deve ser um número inteiro',
      'number.min': 'Nível deve ser maior ou igual a 0'
    }),

  hasChildren: Joi.boolean().optional(),
  isShared: Joi.boolean().optional(),
  isLocked: Joi.boolean().optional(),
  isTemplate: Joi.boolean().optional(),

  createdBy: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.uuid': 'ID do criador deve ser um UUID válido'
    }),

  createdAfter: Joi.date().optional(),
  createdBefore: Joi.date().optional(),
  modifiedAfter: Joi.date().optional(),
  modifiedBefore: Joi.date().optional(),

  minSize: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.integer': 'Tamanho mínimo deve ser um número inteiro',
      'number.min': 'Tamanho mínimo deve ser maior ou igual a 0'
    }),

  maxSize: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.integer': 'Tamanho máximo deve ser um número inteiro',
      'number.min': 'Tamanho máximo deve ser maior ou igual a 0'
    }),

  minDocuments: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.integer': 'Número mínimo de documentos deve ser um número inteiro',
      'number.min': 'Número mínimo de documentos deve ser maior ou igual a 0'
    }),

  maxDocuments: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.integer': 'Número máximo de documentos deve ser um número inteiro',
      'number.min': 'Número máximo de documentos deve ser maior ou igual a 0'
    }),

  tags: Joi.array()
    .items(Joi.string().max(50))
    .optional()
    .messages({
      'string.max': 'Tag deve ter no máximo 50 caracteres'
    }),

  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.min': 'Página deve ser maior que 0'
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
    .messages({
      'number.min': 'Limite deve ser maior que 0',
      'number.max': 'Limite deve ser no máximo 100'
    }),

  sortBy: Joi.string()
    .valid('name', 'createdAt', 'updatedAt', 'size', 'documentCount', 'level')
    .default('name')
    .messages({
      'any.only': 'Ordenação deve ser um dos valores válidos'
    }),

  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('asc')
    .messages({
      'any.only': 'Ordem deve ser asc ou desc'
    })
});

/**
 * Bulk folder operation validation schema
 */
export const bulkFolderOperationSchema = Joi.object<BulkFolderOperation>({
  folderIds: Joi.array()
    .items(Joi.string().uuid())
    .min(1)
    .max(100)
    .required()
    .messages({
      'array.min': 'Deve selecionar pelo menos 1 pasta',
      'array.max': 'Pode selecionar no máximo 100 pastas',
      'string.uuid': 'ID da pasta deve ser um UUID válido'
    }),

  operation: Joi.string()
    .valid('delete', 'restore', 'move', 'copy', 'archive', 'change_access_level', 'lock', 'unlock')
    .required()
    .messages({
      'any.only': 'Operação deve ser um dos valores válidos',
      'any.required': 'Operação é obrigatória'
    }),

  parameters: Joi.object({
    targetParentId: Joi.string().uuid().optional(),
    accessLevel: Joi.string().valid(...Object.values(FolderAccessLevel)).optional(),
    lockReason: Joi.string().max(500).optional()
  }).optional()
});

/**
 * Folder lock validation schema
 */
export const lockFolderSchema = Joi.object({
  reason: Joi.string()
    .max(500)
    .optional()
    .messages({
      'string.max': 'Motivo deve ter no máximo 500 caracteres'
    })
});

/**
 * Validate folder creation input
 */
export const validateCreateFolder = (data: any) => {
  return createFolderSchema.validate(data, { abortEarly: false });
};

/**
 * Validate folder update input
 */
export const validateUpdateFolder = (data: any) => {
  return updateFolderSchema.validate(data, { abortEarly: false });
};

/**
 * Validate folder move input
 */
export const validateMoveFolder = (data: any) => {
  return moveFolderSchema.validate(data, { abortEarly: false });
};

/**
 * Validate folder copy input
 */
export const validateCopyFolder = (data: any) => {
  return copyFolderSchema.validate(data, { abortEarly: false });
};

/**
 * Validate folder search filters
 */
export const validateFolderSearch = (data: any) => {
  return folderSearchSchema.validate(data, { abortEarly: false });
};

/**
 * Validate bulk folder operation
 */
export const validateBulkFolderOperation = (data: any) => {
  return bulkFolderOperationSchema.validate(data, { abortEarly: false });
};

/**
 * Validate folder lock
 */
export const validateLockFolder = (data: any) => {
  return lockFolderSchema.validate(data, { abortEarly: false });
};

/**
 * Custom validation functions
 */
export const customFolderValidations = {
  /**
   * Check if folder name is valid
   */
  isFolderNameValid: (name: string): boolean => {
    const invalidChars = /[<>:"/\\|?*]/;
    return !invalidChars.test(name) && name.length >= 1 && name.length <= 255;
  },

  /**
   * Check if folder path is valid
   */
  isFolderPathValid: (path: string): boolean => {
    const pathRegex = /^(\/[^<>:"/\\|?*]+)*\/?$/;
    return pathRegex.test(path) && path.length <= 1000;
  },

  /**
   * Check if color is valid hex
   */
  isColorValid: (color: string): boolean => {
    const colorRegex = /^#[0-9A-Fa-f]{6}$/;
    return colorRegex.test(color);
  },

  /**
   * Check if file type is valid
   */
  isFileTypeValid: (fileType: string): boolean => {
    const fileTypeRegex = /^\.[a-zA-Z0-9]+$/;
    return fileTypeRegex.test(fileType) && fileType.length <= 10;
  },

  /**
   * Validate folder hierarchy depth
   */
  isValidHierarchyDepth: (level: number, maxDepth = 10): boolean => {
    return level >= 0 && level <= maxDepth;
  },

  /**
   * Check if folder can be moved to target
   */
  canMoveToTarget: (sourceId: string, targetId: string | null): boolean => {
    // Cannot move to itself or its descendants
    // This would need to be implemented with database queries
    return sourceId !== targetId;
  }
};