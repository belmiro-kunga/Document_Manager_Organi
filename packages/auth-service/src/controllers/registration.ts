// Registration Controller for Authentication Service
// Controlador de Registro para o Serviço de Autenticação

import { Request, Response } from 'express';
import { RegistrationService, RegistrationRequest } from '../services/registration';
import { UserRepository } from '../repositories/user-repository';
import { DatabaseService } from '../services/database';
import { Logger } from '../../../shared/src/logging/logger';

/**
 * Registration Controller
 */
export class RegistrationController {
  private static logger = new Logger('RegistrationController');
  private registrationService: RegistrationService;

  constructor(private databaseService: DatabaseService) {
    const userRepository = new UserRepository(databaseService, RegistrationController.logger);
    this.registrationService = new RegistrationService(userRepository);
  }

  /**
   * Register new user
   * POST /auth/register
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      RegistrationController.logger.info('Registration request received', {
        email: req.body.email,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });

      // Extract registration data from request
      const registrationRequest: RegistrationRequest = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        acceptTerms: req.body.acceptTerms,
        language: req.body.language || 'pt',
        timezone: req.body.timezone || 'Africa/Luanda',
        metadata: {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          registrationSource: 'api',
          ...req.body.metadata,
        },
      };

      // Process registration
      const result = await this.registrationService.registerUser(registrationRequest);

      if (result.success) {
        RegistrationController.logger.info('User registration successful', {
          userId: result.user.id,
          email: result.user.email,
        });

        res.status(201).json({
          success: true,
          data: {
            user: result.user,
            message: result.message,
            nextSteps: result.nextSteps,
          },
          meta: {
            timestamp: new Date(),
            requestId: req.headers['x-request-id'] || `reg_${Date.now()}`,
          },
        });
      } else {
        RegistrationController.logger.warn('User registration failed', {
          error: result.error,
          message: result.message,
          email: req.body.email,
        });

        // Determine appropriate HTTP status code
        let statusCode = 400;
        if (result.code === 'REG_002') statusCode = 409; // Email exists
        if (result.code === 'REG_004') statusCode = 500; // Internal error

        res.status(statusCode).json({
          success: false,
          error: {
            type: result.error,
            message: result.message,
            code: result.code,
            details: result.details,
            validationErrors: result.validationErrors,
          },
          meta: {
            timestamp: new Date(),
            requestId: req.headers['x-request-id'] || `reg_${Date.now()}`,
          },
        });
      }
    } catch (error) {
      RegistrationController.logger.error('Registration controller error', {
        error: error.message,
        stack: error.stack,
        body: req.body,
        ip: req.ip,
      });

      res.status(500).json({
        success: false,
        error: {
          type: 'INTERNAL_ERROR',
          message: 'Erro interno do servidor',
          code: 'REG_500',
        },
        meta: {
          timestamp: new Date(),
          requestId: req.headers['x-request-id'] || `reg_${Date.now()}`,
        },
      });
    }
  }

  /**
   * Verify email address
   * POST /auth/verify-email
   */
  async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      RegistrationController.logger.info('Email verification request received', {
        email: req.body.email,
        ip: req.ip,
      });

      const { token, email } = req.body;

      if (!token || !email) {
        res.status(400).json({
          success: false,
          error: {
            type: 'VALIDATION_ERROR',
            message: 'Token e email são obrigatórios',
            code: 'VER_001',
          },
        });
        return;
      }

      const result = await this.registrationService.verifyEmail({ token, email });

      if (result.success) {
        RegistrationController.logger.info('Email verification successful', {
          email,
          userId: result.user?.id,
        });

        res.status(200).json({
          success: true,
          data: {
            message: result.message,
            user: result.user,
          },
          meta: {
            timestamp: new Date(),
            requestId: req.headers['x-request-id'] || `ver_${Date.now()}`,
          },
        });
      } else {
        RegistrationController.logger.warn('Email verification failed', {
          email,
          message: result.message,
        });

        res.status(400).json({
          success: false,
          error: {
            type: 'VERIFICATION_FAILED',
            message: result.message,
            code: 'VER_002',
          },
          meta: {
            timestamp: new Date(),
            requestId: req.headers['x-request-id'] || `ver_${Date.now()}`,
          },
        });
      }
    } catch (error) {
      RegistrationController.logger.error('Email verification controller error', {
        error: error.message,
        stack: error.stack,
        body: req.body,
        ip: req.ip,
      });

      res.status(500).json({
        success: false,
        error: {
          type: 'INTERNAL_ERROR',
          message: 'Erro interno do servidor',
          code: 'VER_500',
        },
      });
    }
  }

  /**
   * Resend email verification
   * POST /auth/resend-verification
   */
  async resendVerification(req: Request, res: Response): Promise<void> {
    try {
      RegistrationController.logger.info('Resend verification request received', {
        email: req.body.email,
        ip: req.ip,
      });

      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          error: {
            type: 'VALIDATION_ERROR',
            message: 'Email é obrigatório',
            code: 'RESEND_001',
          },
        });
        return;
      }

      const result = await this.registrationService.resendEmailVerification(email);

      if (result.success) {
        RegistrationController.logger.info('Email verification resent', { email });

        res.status(200).json({
          success: true,
          data: {
            message: result.message,
          },
          meta: {
            timestamp: new Date(),
            requestId: req.headers['x-request-id'] || `resend_${Date.now()}`,
          },
        });
      } else {
        res.status(400).json({
          success: false,
          error: {
            type: 'RESEND_FAILED',
            message: result.message,
            code: 'RESEND_002',
          },
        });
      }
    } catch (error) {
      RegistrationController.logger.error('Resend verification controller error', {
        error: error.message,
        stack: error.stack,
        body: req.body,
        ip: req.ip,
      });

      res.status(500).json({
        success: false,
        error: {
          type: 'INTERNAL_ERROR',
          message: 'Erro interno do servidor',
          code: 'RESEND_500',
        },
      });
    }
  }

  /**
   * Check email availability
   * GET /auth/check-email/:email
   */
  async checkEmailAvailability(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.params;

      if (!email) {
        res.status(400).json({
          success: false,
          error: {
            type: 'VALIDATION_ERROR',
            message: 'Email é obrigatório',
            code: 'CHECK_001',
          },
        });
        return;
      }

      // Validate email format
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        res.status(400).json({
          success: false,
          error: {
            type: 'INVALID_EMAIL',
            message: 'Formato de email inválido',
            code: 'CHECK_002',
          },
        });
        return;
      }

      const userRepository = new UserRepository(
        this.databaseService,
        RegistrationController.logger
      );
      const existingUser = await userRepository.findByEmail(email);

      res.status(200).json({
        success: true,
        data: {
          email,
          available: !existingUser,
          message: existingUser ? 'Email já está em uso' : 'Email disponível',
        },
        meta: {
          timestamp: new Date(),
          requestId: req.headers['x-request-id'] || `check_${Date.now()}`,
        },
      });
    } catch (error) {
      RegistrationController.logger.error('Check email availability error', {
        error: error.message,
        email: req.params.email,
      });

      res.status(500).json({
        success: false,
        error: {
          type: 'INTERNAL_ERROR',
          message: 'Erro interno do servidor',
          code: 'CHECK_500',
        },
      });
    }
  }

  /**
   * Get registration statistics (admin only)
   * GET /auth/registration/stats
   */
  async getRegistrationStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.registrationService.getRegistrationStats();

      res.status(200).json({
        success: true,
        data: stats,
        meta: {
          timestamp: new Date(),
          requestId: req.headers['x-request-id'] || `stats_${Date.now()}`,
        },
      });
    } catch (error) {
      RegistrationController.logger.error('Get registration stats error', {
        error: error.message,
      });

      res.status(500).json({
        success: false,
        error: {
          type: 'INTERNAL_ERROR',
          message: 'Erro interno do servidor',
          code: 'STATS_500',
        },
      });
    }
  }

  /**
   * Health check for registration service
   * GET /auth/registration/health
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      const config = RegistrationService.getConfig();

      res.status(200).json({
        success: true,
        data: {
          status: 'healthy',
          service: 'registration',
          configuration: {
            requireEmailVerification: config.requireEmailVerification,
            defaultLanguage: config.defaultLanguage,
            autoActivateUsers: config.autoActivateUsers,
          },
          timestamp: new Date(),
        },
      });
    } catch (error) {
      res.status(503).json({
        success: false,
        error: {
          type: 'SERVICE_UNAVAILABLE',
          message: 'Serviço de registro indisponível',
          code: 'HEALTH_503',
        },
      });
    }
  }
}

/**
 * Create registration controller instance
 */
export const createRegistrationController = (
  databaseService: DatabaseService
): RegistrationController => {
  return new RegistrationController(databaseService);
};
