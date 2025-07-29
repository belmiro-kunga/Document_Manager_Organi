// User validation for Authentication Service
// Validação de usuário para o Serviço de Autenticação
import Joi from 'joi';
import { CreateUserInput, UpdateUserInput, AuthUser } from '../models/user';
import { UserRole, SupportedLanguage } from '@adms/shared';

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  data?: any;
}

/**
 * User creation validation schema
 */
const createUserSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .max(255)
    .messages({
      'string.email': 'Email deve ter um formato válido',
      'string.empty': 'Email é obrigatório',
      'string.max': 'Email deve ter no máximo 255 caracteres'
    }),
  
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(50)
    .required()
    .messages({
      'string.alphanum': 'Username deve conter apenas letras e números',
      'string.min': 'Username deve ter pelo menos 3 caracteres',
      'string.max': 'Username deve ter no máximo 50 caracteres',
      'string.empty': 'Username é obrigatório'
    }),
  
  firstName: Joi.string()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.min': 'Nome deve ter pelo menos 1 caractere',
      'string.max': 'Nome deve ter no máximo 100 caracteres',
      'string.empty': 'Nome é obrigatório'
    }),
  
  lastName: Joi.string()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.min': 'Sobrenome deve ter pelo menos 1 caractere',
      'string.max': 'Sobrenome deve ter no máximo 100 caracteres',
      'string.empty': 'Sobrenome é obrigatório'
    }),
  
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.min': 'Senha deve ter pelo menos 8 caracteres',
      'string.max': 'Senha deve ter no máximo 128 caracteres',
      'string.pattern.base': 'Senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial',
      'string.empty': 'Senha é obrigatória'
    }),
  
  role: Joi.string()
    .valid('admin', 'manager', 'user', 'viewer')
    .default('user')
    .messages({
      'any.only': 'Role deve ser: admin, manager, user ou viewer'
    }),
  
  language: Joi.string()
    .valid('pt', 'en', 'fr')
    .default('pt')
    .messages({
      'any.only': 'Idioma deve ser: pt, en ou fr'
    }),
  
  department: Joi.string()
    .max(100)
    .allow(null, '')
    .messages({
      'string.max': 'Departamento deve ter no máximo 100 caracteres'
    }),
  
  position: Joi.string()
    .max(100)
    .allow(null, '')
    .messages({
      'string.max': 'Cargo deve ter no máximo 100 caracteres'
    }),
  
  phone: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .allow(null, '')
    .messages({
      'string.pattern.base': 'Telefone deve ter um formato válido'
    }),
  
  sendWelcomeEmail: Joi.boolean().default(true),
  requireEmailVerification: Joi.boolean().default(false)
});

/**
 * User update validation schema
 */
const updateUserSchema = Joi.object({
  firstName: Joi.string()
    .min(1)
    .max(100)
    .messages({
      'string.min': 'Nome deve ter pelo menos 1 caractere',
      'string.max': 'Nome deve ter no máximo 100 caracteres'
    }),
  
  lastName: Joi.string()
    .min(1)
    .max(100)
    .messages({
      'string.min': 'Sobrenome deve ter pelo menos 1 caractere',
      'string.max': 'Sobrenome deve ter no máximo 100 caracteres'
    }),
  
  email: Joi.string()
    .email()
    .max(255)
    .messages({
      'string.email': 'Email deve ter um formato válido',
      'string.max': 'Email deve ter no máximo 255 caracteres'
    }),
  
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(50)
    .messages({
      'string.alphanum': 'Username deve conter apenas letras e números',
      'string.min': 'Username deve ter pelo menos 3 caracteres',
      'string.max': 'Username deve ter no máximo 50 caracteres'
    }),
  
  role: Joi.string()
    .valid('admin', 'manager', 'user', 'viewer')
    .messages({
      'any.only': 'Role deve ser: admin, manager, user ou viewer'
    }),
  
  language: Joi.string()
    .valid('pt', 'en', 'fr')
    .messages({
      'any.only': 'Idioma deve ser: pt, en ou fr'
    }),
  
  department: Joi.string()
    .max(100)
    .allow(null, '')
    .messages({
      'string.max': 'Departamento deve ter no máximo 100 caracteres'
    }),
  
  position: Joi.string()
    .max(100)
    .allow(null, '')
    .messages({
      'string.max': 'Cargo deve ter no máximo 100 caracteres'
    }),
  
  phone: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .allow(null, '')
    .messages({
      'string.pattern.base': 'Telefone deve ter um formato válido'
    }),
  
  isActive: Joi.boolean(),
  
  preferences: Joi.object({
    language: Joi.string().valid('pt', 'en', 'fr'),
    timezone: Joi.string(),
    dateFormat: Joi.string(),
    timeFormat: Joi.string(),
    theme: Joi.string().valid('light', 'dark', 'auto'),
    notifications: Joi.object({
      email: Joi.boolean(),
      push: Joi.boolean(),
      sms: Joi.boolean(),
      desktop: Joi.boolean(),
      documentUpdates: Joi.boolean(),
      workflowUpdates: Joi.boolean(),
      systemUpdates: Joi.boolean(),
      securityAlerts: Joi.boolean(),
      marketingEmails: Joi.boolean()
    }),
    dashboard: Joi.object({
      widgets: Joi.array().items(Joi.string()),
      layout: Joi.string().valid('grid', 'list'),
      defaultView: Joi.string().valid('recent', 'favorites', 'assigned'),
      itemsPerPage: Joi.number().min(10).max(100),
      showTutorials: Joi.boolean()
    }),
    privacy: Joi.object({
      profileVisibility: Joi.string().valid('public', 'private', 'contacts'),
      showOnlineStatus: Joi.boolean(),
      allowDirectMessages: Joi.boolean(),
      shareUsageData: Joi.boolean()
    }),
    accessibility: Joi.object({
      highContrast: Joi.boolean(),
      largeText: Joi.boolean(),
      reduceMotion: Joi.boolean(),
      screenReader: Joi.boolean(),
      keyboardNavigation: Joi.boolean()
    })
  }),
  
  profile: Joi.object({
    displayName: Joi.string().max(255),
    bio: Joi.string().max(500),
    website: Joi.string().uri(),
    location: Joi.string().max(100),
    jobTitle: Joi.string().max(100),
    company: Joi.string().max(100),
    avatar: Joi.string().uri(),
    coverImage: Joi.string().uri(),
    isPublic: Joi.boolean(),
    showContactInfo: Joi.boolean()
  })
}).min(1);

/**
 * Password validation schema
 */
const passwordSchema = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  .messages({
    'string.min': 'Senha deve ter pelo menos 8 caracteres',
    'string.max': 'Senha deve ter no máximo 128 caracteres',
    'string.pattern.base': 'Senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial'
  });

/**
 * Email validation schema
 */
const emailSchema = Joi.string()
  .email()
  .max(255)
  .messages({
    'string.email': 'Email deve ter um formato válido',
    'string.max': 'Email deve ter no máximo 255 caracteres'
  });

/**
 * Username validation schema
 */
const usernameSchema = Joi.string()
  .alphanum()
  .min(3)
  .max(50)
  .messages({
    'string.alphanum': 'Username deve conter apenas letras e números',
    'string.min': 'Username deve ter pelo menos 3 caracteres',
    'string.max': 'Username deve ter no máximo 50 caracteres'
  });

/**
 * Validate user creation data
 */
export function validateCreateUser(data: CreateUserInput): ValidationResult {
  const { error, value } = createUserSchema.validate(data, { 
    abortEarly: false,
    stripUnknown: true 
  });

  if (error) {
    return {
      isValid: false,
      errors: error.details.map(detail => detail.message)
    };
  }

  return {
    isValid: true,
    errors: [],
    data: value
  };
}

/**
 * Validate user update data
 */
export function validateUpdateUser(data: UpdateUserInput): ValidationResult {
  const { error, value } = updateUserSchema.validate(data, { 
    abortEarly: false,
    stripUnknown: true 
  });

  if (error) {
    return {
      isValid: false,
      errors: error.details.map(detail => detail.message)
    };
  }

  return {
    isValid: true,
    errors: [],
    data: value
  };
}

/**
 * Validate complete user object
 */
export function validateUser(data: Partial<AuthUser>): ValidationResult {
  // This would be used for validating existing user data
  // Implementation depends on specific requirements
  return {
    isValid: true,
    errors: []
  };
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): ValidationResult {
  const { error } = passwordSchema.validate(password);

  if (error) {
    return {
      isValid: false,
      errors: error.details.map(detail => detail.message)
    };
  }

  // Additional password strength checks
  const strengthChecks = {
    hasLowercase: /[a-z]/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasNumbers: /\d/.test(password),
    hasSpecialChars: /[@$!%*?&]/.test(password),
    minLength: password.length >= 8,
    maxLength: password.length <= 128,
    noCommonPatterns: !isCommonPassword(password)
  };

  const failedChecks = Object.entries(strengthChecks)
    .filter(([_, passed]) => !passed)
    .map(([check]) => getPasswordCheckMessage(check));

  if (failedChecks.length > 0) {
    return {
      isValid: false,
      errors: failedChecks
    };
  }

  return {
    isValid: true,
    errors: []
  };
}

/**
 * Validate email format
 */
export function validateEmail(email: string): ValidationResult {
  const { error } = emailSchema.validate(email);

  if (error) {
    return {
      isValid: false,
      errors: error.details.map(detail => detail.message)
    };
  }

  return {
    isValid: true,
    errors: []
  };
}

/**
 * Validate username format
 */
export function validateUsername(username: string): ValidationResult {
  const { error } = usernameSchema.validate(username);

  if (error) {
    return {
      isValid: false,
      errors: error.details.map(detail => detail.message)
    };
  }

  // Additional username checks
  const reservedUsernames = [
    'admin', 'administrator', 'root', 'system', 'api', 'www', 'mail',
    'ftp', 'support', 'help', 'info', 'contact', 'service', 'test'
  ];

  if (reservedUsernames.includes(username.toLowerCase())) {
    return {
      isValid: false,
      errors: ['Este username está reservado e não pode ser usado']
    };
  }

  return {
    isValid: true,
    errors: []
  };
}

/**
 * Check if password is commonly used
 */
function isCommonPassword(password: string): boolean {
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123',
    'password123', 'admin', 'letmein', 'welcome', '12345678'
  ];

  return commonPasswords.includes(password.toLowerCase());
}

/**
 * Get password check error message
 */
function getPasswordCheckMessage(check: string): string {
  const messages: Record<string, string> = {
    hasLowercase: 'Senha deve conter pelo menos uma letra minúscula',
    hasUppercase: 'Senha deve conter pelo menos uma letra maiúscula',
    hasNumbers: 'Senha deve conter pelo menos um número',
    hasSpecialChars: 'Senha deve conter pelo menos um caractere especial (@$!%*?&)',
    minLength: 'Senha deve ter pelo menos 8 caracteres',
    maxLength: 'Senha deve ter no máximo 128 caracteres',
    noCommonPatterns: 'Esta senha é muito comum, escolha uma senha mais segura'
  };

  return messages[check] || 'Senha não atende aos critérios de segurança';
}

/**
 * Validate user search filters
 */
export function validateUserSearchFilters(filters: any): ValidationResult {
  const schema = Joi.object({
    query: Joi.string().max(255),
    role: Joi.string().valid('admin', 'manager', 'user', 'viewer'),
    department: Joi.string().max(100),
    isActive: Joi.boolean(),
    isEmailVerified: Joi.boolean(),
    createdAfter: Joi.date(),
    createdBefore: Joi.date(),
    lastLoginAfter: Joi.date(),
    lastLoginBefore: Joi.date()
  });

  const { error, value } = schema.validate(filters, { 
    abortEarly: false,
    stripUnknown: true 
  });

  if (error) {
    return {
      isValid: false,
      errors: error.details.map(detail => detail.message)
    };
  }

  return {
    isValid: true,
    errors: [],
    data: value
  };
}