// User Registration Service for Authentication Service
// Serviço de Registro de Usuário para o Serviço de Autenticação

import { UserRepository } from '../repositories/user-repository';
import { PasswordUtils } from '../utils/password';
import { JWTUtils, TokenType } from '../utils/jwt';
import { validateCreateUser } from '../validators/user-validator';
import { User, CreateUserInput } from '../models/user';
import { Logger } from '../../../shared/src/logging/logger';

/**
 * Registration request interface
 */
export interface RegistrationRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  language?: 'pt' | 'en' | 'fr';
  timezone?: string;
  metadata?: Record<string, any>;
}

/**
 * Registration response interface
 */
export interface RegistrationResponse {
  success: boolean;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    isEmailVerified: boolean;
    language: string;
    createdAt: Date;
  };
  message: string;
  emailVerificationToken?: string;
  nextSteps?: string[];
}

/**
 * Registration error interface
 */
export interface RegistrationError {
  success: false;
  error: string;
  message: string;
  code: string;
  details?: Record<string, any>;
  validationErrors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

/**
 * Email verification request interface
 */
export interface EmailVerificationRequest {
  token: string;
  email: string;
}

/**
 * Email verification response interface
 */
export interface EmailVerificationResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    isEmailVerified: boolean;
  };
}

/**
 * Registration service configuration
 */
export interface RegistrationConfig {
  requireEmailVerification: boolean;
  allowDuplicateEmails: boolean;
  defaultRole: string;
  defaultLanguage: 'pt' | 'en' | 'fr';
  emailVerificationExpiry: string;
  autoActivateUsers: boolean;
  requireTermsAcceptance: boolean;
}

/**
 * Default registration configuration
 */
const DEFAULT_CONFIG: RegistrationConfig = {
  requireEmailVerification: process.env.FEATURE_EMAIL_VERIFICATION === 'true',
  allowDuplicateEmails: false,
  defaultRole: 'user',
  defaultLanguage: 'pt',
  emailVerificationExpiry: '24h',
  autoActivateUsers: process.env.FEATURE_EMAIL_VERIFICATION !== 'true',
  requireTermsAcceptance: true,
};

/**
 * User Registration Service
 */
export class RegistrationService {
  private static logger = new Logger('RegistrationService');
  private static config: RegistrationConfig = DEFAULT_CONFIG;

  constructor(private userRepository: UserRepository) {}

  /**
   * Configure registration settings
   */
  static configure(config: Partial<RegistrationConfig>): void {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.logger.info('Registration configuration updated', {
      requireEmailVerification: this.config.requireEmailVerification,
      defaultRole: this.config.defaultRole,
      defaultLanguage: this.config.defaultLanguage,
      autoActivateUsers: this.config.autoActivateUsers,
    });
  }

  /**
   * Register a new user
   */
  async registerUser(
    request: RegistrationRequest
  ): Promise<RegistrationResponse | RegistrationError> {
    try {
      RegistrationService.logger.info('User registration attempt', {
        email: request.email,
        firstName: request.firstName,
        lastName: request.lastName,
        language: request.language,
      });

      // Validate registration request
      const validationResult = this.validateRegistrationRequest(request);
      if (!validationResult.isValid) {
        return {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Dados de registro inválidos',
          code: 'REG_001',
          validationErrors: validationResult.errors,
        };
      }

      // Check if email already exists
      if (!RegistrationService.config.allowDuplicateEmails) {
        const existingUser = await this.userRepository.findByEmail(request.email);
        if (existingUser) {
          RegistrationService.logger.warn('Registration attempt with existing email', {
            email: request.email,
          });

          return {
            success: false,
            error: 'EMAIL_EXISTS',
            message: 'Este email já está registrado',
            code: 'REG_002',
            details: {
              email: request.email,
              suggestion: 'Tente fazer login ou use a opção "Esqueci minha senha"',
            },
          };
        }
      }

      // Validate password strength
      const passwordValidation = PasswordUtils.validatePassword(request.password);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          error: 'WEAK_PASSWORD',
          message: 'Senha não atende aos requisitos de segurança',
          code: 'REG_003',
          details: {
            errors: passwordValidation.errors,
            suggestions: passwordValidation.suggestions,
            strength: passwordValidation.strength,
            score: passwordValidation.score,
          },
        };
      }

      // Hash password
      const hashedPassword = await PasswordUtils.hash(request.password);

      // Create user data
      const userData: CreateUserInput = {
        firstName: request.firstName.trim(),
        lastName: request.lastName.trim(),
        email: request.email.toLowerCase().trim(),
        password: hashedPassword,
        role: RegistrationService.config.defaultRole,
        language: request.language || RegistrationService.config.defaultLanguage,
        timezone: request.timezone || 'Africa/Luanda',
        isActive: RegistrationService.config.autoActivateUsers,
        isEmailVerified: !RegistrationService.config.requireEmailVerification,
        metadata: {
          registrationSource: 'web',
          acceptedTermsAt: new Date(),
          ...request.metadata,
        },
      };

      // Create user
      const user = await this.userRepository.create(userData, 'system');

      RegistrationService.logger.info('User registered successfully', {
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      });

      // Prepare response
      const response: RegistrationResponse = {
        success: true,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          isEmailVerified: user.isEmailVerified,
          language: user.language,
          createdAt: user.createdAt,
        },
        message: 'Usuário registrado com sucesso',
        nextSteps: [],
      };

      // Generate email verification token if required
      if (RegistrationService.config.requireEmailVerification && !user.isEmailVerified) {
        const emailVerificationToken = JWTUtils.generateSpecialToken(
          {
            userId: user.id,
            email: user.email,
            purpose: 'email-verification',
          },
          TokenType.EMAIL_VERIFICATION,
          RegistrationService.config.emailVerificationExpiry
        );

        response.emailVerificationToken = emailVerificationToken;
        response.message = 'Usuário registrado. Verifique seu email para ativar a conta.';
        response.nextSteps.push('Verificar email');

        // TODO: Send email verification email
        await this.sendEmailVerification(user.email, emailVerificationToken);
      }

      return response;
    } catch (error) {
      RegistrationService.logger.error('User registration failed', {
        error: error.message,
        stack: error.stack,
        email: request.email,
      });

      return {
        success: false,
        error: 'REGISTRATION_FAILED',
        message: 'Erro interno durante o registro',
        code: 'REG_004',
        details: {
          timestamp: new Date(),
          errorId: `reg_${Date.now()}`,
        },
      };
    }
  }

  /**
   * Verify email address
   */
  async verifyEmail(request: EmailVerificationRequest): Promise<EmailVerificationResponse> {
    try {
      RegistrationService.logger.info('Email verification attempt', {
        email: request.email,
      });

      // Validate token
      const tokenValidation = JWTUtils.validateToken(
        request.token,
        process.env.JWT_ACCESS_SECRET || 'default-access-secret-change-in-production',
        TokenType.EMAIL_VERIFICATION
      );

      if (!tokenValidation.isValid) {
        RegistrationService.logger.warn('Invalid email verification token', {
          email: request.email,
          error: tokenValidation.error,
        });

        return {
          success: false,
          message: tokenValidation.expired
            ? 'Token de verificação expirado. Solicite um novo token.'
            : 'Token de verificação inválido.',
        };
      }

      // Verify email matches token
      if (tokenValidation.payload!.email !== request.email) {
        RegistrationService.logger.warn('Email verification token mismatch', {
          tokenEmail: tokenValidation.payload!.email,
          requestEmail: request.email,
        });

        return {
          success: false,
          message: 'Token não corresponde ao email fornecido.',
        };
      }

      // Find user
      const user = await this.userRepository.findById(tokenValidation.payload!.userId);
      if (!user) {
        RegistrationService.logger.warn('User not found for email verification', {
          userId: tokenValidation.payload!.userId,
          email: request.email,
        });

        return {
          success: false,
          message: 'Usuário não encontrado.',
        };
      }

      // Check if already verified
      if (user.isEmailVerified) {
        return {
          success: true,
          message: 'Email já foi verificado anteriormente.',
          user: {
            id: user.id,
            email: user.email,
            isEmailVerified: true,
          },
        };
      }

      // Update user as verified and active
      const updatedUser = await this.userRepository.update(
        user.id,
        {
          isEmailVerified: true,
          isActive: true,
          emailVerifiedAt: new Date(),
        },
        'system'
      );

      if (!updatedUser) {
        throw new Error('Failed to update user verification status');
      }

      RegistrationService.logger.info('Email verified successfully', {
        userId: user.id,
        email: user.email,
      });

      return {
        success: true,
        message: 'Email verificado com sucesso. Sua conta está agora ativa.',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          isEmailVerified: true,
        },
      };
    } catch (error) {
      RegistrationService.logger.error('Email verification failed', {
        error: error.message,
        stack: error.stack,
        email: request.email,
      });

      return {
        success: false,
        message: 'Erro interno durante a verificação do email.',
      };
    }
  }

  /**
   * Resend email verification
   */
  async resendEmailVerification(email: string): Promise<{ success: boolean; message: string }> {
    try {
      RegistrationService.logger.info('Resend email verification request', { email });

      // Find user
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        // Don't reveal if email exists for security
        return {
          success: true,
          message:
            'Se o email existir em nosso sistema, um novo token de verificação será enviado.',
        };
      }

      // Check if already verified
      if (user.isEmailVerified) {
        return {
          success: false,
          message: 'Este email já foi verificado.',
        };
      }

      // Generate new verification token
      const emailVerificationToken = JWTUtils.generateSpecialToken(
        {
          userId: user.id,
          email: user.email,
          purpose: 'email-verification-resend',
        },
        TokenType.EMAIL_VERIFICATION,
        RegistrationService.config.emailVerificationExpiry
      );

      // TODO: Send email verification email
      await this.sendEmailVerification(user.email, emailVerificationToken);

      RegistrationService.logger.info('Email verification resent', {
        userId: user.id,
        email: user.email,
      });

      return {
        success: true,
        message: 'Novo token de verificação enviado para seu email.',
      };
    } catch (error) {
      RegistrationService.logger.error('Failed to resend email verification', {
        error: error.message,
        email,
      });

      return {
        success: false,
        message: 'Erro interno ao reenviar verificação de email.',
      };
    }
  }

  /**
   * Validate registration request
   */
  private validateRegistrationRequest(request: RegistrationRequest): {
    isValid: boolean;
    errors: Array<{ field: string; message: string; code: string }>;
  } {
    const errors: Array<{ field: string; message: string; code: string }> = [];

    // Validate required fields
    if (!request.firstName?.trim()) {
      errors.push({
        field: 'firstName',
        message: 'Nome é obrigatório',
        code: 'REQUIRED_FIELD',
      });
    }

    if (!request.lastName?.trim()) {
      errors.push({
        field: 'lastName',
        message: 'Sobrenome é obrigatório',
        code: 'REQUIRED_FIELD',
      });
    }

    if (!request.email?.trim()) {
      errors.push({
        field: 'email',
        message: 'Email é obrigatório',
        code: 'REQUIRED_FIELD',
      });
    }

    if (!request.password) {
      errors.push({
        field: 'password',
        message: 'Senha é obrigatória',
        code: 'REQUIRED_FIELD',
      });
    }

    if (!request.confirmPassword) {
      errors.push({
        field: 'confirmPassword',
        message: 'Confirmação de senha é obrigatória',
        code: 'REQUIRED_FIELD',
      });
    }

    // Validate email format
    if (request.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(request.email)) {
      errors.push({
        field: 'email',
        message: 'Formato de email inválido',
        code: 'INVALID_EMAIL_FORMAT',
      });
    }

    // Validate password confirmation
    if (
      request.password &&
      request.confirmPassword &&
      request.password !== request.confirmPassword
    ) {
      errors.push({
        field: 'confirmPassword',
        message: 'Senhas não coincidem',
        code: 'PASSWORD_MISMATCH',
      });
    }

    // Validate terms acceptance
    if (RegistrationService.config.requireTermsAcceptance && !request.acceptTerms) {
      errors.push({
        field: 'acceptTerms',
        message: 'Você deve aceitar os termos de uso',
        code: 'TERMS_NOT_ACCEPTED',
      });
    }

    // Validate name lengths
    if (request.firstName && request.firstName.trim().length < 2) {
      errors.push({
        field: 'firstName',
        message: 'Nome deve ter pelo menos 2 caracteres',
        code: 'MIN_LENGTH',
      });
    }

    if (request.lastName && request.lastName.trim().length < 2) {
      errors.push({
        field: 'lastName',
        message: 'Sobrenome deve ter pelo menos 2 caracteres',
        code: 'MIN_LENGTH',
      });
    }

    // Validate language
    if (request.language && !['pt', 'en', 'fr'].includes(request.language)) {
      errors.push({
        field: 'language',
        message: 'Idioma deve ser pt, en ou fr',
        code: 'INVALID_LANGUAGE',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Send email verification (placeholder)
   */
  private async sendEmailVerification(email: string, token: string): Promise<void> {
    // TODO: Implement actual email sending
    RegistrationService.logger.info('Email verification would be sent', {
      email,
      tokenLength: token.length,
    });

    // In a real implementation, you would:
    // 1. Generate verification URL with token
    // 2. Load email template
    // 3. Send email via email service (SendGrid, AWS SES, etc.)

    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

    RegistrationService.logger.debug('Verification URL generated', {
      email,
      url: verificationUrl,
    });
  }

  /**
   * Get registration statistics
   */
  async getRegistrationStats(): Promise<{
    totalRegistrations: number;
    verifiedUsers: number;
    pendingVerification: number;
    registrationsToday: number;
    registrationsThisWeek: number;
    registrationsThisMonth: number;
  }> {
    try {
      // TODO: Implement actual statistics queries
      return {
        totalRegistrations: 0,
        verifiedUsers: 0,
        pendingVerification: 0,
        registrationsToday: 0,
        registrationsThisWeek: 0,
        registrationsThisMonth: 0,
      };
    } catch (error) {
      RegistrationService.logger.error('Failed to get registration stats', { error });
      throw error;
    }
  }

  /**
   * Get current configuration
   */
  static getConfig(): RegistrationConfig {
    return { ...this.config };
  }
}

/**
 * Export types and service
 */
export type {
  RegistrationRequest,
  RegistrationResponse,
  RegistrationError,
  EmailVerificationRequest,
  EmailVerificationResponse,
  RegistrationConfig,
};
