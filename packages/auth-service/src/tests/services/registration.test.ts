// Registration service tests for Authentication Service
// Testes do serviço de registro para o Serviço de Autenticação

import { RegistrationService, RegistrationRequest } from '../../services/registration';
import { UserRepository } from '../../repositories/user-repository';
import { User } from '../../models/user';
import { PasswordUtils } from '../../utils/password';
import { JWTUtils, TokenType } from '../../utils/jwt';

// Mock dependencies
jest.mock('../../repositories/user-repository');
jest.mock('../../utils/password');
jest.mock('../../utils/jwt');

describe('RegistrationService', () => {
  let registrationService: RegistrationService;
  let mockUserRepository: jest.Mocked<UserRepository>;

  const mockUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    firstName: 'João',
    lastName: 'Silva',
    email: 'joao.silva@example.com',
    password: 'hashed-password',
    role: 'user',
    language: 'pt',
    timezone: 'Africa/Luanda',
    isActive: true,
    isEmailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const validRegistrationRequest: RegistrationRequest = {
    firstName: 'João',
    lastName: 'Silva',
    email: 'joao.silva@example.com',
    password: 'StrongPassword123!',
    confirmPassword: 'StrongPassword123!',
    acceptTerms: true,
    language: 'pt',
    timezone: 'Africa/Luanda',
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock repository
    mockUserRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      search: jest.fn(),
      getStatistics: jest.fn(),
    } as any;

    // Create service instance
    registrationService = new RegistrationService(mockUserRepository);

    // Reset configuration
    RegistrationService.configure({});

    // Setup default mocks
    (PasswordUtils.validatePassword as jest.Mock).mockReturnValue({
      isValid: true,
      strength: 'strong',
      score: 85,
      errors: [],
      suggestions: [],
    });

    (PasswordUtils.hash as jest.Mock).mockResolvedValue('hashed-password');

    (JWTUtils.generateSpecialToken as jest.Mock).mockReturnValue('mock-verification-token');
  });

  describe('registerUser', () => {
    it('should register user successfully', async () => {
      // Setup mocks
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(mockUser);

      const result = await registrationService.registerUser(validRegistrationRequest);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.user.id).toBe(mockUser.id);
        expect(result.user.email).toBe(mockUser.email);
        expect(result.user.firstName).toBe(mockUser.firstName);
        expect(result.user.lastName).toBe(mockUser.lastName);
        expect(result.message).toBe('Usuário registrado com sucesso');
      }

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(validRegistrationRequest.email);
      expect(PasswordUtils.validatePassword).toHaveBeenCalledWith(
        validRegistrationRequest.password
      );
      expect(PasswordUtils.hash).toHaveBeenCalledWith(validRegistrationRequest.password);
      expect(mockUserRepository.create).toHaveBeenCalled();
    });

    it('should return error for existing email', async () => {
      // Setup mocks
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      const result = await registrationService.registerUser(validRegistrationRequest);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('EMAIL_EXISTS');
        expect(result.message).toBe('Este email já está registrado');
        expect(result.code).toBe('REG_002');
      }

      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('should return validation errors for invalid input', async () => {
      const invalidRequest: RegistrationRequest = {
        firstName: '',
        lastName: '',
        email: 'invalid-email',
        password: 'weak',
        confirmPassword: 'different',
        acceptTerms: false,
      };

      const result = await registrationService.registerUser(invalidRequest);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('VALIDATION_ERROR');
        expect(result.validationErrors).toBeDefined();
        expect(result.validationErrors!.length).toBeGreaterThan(0);
      }

      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('should return error for weak password', async () => {
      // Setup mocks
      mockUserRepository.findByEmail.mockResolvedValue(null);
      (PasswordUtils.validatePassword as jest.Mock).mockReturnValue({
        isValid: false,
        strength: 'weak',
        score: 25,
        errors: ['Senha muito fraca'],
        suggestions: ['Use mais caracteres'],
      });

      const result = await registrationService.registerUser(validRegistrationRequest);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('WEAK_PASSWORD');
        expect(result.code).toBe('REG_003');
        expect(result.details?.errors).toContain('Senha muito fraca');
      }

      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('should generate email verification token when required', async () => {
      // Configure to require email verification
      RegistrationService.configure({ requireEmailVerification: true });

      // Setup mocks
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue({
        ...mockUser,
        isEmailVerified: false,
      });

      const result = await registrationService.registerUser(validRegistrationRequest);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.emailVerificationToken).toBe('mock-verification-token');
        expect(result.message).toContain('Verifique seu email');
        expect(result.nextSteps).toContain('Verificar email');
      }

      expect(JWTUtils.generateSpecialToken).toHaveBeenCalledWith(
        {
          userId: mockUser.id,
          email: mockUser.email,
          purpose: 'email-verification',
        },
        TokenType.EMAIL_VERIFICATION,
        '24h'
      );
    });

    it('should handle repository errors gracefully', async () => {
      // Setup mocks
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockRejectedValue(new Error('Database error'));

      const result = await registrationService.registerUser(validRegistrationRequest);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('REGISTRATION_FAILED');
        expect(result.code).toBe('REG_004');
      }
    });

    it('should validate password confirmation mismatch', async () => {
      const requestWithMismatch: RegistrationRequest = {
        ...validRegistrationRequest,
        confirmPassword: 'DifferentPassword123!',
      };

      const result = await registrationService.registerUser(requestWithMismatch);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.validationErrors?.some(e => e.code === 'PASSWORD_MISMATCH')).toBe(true);
      }
    });

    it('should validate terms acceptance when required', async () => {
      const requestWithoutTerms: RegistrationRequest = {
        ...validRegistrationRequest,
        acceptTerms: false,
      };

      const result = await registrationService.registerUser(requestWithoutTerms);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.validationErrors?.some(e => e.code === 'TERMS_NOT_ACCEPTED')).toBe(true);
      }
    });

    it('should validate email format', async () => {
      const requestWithInvalidEmail: RegistrationRequest = {
        ...validRegistrationRequest,
        email: 'invalid-email-format',
      };

      const result = await registrationService.registerUser(requestWithInvalidEmail);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.validationErrors?.some(e => e.code === 'INVALID_EMAIL_FORMAT')).toBe(true);
      }
    });

    it('should validate minimum name lengths', async () => {
      const requestWithShortNames: RegistrationRequest = {
        ...validRegistrationRequest,
        firstName: 'A',
        lastName: 'B',
      };

      const result = await registrationService.registerUser(requestWithShortNames);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.validationErrors?.some(e => e.field === 'firstName' && e.code === 'MIN_LENGTH')
        ).toBe(true);
        expect(
          result.validationErrors?.some(e => e.field === 'lastName' && e.code === 'MIN_LENGTH')
        ).toBe(true);
      }
    });

    it('should validate language parameter', async () => {
      const requestWithInvalidLanguage: RegistrationRequest = {
        ...validRegistrationRequest,
        language: 'invalid' as any,
      };

      const result = await registrationService.registerUser(requestWithInvalidLanguage);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.validationErrors?.some(e => e.code === 'INVALID_LANGUAGE')).toBe(true);
      }
    });
  });

  describe('verifyEmail', () => {
    const verificationRequest = {
      token: 'valid-token',
      email: 'joao.silva@example.com',
    };

    it('should verify email successfully', async () => {
      // Setup mocks
      (JWTUtils.validateToken as jest.Mock).mockReturnValue({
        isValid: true,
        payload: {
          userId: mockUser.id,
          email: mockUser.email,
          tokenType: TokenType.EMAIL_VERIFICATION,
        },
      });

      mockUserRepository.findById.mockResolvedValue({
        ...mockUser,
        isEmailVerified: false,
      });

      mockUserRepository.update.mockResolvedValue({
        ...mockUser,
        isEmailVerified: true,
      });

      const result = await registrationService.verifyEmail(verificationRequest);

      expect(result.success).toBe(true);
      expect(result.message).toContain('verificado com sucesso');
      expect(result.user?.isEmailVerified).toBe(true);

      expect(mockUserRepository.update).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({
          isEmailVerified: true,
          isActive: true,
        }),
        'system'
      );
    });

    it('should reject invalid token', async () => {
      // Setup mocks
      (JWTUtils.validateToken as jest.Mock).mockReturnValue({
        isValid: false,
        error: 'Invalid token',
      });

      const result = await registrationService.verifyEmail(verificationRequest);

      expect(result.success).toBe(false);
      expect(result.message).toContain('inválido');

      expect(mockUserRepository.findById).not.toHaveBeenCalled();
      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });

    it('should reject expired token', async () => {
      // Setup mocks
      (JWTUtils.validateToken as jest.Mock).mockReturnValue({
        isValid: false,
        expired: true,
        error: 'Token expired',
      });

      const result = await registrationService.verifyEmail(verificationRequest);

      expect(result.success).toBe(false);
      expect(result.message).toContain('expirado');
    });

    it('should reject token with mismatched email', async () => {
      // Setup mocks
      (JWTUtils.validateToken as jest.Mock).mockReturnValue({
        isValid: true,
        payload: {
          userId: mockUser.id,
          email: 'different@example.com',
          tokenType: TokenType.EMAIL_VERIFICATION,
        },
      });

      const result = await registrationService.verifyEmail(verificationRequest);

      expect(result.success).toBe(false);
      expect(result.message).toContain('não corresponde');

      expect(mockUserRepository.findById).not.toHaveBeenCalled();
    });

    it('should handle user not found', async () => {
      // Setup mocks
      (JWTUtils.validateToken as jest.Mock).mockReturnValue({
        isValid: true,
        payload: {
          userId: mockUser.id,
          email: mockUser.email,
          tokenType: TokenType.EMAIL_VERIFICATION,
        },
      });

      mockUserRepository.findById.mockResolvedValue(null);

      const result = await registrationService.verifyEmail(verificationRequest);

      expect(result.success).toBe(false);
      expect(result.message).toContain('não encontrado');
    });

    it('should handle already verified email', async () => {
      // Setup mocks
      (JWTUtils.validateToken as jest.Mock).mockReturnValue({
        isValid: true,
        payload: {
          userId: mockUser.id,
          email: mockUser.email,
          tokenType: TokenType.EMAIL_VERIFICATION,
        },
      });

      mockUserRepository.findById.mockResolvedValue({
        ...mockUser,
        isEmailVerified: true,
      });

      const result = await registrationService.verifyEmail(verificationRequest);

      expect(result.success).toBe(true);
      expect(result.message).toContain('já foi verificado');

      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('resendEmailVerification', () => {
    it('should resend verification for valid unverified email', async () => {
      // Setup mocks
      mockUserRepository.findByEmail.mockResolvedValue({
        ...mockUser,
        isEmailVerified: false,
      });

      const result = await registrationService.resendEmailVerification(mockUser.email);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Novo token');

      expect(JWTUtils.generateSpecialToken).toHaveBeenCalledWith(
        {
          userId: mockUser.id,
          email: mockUser.email,
          purpose: 'email-verification-resend',
        },
        TokenType.EMAIL_VERIFICATION,
        '24h'
      );
    });

    it('should not reveal if email does not exist', async () => {
      // Setup mocks
      mockUserRepository.findByEmail.mockResolvedValue(null);

      const result = await registrationService.resendEmailVerification('nonexistent@example.com');

      expect(result.success).toBe(true);
      expect(result.message).toContain('Se o email existir');

      expect(JWTUtils.generateSpecialToken).not.toHaveBeenCalled();
    });

    it('should reject resend for already verified email', async () => {
      // Setup mocks
      mockUserRepository.findByEmail.mockResolvedValue({
        ...mockUser,
        isEmailVerified: true,
      });

      const result = await registrationService.resendEmailVerification(mockUser.email);

      expect(result.success).toBe(false);
      expect(result.message).toContain('já foi verificado');

      expect(JWTUtils.generateSpecialToken).not.toHaveBeenCalled();
    });

    it('should handle repository errors gracefully', async () => {
      // Setup mocks
      mockUserRepository.findByEmail.mockRejectedValue(new Error('Database error'));

      const result = await registrationService.resendEmailVerification(mockUser.email);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Erro interno');
    });
  });

  describe('configuration', () => {
    it('should update configuration correctly', () => {
      const customConfig = {
        requireEmailVerification: false,
        defaultRole: 'premium-user',
        defaultLanguage: 'en' as const,
        autoActivateUsers: true,
      };

      RegistrationService.configure(customConfig);
      const config = RegistrationService.getConfig();

      expect(config.requireEmailVerification).toBe(false);
      expect(config.defaultRole).toBe('premium-user');
      expect(config.defaultLanguage).toBe('en');
      expect(config.autoActivateUsers).toBe(true);
    });

    it('should merge with default configuration', () => {
      RegistrationService.configure({ defaultRole: 'admin' });
      const config = RegistrationService.getConfig();

      expect(config.defaultRole).toBe('admin');
      expect(config.defaultLanguage).toBe('pt'); // Should keep default
      expect(config.requireEmailVerification).toBeDefined(); // Should keep default
    });
  });

  describe('getRegistrationStats', () => {
    it('should return registration statistics', async () => {
      const stats = await registrationService.getRegistrationStats();

      expect(stats).toBeDefined();
      expect(typeof stats.totalRegistrations).toBe('number');
      expect(typeof stats.verifiedUsers).toBe('number');
      expect(typeof stats.pendingVerification).toBe('number');
      expect(typeof stats.registrationsToday).toBe('number');
      expect(typeof stats.registrationsThisWeek).toBe('number');
      expect(typeof stats.registrationsThisMonth).toBe('number');
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle concurrent registration attempts', async () => {
      // Setup mocks
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(mockUser);

      const promises = Array.from({ length: 5 }, () =>
        registrationService.registerUser({
          ...validRegistrationRequest,
          email: `user${Math.random()}@example.com`,
        })
      );

      const results = await Promise.all(promises);

      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });

    it('should handle special characters in names', async () => {
      const requestWithSpecialChars: RegistrationRequest = {
        ...validRegistrationRequest,
        firstName: 'José María',
        lastName: 'García-López',
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue({
        ...mockUser,
        firstName: 'José María',
        lastName: 'García-López',
      });

      const result = await registrationService.registerUser(requestWithSpecialChars);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.user.firstName).toBe('José María');
        expect(result.user.lastName).toBe('García-López');
      }
    });

    it('should trim whitespace from input fields', async () => {
      const requestWithWhitespace: RegistrationRequest = {
        ...validRegistrationRequest,
        firstName: '  João  ',
        lastName: '  Silva  ',
        email: '  joao.silva@example.com  ',
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(mockUser);

      const result = await registrationService.registerUser(requestWithWhitespace);

      expect(result.success).toBe(true);

      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'João',
          lastName: 'Silva',
          email: 'joao.silva@example.com',
        }),
        'system'
      );
    });

    it('should handle very long input fields', async () => {
      const requestWithLongFields: RegistrationRequest = {
        ...validRegistrationRequest,
        firstName: 'A'.repeat(100),
        lastName: 'B'.repeat(100),
      };

      const result = await registrationService.registerUser(requestWithLongFields);

      // Should still process (validation happens at repository level)
      expect(result).toBeDefined();
    });
  });
});
