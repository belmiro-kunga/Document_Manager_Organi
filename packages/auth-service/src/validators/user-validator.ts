// User validation for Authentication Service
// Validação de usuário para o Serviço de Autenticação
import Joi from 'joi';
import { UserRole, SupportedLanguage, CreateUserInput, UpdateUserInput, ChangePasswordInput } from '../models/user';

/**
 * User creation validation schema
 */
export const createUserSchema = Joi.object<CreateUserInput>({
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
    .min(2)
    .max(100)
    .required()
    .pattern(/^[a-zA-ZÀ-ÿ\s]+$/)
    .messages({
      'string.min': 'Nome deve ter pelo menos 2 caracteres',
      'string.max': 'Nome deve ter no máximo 100 caracteres',
      'string.empty': 'Nome é obrigatório',
      'string.pattern.base': 'Nome deve conter apenas letras e espaços'
    }),

  lastName: Joi.string()
    .min(2)
    .max(100)
    .required()
    .pattern(/^[a-zA-ZÀ-ÿ\s]+$/)
    .messages({
      'string.min': 'Sobrenome deve ter pelo menos 2 caracteres',
      'string.max': 'Sobrenome deve ter no máximo 100 caracteres',
      'string.empty': 'Sobrenome é obrigatório',
      'string.pattern.base': 'Sobrenome deve conter apenas letras e espaços'
    }),

  password: Joi.string()
    .min(8)
    .max(128)
    .required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .messages({
      'string.min': 'Senha deve ter pelo menos 8 caracteres',
      'string.max': 'Senha deve ter no máximo 128 caracteres',
      'string.empty': 'Senha é obrigatória',
      'string.pattern.base': 'Senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial'
    }),

  role: Joi.string()
    .valid(...Object.values(UserRole))
    .default(UserRole.USER)
    .messages({
      'any.only': 'Role deve ser um dos valores válidos: admin, manager, user, guest'
    }),

  language: Joi.string()
    .valid(...Object.values(SupportedLanguage))
    .default(SupportedLanguage.PT)
    .messages({
      'any.only': 'Idioma deve ser um dos valores válidos: pt, en, fr'
    }),

  department: Joi.string()
    .max(100)
    .optional()
    .messages({
      'string.max': 'Departamento deve ter no máximo 100 caracteres'
    }),

  position: Joi.string()
    .max(100)
    .optional()
    .messages({
      'string.max': 'Cargo deve ter no máximo 100 caracteres'
    }),

  phone: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Telefone deve ter um formato válido (ex: +244123456789)'
    }),

  sendWelcomeEmail: Joi.boolean()
    .default(true),

  requireEmailVerification: Joi.boolean()
    .default(false)
});

/**
 * User update validation schema
 */
export const updateUserSchema = Joi.object<UpdateUserInput>({
  firstName: Joi.string()
    .min(2)
    .max(100)
    .pattern(/^[a-zA-ZÀ-ÿ\s]+$/)
    .optional()
    .messages({
      'string.min': 'Nome deve ter pelo menos 2 caracteres',
      'string.max': 'Nome deve ter no máximo 100 caracteres',
      'string.pattern.base': 'Nome deve conter apenas letras e espaços'
    }),

  lastName: Joi.string()
    .min(2)
    .max(100)
    .pattern(/^[a-zA-ZÀ-ÿ\s]+$/)
    .optional()
    .messages({
      'string.min': 'Sobrenome deve ter pelo menos 2 caracteres',
      'string.max': 'Sobrenome deve ter no máximo 100 caracteres',
      'string.pattern.base': 'Sobrenome deve conter apenas letras e espaços'
    }),

  email: Joi.string()
    .email()
    .max(255)
    .optional()
    .messages({
      'string.email': 'Email deve ter um formato válido',
      'string.max': 'Email deve ter no máximo 255 caracteres'
    }),

  username: Joi.string()
    .alphanum()
    .min(3)
    .max(50)
    .optional()
    .messages({
      'string.alphanum': 'Username deve conter apenas letras e números',
      'string.min': 'Username deve ter pelo menos 3 caracteres',
      'string.max': 'Username deve ter no máximo 50 caracteres'
    }),

  role: Joi.string()
    .valid(...Object.values(UserRole))
    .optional()
    .messages({
      'any.only': 'Role deve ser um dos valores válidos: admin, manager, user, guest'
    }),

  language: Joi.string()
    .valid(...Object.values(SupportedLanguage))
    .optional()
    .messages({
      'any.only': 'Idioma deve ser um dos valores válidos: pt, en, fr'
    }),

  department: Joi.string()
    .max(100)
    .optional()
    .allow(null)
    .messages({
      'string.max': 'Departamento deve ter no máximo 100 caracteres'
    }),

  position: Joi.string()
    .max(100)
    .optional()
    .allow(null)
    .messages({
      'string.max': 'Cargo deve ter no máximo 100 caracteres'
    }),

  phone: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .optional()
    .allow(null)
    .messages({
      'string.pattern.base': 'Telefone deve ter um formato válido (ex: +244123456789)'
    }),

  isActive: Joi.boolean()
    .optional(),

  preferences: Joi.object()
    .optional(),

  profile: Joi.object()
    .optional()
});

/**
 * Password change validation schema
 */
export const changePasswordSchema = Joi.object<ChangePasswordInput>({
  currentPassword: Joi.string()
    .required()
    .messages({
      'string.empty': 'Senha atual é obrigatória'
    }),

  newPassword: Joi.string()
    .min(8)
    .max(128)
    .required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .messages({
      'string.min': 'Nova senha deve ter pelo menos 8 caracteres',
      'string.max': 'Nova senha deve ter no máximo 128 caracteres',
      'string.empty': 'Nova senha é obrigatória',
      'string.pattern.base': 'Nova senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial'
    }),

  confirmPassword: Joi.string()
    .required()
    .valid(Joi.ref('newPassword'))
    .messages({
      'string.empty': 'Confirmação de senha é obrigatória',
      'any.only': 'Confirmação de senha deve ser igual à nova senha'
    }),

  logoutOtherSessions: Joi.boolean()
    .default(false)
});

/**
 * Login validation schema
 */
export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Email deve ter um formato válido',
      'string.empty': 'Email é obrigatório'
    }),

  password: Joi.string()
    .required()
    .messages({
      'string.empty': 'Senha é obrigatória'
    }),

  rememberMe: Joi.boolean()
    .default(false),

  deviceName: Joi.string()
    .max(100)
    .optional()
    .messages({
      'string.max': 'Nome do dispositivo deve ter no máximo 100 caracteres'
    })
});

/**
 * Email verification schema
 */
export const emailVerificationSchema = Joi.object({
  token: Joi.string()
    .required()
    .messages({
      'string.empty': 'Token de verificação é obrigatório'
    })
});

/**
 * Password reset request schema
 */
export const passwordResetRequestSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Email deve ter um formato válido',
      'string.empty': 'Email é obrigatório'
    })
});

/**
 * Password reset confirmation schema
 */
export const passwordResetConfirmationSchema = Joi.object({
  token: Joi.string()
    .required()
    .messages({
      'string.empty': 'Token de redefinição é obrigatório'
    }),

  newPassword: Joi.string()
    .min(8)
    .max(128)
    .required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .messages({
      'string.min': 'Nova senha deve ter pelo menos 8 caracteres',
      'string.max': 'Nova senha deve ter no máximo 128 caracteres',
      'string.empty': 'Nova senha é obrigatória',
      'string.pattern.base': 'Nova senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial'
    }),

  confirmPassword: Joi.string()
    .required()
    .valid(Joi.ref('newPassword'))
    .messages({
      'string.empty': 'Confirmação de senha é obrigatória',
      'any.only': 'Confirmação de senha deve ser igual à nova senha'
    })
});

/**
 * User search filters schema
 */
export const userSearchSchema = Joi.object({
  query: Joi.string()
    .max(255)
    .optional()
    .messages({
      'string.max': 'Consulta deve ter no máximo 255 caracteres'
    }),

  role: Joi.string()
    .valid(...Object.values(UserRole))
    .optional()
    .messages({
      'any.only': 'Role deve ser um dos valores válidos: admin, manager, user, guest'
    }),

  department: Joi.string()
    .max(100)
    .optional()
    .messages({
      'string.max': 'Departamento deve ter no máximo 100 caracteres'
    }),

  isActive: Joi.boolean()
    .optional(),

  isEmailVerified: Joi.boolean()
    .optional(),

  createdAfter: Joi.date()
    .optional(),

  createdBefore: Joi.date()
    .optional(),

  lastLoginAfter: Joi.date()
    .optional(),

  lastLoginBefore: Joi.date()
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
    .valid('createdAt', 'updatedAt', 'lastLoginAt', 'email', 'firstName', 'lastName')
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
 * Validate user creation input
 */
export const validateCreateUser = (data: any) => {
  return createUserSchema.validate(data, { abortEarly: false });
};

/**
 * Validate user update input
 */
export const validateUpdateUser = (data: any) => {
  return updateUserSchema.validate(data, { abortEarly: false });
};

/**
 * Validate password change input
 */
export const validateChangePassword = (data: any) => {
  return changePasswordSchema.validate(data, { abortEarly: false });
};

/**
 * Validate login input
 */
export const validateLogin = (data: any) => {
  return loginSchema.validate(data, { abortEarly: false });
};

/**
 * Validate email verification input
 */
export const validateEmailVerification = (data: any) => {
  return emailVerificationSchema.validate(data, { abortEarly: false });
};

/**
 * Validate password reset request input
 */
export const validatePasswordResetRequest = (data: any) => {
  return passwordResetRequestSchema.validate(data, { abortEarly: false });
};

/**
 * Validate password reset confirmation input
 */
export const validatePasswordResetConfirmation = (data: any) => {
  return passwordResetConfirmationSchema.validate(data, { abortEarly: false });
};

/**
 * Validate user search filters
 */
export const validateUserSearch = (data: any) => {
  return userSearchSchema.validate(data, { abortEarly: false });
};

/**
 * Custom validation functions
 */
export const customValidations = {
  /**
   * Check if password meets complexity requirements
   */
  isPasswordComplex: (password: string): boolean => {
    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[@$!%*?&]/.test(password);
    const hasMinLength = password.length >= 8;
    const hasMaxLength = password.length <= 128;

    return hasLowerCase && hasUpperCase && hasNumbers && hasSpecialChar && hasMinLength && hasMaxLength;
  },

  /**
   * Check if email is valid
   */
  isEmailValid: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 255;
  },

  /**
   * Check if username is valid
   */
  isUsernameValid: (username: string): boolean => {
    const usernameRegex = /^[a-zA-Z0-9]+$/;
    return usernameRegex.test(username) && username.length >= 3 && username.length <= 50;
  },

  /**
   * Check if phone number is valid
   */
  isPhoneValid: (phone: string): boolean => {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  },

  /**
   * Check if name is valid (only letters and spaces)
   */
  isNameValid: (name: string): boolean => {
    const nameRegex = /^[a-zA-ZÀ-ÿ\s]+$/;
    return nameRegex.test(name) && name.length >= 2 && name.length <= 100;
  }
};