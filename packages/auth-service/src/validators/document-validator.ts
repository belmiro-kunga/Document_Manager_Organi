// Document validation for Authentication Service
// Validação de documento para o Serviço de Autenticação
import Joi from 'joi';
import { 
  DocumentType, 
  DocumentStatus, 
  DocumentAccessLevel, 
  CreateDocumentInput, 
  UpdateDocumentInput, 
  DocumentSearchFilters,
  BulkDocumentOperation,
  DocumentPermissionType
} from '../models/document';

/**
 * Document creation validation schema
 */
export const createDocumentSchema = Joi.object<CreateDocumentInput>({
  name: Joi.string()
    .min(1)
    .max(255)
    .required()
    .pattern(/^[^<>:"/\\|?*]+$/)
    .messages({
      'string.min': 'Nome do documento deve ter pelo menos 1 caractere',
      'string.max': 'Nome do documento deve ter no máximo 255 caracteres',
      'string.empty': 'Nome do documento é obrigatório',
      'string.pattern.base': 'Nome do documento contém caracteres inválidos'
    }),

  description: Joi.string()
    .max(1000)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Descrição deve ter no máximo 1000 caracteres'
    }),

  type: Joi.string()
    .valid(...Object.values(DocumentType))
    .required()
    .messages({
      'any.only': 'Tipo de documento deve ser um dos valores válidos',
      'any.required': 'Tipo de documento é obrigatório'
    }),

  accessLevel: Joi.string()
    .valid(...Object.values(DocumentAccessLevel))
    .default(DocumentAccessLevel.INTERNAL)
    .messages({
      'any.only': 'Nível de acesso deve ser um dos valores válidos: public, internal, confidential, restricted'
    }),

  folderId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.uuid': 'ID da pasta deve ser um UUID válido'
    }),

  tags: Joi.array()
    .items(Joi.string().max(50))
    .max(20)
    .optional()
    .messages({
      'array.max': 'Máximo de 20 tags permitidas',
      'string.max': 'Cada tag deve ter no máximo 50 caracteres'
    }),

  metadata: Joi.object({
    title: Joi.string().max(255).optional(),
    subject: Joi.string().max(255).optional(),
    author: Joi.string().max(255).optional(),
    keywords: Joi.array().items(Joi.string().max(100)).max(50).optional(),
    description: Joi.string().max(1000).optional(),
    language: Joi.string().max(10).optional(),
    customFields: Joi.object().optional()
  }).optional(),

  file: Joi.object({
    originalName: Joi.string()
      .required()
      .messages({
        'any.required': 'Nome original do arquivo é obrigatório'
      }),

    buffer: Joi.binary()
      .required()
      .max(100 * 1024 * 1024) // 100MB
      .messages({
        'any.required': 'Conteúdo do arquivo é obrigatório',
        'binary.max': 'Arquivo deve ter no máximo 100MB'
      }),

    mimeType: Joi.string()
      .required()
      .messages({
        'any.required': 'Tipo MIME do arquivo é obrigatório'
      }),

    size: Joi.number()
      .integer()
      .min(1)
      .max(100 * 1024 * 1024) // 100MB
      .required()
      .messages({
        'number.min': 'Tamanho do arquivo deve ser maior que 0',
        'number.max': 'Arquivo deve ter no máximo 100MB',
        'any.required': 'Tamanho do arquivo é obrigatório'
      })
  }).required()
});

/**
 * Document update validation schema
 */
export const updateDocumentSchema = Joi.object<UpdateDocumentInput>({
  name: Joi.string()
    .min(1)
    .max(255)
    .pattern(/^[^<>:"/\\|?*]+$/)
    .optional()
    .messages({
      'string.min': 'Nome do documento deve ter pelo menos 1 caractere',
      'string.max': 'Nome do documento deve ter no máximo 255 caracteres',
      'string.pattern.base': 'Nome do documento contém caracteres inválidos'
    }),

  description: Joi.string()
    .max(1000)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Descrição deve ter no máximo 1000 caracteres'
    }),

  type: Joi.string()
    .valid(...Object.values(DocumentType))
    .optional()
    .messages({
      'any.only': 'Tipo de documento deve ser um dos valores válidos'
    }),

  status: Joi.string()
    .valid(...Object.values(DocumentStatus))
    .optional()
    .messages({
      'any.only': 'Status do documento deve ser um dos valores válidos'
    }),

  accessLevel: Joi.string()
    .valid(...Object.values(DocumentAccessLevel))
    .optional()
    .messages({
      'any.only': 'Nível de acesso deve ser um dos valores válidos'
    }),

  folderId: Joi.string()
    .uuid()
    .optional()
    .allow(null)
    .messages({
      'string.uuid': 'ID da pasta deve ser um UUID válido'
    }),

  tags: Joi.array()
    .items(Joi.string().max(50))
    .max(20)
    .optional()
    .messages({
      'array.max': 'Máximo de 20 tags permitidas',
      'string.max': 'Cada tag deve ter no máximo 50 caracteres'
    }),

  metadata: Joi.object({
    title: Joi.string().max(255).optional(),
    subject: Joi.string().max(255).optional(),
    author: Joi.string().max(255).optional(),
    keywords: Joi.array().items(Joi.string().max(100)).max(50).optional(),
    description: Joi.string().max(1000).optional(),
    language: Joi.string().max(10).optional(),
    customFields: Joi.object().optional()
  }).optional(),

  isFavorite: Joi.boolean()
    .optional()
});

/**
 * Document search filters validation schema
 */
export const documentSearchSchema = Joi.object<DocumentSearchFilters>({
  query: Joi.string()
    .max(255)
    .optional()
    .messages({
      'string.max': 'Consulta deve ter no máximo 255 caracteres'
    }),

  type: Joi.string()
    .valid(...Object.values(DocumentType))
    .optional()
    .messages({
      'any.only': 'Tipo de documento deve ser um dos valores válidos'
    }),

  status: Joi.string()
    .valid(...Object.values(DocumentStatus))
    .optional()
    .messages({
      'any.only': 'Status do documento deve ser um dos valores válidos'
    }),

  accessLevel: Joi.string()
    .valid(...Object.values(DocumentAccessLevel))
    .optional()
    .messages({
      'any.only': 'Nível de acesso deve ser um dos valores válidos'
    }),

  folderId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.uuid': 'ID da pasta deve ser um UUID válido'
    }),

  tags: Joi.array()
    .items(Joi.string().max(50))
    .optional()
    .messages({
      'string.max': 'Cada tag deve ter no máximo 50 caracteres'
    }),

  createdBy: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.uuid': 'ID do criador deve ser um UUID válido'
    }),

  createdAfter: Joi.date()
    .optional(),

  createdBefore: Joi.date()
    .optional(),

  modifiedAfter: Joi.date()
    .optional(),

  modifiedBefore: Joi.date()
    .optional(),

  minSize: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.min': 'Tamanho mínimo deve ser maior ou igual a 0'
    }),

  maxSize: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.min': 'Tamanho máximo deve ser maior ou igual a 0'
    }),

  hasOcr: Joi.boolean()
    .optional(),

  hasAi: Joi.boolean()
    .optional(),

  isFavorite: Joi.boolean()
    .optional(),

  isLocked: Joi.boolean()
    .optional(),

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
    .valid('name', 'createdAt', 'updatedAt', 'lastModifiedAt', 'size', 'viewCount', 'downloadCount')
    .default('createdAt')
    .messages({
      'any.only': 'Ordenação deve ser um dos valores válidos'
    }),

  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
    .messages({
      'any.only': 'Ordem deve ser asc ou desc'
    })
});

/**
 * Bulk document operation validation schema
 */
export const bulkDocumentOperationSchema = Joi.object<BulkDocumentOperation>({
  documentIds: Joi.array()
    .items(Joi.string().uuid())
    .min(1)
    .max(100)
    .required()
    .messages({
      'array.min': 'Pelo menos um documento deve ser selecionado',
      'array.max': 'Máximo de 100 documentos por operação',
      'string.uuid': 'IDs dos documentos devem ser UUIDs válidos',
      'any.required': 'Lista de documentos é obrigatória'
    }),

  operation: Joi.string()
    .valid('delete', 'restore', 'move', 'copy', 'tag', 'untag', 'change_access_level')
    .required()
    .messages({
      'any.only': 'Operação deve ser um dos valores válidos',
      'any.required': 'Operação é obrigatória'
    }),

  parameters: Joi.object({
    folderId: Joi.string().uuid().optional(),
    tags: Joi.array().items(Joi.string().max(50)).optional(),
    accessLevel: Joi.string().valid(...Object.values(DocumentAccessLevel)).optional()
  }).optional()
});

/**
 * Document comment validation schema
 */
export const documentCommentSchema = Joi.object({
  content: Joi.string()
    .min(1)
    .max(2000)
    .required()
    .messages({
      'string.min': 'Comentário deve ter pelo menos 1 caractere',
      'string.max': 'Comentário deve ter no máximo 2000 caracteres',
      'string.empty': 'Comentário é obrigatório'
    }),

  parentId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.uuid': 'ID do comentário pai deve ser um UUID válido'
    }),

  mentions: Joi.array()
    .items(Joi.string().uuid())
    .max(10)
    .optional()
    .messages({
      'array.max': 'Máximo de 10 menções por comentário',
      'string.uuid': 'IDs dos usuários mencionados devem ser UUIDs válidos'
    })
});

/**
 * Document permission validation schema
 */
export const documentPermissionSchema = Joi.object({
  userId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.uuid': 'ID do usuário deve ser um UUID válido'
    }),

  groupId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.uuid': 'ID do grupo deve ser um UUID válido'
    }),

  roleId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.uuid': 'ID do papel deve ser um UUID válido'
    }),

  permissions: Joi.array()
    .items(Joi.string().valid(...Object.values(DocumentPermissionType)))
    .min(1)
    .required()
    .messages({
      'array.min': 'Pelo menos uma permissão deve ser especificada',
      'any.only': 'Permissões devem ser valores válidos',
      'any.required': 'Permissões são obrigatórias'
    }),

  expiresAt: Joi.date()
    .greater('now')
    .optional()
    .messages({
      'date.greater': 'Data de expiração deve ser no futuro'
    })
}).or('userId', 'groupId', 'roleId')
  .messages({
    'object.missing': 'Pelo menos um de userId, groupId ou roleId deve ser especificado'
  });

/**
 * Document share link validation schema
 */
export const documentShareLinkSchema = Joi.object({
  permissions: Joi.array()
    .items(Joi.string().valid(...Object.values(DocumentPermissionType)))
    .min(1)
    .required()
    .messages({
      'array.min': 'Pelo menos uma permissão deve ser especificada',
      'any.only': 'Permissões devem ser valores válidos',
      'any.required': 'Permissões são obrigatórias'
    }),

  expiresAt: Joi.date()
    .greater('now')
    .optional()
    .messages({
      'date.greater': 'Data de expiração deve ser no futuro'
    }),

  password: Joi.string()
    .min(4)
    .max(50)
    .optional()
    .messages({
      'string.min': 'Senha deve ter pelo menos 4 caracteres',
      'string.max': 'Senha deve ter no máximo 50 caracteres'
    }),

  maxDownloads: Joi.number()
    .integer()
    .min(1)
    .max(1000)
    .optional()
    .messages({
      'number.min': 'Máximo de downloads deve ser pelo menos 1',
      'number.max': 'Máximo de downloads deve ser no máximo 1000'
    })
});

/**
 * File upload validation schema
 */
export const fileUploadSchema = Joi.object({
  file: Joi.object({
    originalname: Joi.string().required(),
    mimetype: Joi.string().required(),
    size: Joi.number().integer().min(1).max(100 * 1024 * 1024).required(),
    buffer: Joi.binary().required()
  }).required()
});

/**
 * Validate document creation input
 */
export const validateCreateDocument = (data: any) => {
  return createDocumentSchema.validate(data, { abortEarly: false });
};

/**
 * Validate document update input
 */
export const validateUpdateDocument = (data: any) => {
  return updateDocumentSchema.validate(data, { abortEarly: false });
};

/**
 * Validate document search filters
 */
export const validateDocumentSearch = (data: any) => {
  return documentSearchSchema.validate(data, { abortEarly: false });
};

/**
 * Validate bulk document operation
 */
export const validateBulkDocumentOperation = (data: any) => {
  return bulkDocumentOperationSchema.validate(data, { abortEarly: false });
};

/**
 * Validate document comment
 */
export const validateDocumentComment = (data: any) => {
  return documentCommentSchema.validate(data, { abortEarly: false });
};

/**
 * Validate document permission
 */
export const validateDocumentPermission = (data: any) => {
  return documentPermissionSchema.validate(data, { abortEarly: false });
};

/**
 * Validate document share link
 */
export const validateDocumentShareLink = (data: any) => {
  return documentShareLinkSchema.validate(data, { abortEarly: false });
};

/**
 * Custom validation functions
 */
export const customDocumentValidations = {
  /**
   * Check if file name is valid
   */
  isFileNameValid: (fileName: string): boolean => {
    const invalidChars = /[<>:"/\\|?*]/;
    return !invalidChars.test(fileName) && fileName.length > 0 && fileName.length <= 255;
  },

  /**
   * Check if file size is within limits
   */
  isFileSizeValid: (size: number, maxSize = 100 * 1024 * 1024): boolean => {
    return size > 0 && size <= maxSize;
  },

  /**
   * Check if MIME type is allowed
   */
  isMimeTypeAllowed: (mimeType: string, allowedTypes?: string[]): boolean => {
    if (!allowedTypes) {
      // Default allowed types
      const defaultAllowed = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'text/csv',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'video/mp4',
        'video/webm',
        'audio/mp3',
        'audio/wav',
        'audio/ogg'
      ];
      return defaultAllowed.includes(mimeType);
    }
    return allowedTypes.includes(mimeType);
  },

  /**
   * Get document type from MIME type
   */
  getDocumentTypeFromMime: (mimeType: string): DocumentType => {
    if (mimeType.startsWith('image/')) return DocumentType.IMAGE;
    if (mimeType.startsWith('video/')) return DocumentType.VIDEO;
    if (mimeType.startsWith('audio/')) return DocumentType.AUDIO;
    if (mimeType === 'application/pdf') return DocumentType.PDF;
    if (mimeType.includes('word') || mimeType.includes('document')) return DocumentType.WORD;
    if (mimeType.includes('excel') || mimeType.includes('sheet')) return DocumentType.EXCEL;
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return DocumentType.POWERPOINT;
    if (mimeType.startsWith('text/')) return DocumentType.TEXT;
    return DocumentType.OTHER;
  },

  /**
   * Validate file extension matches MIME type
   */
  validateFileExtension: (fileName: string, mimeType: string): boolean => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (!extension) return false;

    const mimeExtensionMap: Record<string, string[]> = {
      'application/pdf': ['pdf'],
      'application/msword': ['doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
      'application/vnd.ms-excel': ['xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['xlsx'],
      'application/vnd.ms-powerpoint': ['ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['pptx'],
      'text/plain': ['txt'],
      'text/csv': ['csv'],
      'image/jpeg': ['jpg', 'jpeg'],
      'image/png': ['png'],
      'image/gif': ['gif'],
      'image/webp': ['webp'],
      'video/mp4': ['mp4'],
      'video/webm': ['webm'],
      'audio/mp3': ['mp3'],
      'audio/wav': ['wav'],
      'audio/ogg': ['ogg']
    };

    const allowedExtensions = mimeExtensionMap[mimeType];
    return allowedExtensions ? allowedExtensions.includes(extension) : false;
  }
};