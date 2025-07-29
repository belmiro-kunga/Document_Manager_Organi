// Configuration tests for Authentication Service
// Testes de configuração para o Serviço de Autenticação
import { config } from '../src/config/environment';

describe('Environment Configuration', () => {
  describe('JWT Configuration', () => {
    it('should have JWT configuration', () => {
      const jwtConfig = config.getJwtConfig();
      
      expect(jwtConfig).toHaveProperty('secret');
      expect(jwtConfig).toHaveProperty('expiresIn');
      expect(jwtConfig).toHaveProperty('refreshExpiresIn');
      expect(jwtConfig).toHaveProperty('issuer');
      expect(jwtConfig).toHaveProperty('audience');
    });

    it('should have default values for JWT configuration', () => {
      const jwtConfig = config.getJwtConfig();
      
      expect(jwtConfig.expiresIn).toBe('1h');
      expect(jwtConfig.refreshExpiresIn).toBe('7d');
      expect(jwtConfig.issuer).toBe('adms-auth-service');
      expect(jwtConfig.audience).toBe('adms-users');
    });
  });

  describe('Password Configuration', () => {
    it('should have password configuration', () => {
      const passwordConfig = config.getPasswordConfig();
      
      expect(passwordConfig).toHaveProperty('saltRounds');
      expect(passwordConfig).toHaveProperty('minLength');
      expect(passwordConfig).toHaveProperty('maxLength');
      expect(passwordConfig).toHaveProperty('requireUppercase');
      expect(passwordConfig).toHaveProperty('requireLowercase');
      expect(passwordConfig).toHaveProperty('requireNumbers');
      expect(passwordConfig).toHaveProperty('requireSpecialChars');
    });

    it('should have default password requirements', () => {
      const passwordConfig = config.getPasswordConfig();
      
      expect(passwordConfig.saltRounds).toBe(12);
      expect(passwordConfig.minLength).toBe(8);
      expect(passwordConfig.maxLength).toBe(128);
    });
  });

  describe('Session Configuration', () => {
    it('should have session configuration', () => {
      const sessionConfig = config.getSessionConfig();
      
      expect(sessionConfig).toHaveProperty('secret');
      expect(sessionConfig).toHaveProperty('maxAge');
      expect(sessionConfig).toHaveProperty('secure');
      expect(sessionConfig).toHaveProperty('httpOnly');
      expect(sessionConfig).toHaveProperty('sameSite');
      expect(sessionConfig).toHaveProperty('name');
    });

    it('should have default session settings', () => {
      const sessionConfig = config.getSessionConfig();
      
      expect(sessionConfig.maxAge).toBe(86400000); // 24 hours
      expect(sessionConfig.httpOnly).toBe(true);
      expect(sessionConfig.sameSite).toBe('strict');
      expect(sessionConfig.name).toBe('adms.sid');
    });
  });

  describe('Rate Limit Configuration', () => {
    it('should have rate limit configuration', () => {
      const rateLimitConfig = config.getRateLimitConfig();
      
      expect(rateLimitConfig).toHaveProperty('windowMs');
      expect(rateLimitConfig).toHaveProperty('max');
      expect(rateLimitConfig).toHaveProperty('skipSuccessfulRequests');
      expect(rateLimitConfig).toHaveProperty('skipFailedRequests');
      expect(rateLimitConfig).toHaveProperty('standardHeaders');
      expect(rateLimitConfig).toHaveProperty('legacyHeaders');
    });

    it('should have default rate limit settings', () => {
      const rateLimitConfig = config.getRateLimitConfig();
      
      expect(rateLimitConfig.windowMs).toBe(900000); // 15 minutes
      expect(rateLimitConfig.max).toBe(100);
      expect(rateLimitConfig.skipFailedRequests).toBe(false);
      expect(rateLimitConfig.standardHeaders).toBe(true);
      expect(rateLimitConfig.legacyHeaders).toBe(false);
    });
  });

  describe('Email Configuration', () => {
    it('should have email configuration', () => {
      const emailConfig = config.getEmailConfig();
      
      expect(emailConfig).toHaveProperty('host');
      expect(emailConfig).toHaveProperty('port');
      expect(emailConfig).toHaveProperty('secure');
      expect(emailConfig).toHaveProperty('auth');
      expect(emailConfig).toHaveProperty('from');
      expect(emailConfig).toHaveProperty('templates');
    });

    it('should have default email settings', () => {
      const emailConfig = config.getEmailConfig();
      
      expect(emailConfig.port).toBe(587);
      expect(emailConfig.from).toBe('noreply@adms.ao');
      expect(emailConfig.templates.welcome).toBe('welcome');
      expect(emailConfig.templates.resetPassword).toBe('reset-password');
      expect(emailConfig.templates.verifyEmail).toBe('verify-email');
    });
  });

  describe('OAuth Configuration', () => {
    it('should have OAuth configuration', () => {
      const oauthConfig = config.getOAuthConfig();
      
      expect(oauthConfig).toHaveProperty('google');
      expect(oauthConfig).toHaveProperty('microsoft');
    });

    it('should have Google OAuth configuration', () => {
      const oauthConfig = config.getOAuthConfig();
      
      expect(oauthConfig.google).toHaveProperty('clientId');
      expect(oauthConfig.google).toHaveProperty('clientSecret');
      expect(oauthConfig.google).toHaveProperty('redirectUri');
      expect(oauthConfig.google).toHaveProperty('enabled');
    });

    it('should have Microsoft OAuth configuration', () => {
      const oauthConfig = config.getOAuthConfig();
      
      expect(oauthConfig.microsoft).toHaveProperty('clientId');
      expect(oauthConfig.microsoft).toHaveProperty('clientSecret');
      expect(oauthConfig.microsoft).toHaveProperty('redirectUri');
      expect(oauthConfig.microsoft).toHaveProperty('enabled');
    });
  });

  describe('Security Configuration', () => {
    it('should have security configuration', () => {
      const securityConfig = config.getSecurityConfig();
      
      expect(securityConfig).toHaveProperty('maxLoginAttempts');
      expect(securityConfig).toHaveProperty('lockoutDuration');
      expect(securityConfig).toHaveProperty('passwordResetExpiry');
      expect(securityConfig).toHaveProperty('emailVerificationExpiry');
      expect(securityConfig).toHaveProperty('twoFactorEnabled');
      expect(securityConfig).toHaveProperty('twoFactorIssuer');
      expect(securityConfig).toHaveProperty('allowedOrigins');
      expect(securityConfig).toHaveProperty('trustedProxies');
      expect(securityConfig).toHaveProperty('encryptionKey');
      expect(securityConfig).toHaveProperty('cookieSecret');
    });

    it('should have default security settings', () => {
      const securityConfig = config.getSecurityConfig();
      
      expect(securityConfig.maxLoginAttempts).toBe(5);
      expect(securityConfig.lockoutDuration).toBe(900000); // 15 minutes
      expect(securityConfig.passwordResetExpiry).toBe(3600000); // 1 hour
      expect(securityConfig.emailVerificationExpiry).toBe(86400000); // 24 hours
      expect(securityConfig.twoFactorIssuer).toBe('Advanced DMS');
      expect(securityConfig.allowedOrigins).toEqual(['http://localhost:3000']);
    });
  });

  describe('Audit Configuration', () => {
    it('should have audit configuration', () => {
      const auditConfig = config.getAuditConfig();
      
      expect(auditConfig).toHaveProperty('enabled');
      expect(auditConfig).toHaveProperty('logLevel');
      expect(auditConfig).toHaveProperty('retentionDays');
      expect(auditConfig).toHaveProperty('sensitiveFields');
    });

    it('should have default audit settings', () => {
      const auditConfig = config.getAuditConfig();
      
      expect(auditConfig.enabled).toBe(true);
      expect(auditConfig.logLevel).toBe('info');
      expect(auditConfig.retentionDays).toBe(90);
      expect(auditConfig.sensitiveFields).toContain('password');
      expect(auditConfig.sensitiveFields).toContain('token');
      expect(auditConfig.sensitiveFields).toContain('secret');
    });
  });

  describe('Feature Flags', () => {
    it('should have feature flags configuration', () => {
      const featureFlags = config.getFeatureFlags();
      
      expect(featureFlags).toHaveProperty('registration');
      expect(featureFlags).toHaveProperty('emailVerification');
      expect(featureFlags).toHaveProperty('passwordReset');
      expect(featureFlags).toHaveProperty('socialLogin');
      expect(featureFlags).toHaveProperty('twoFactor');
      expect(featureFlags).toHaveProperty('adminPanel');
      expect(featureFlags).toHaveProperty('apiKeys');
      expect(featureFlags).toHaveProperty('webhooks');
    });

    it('should have default feature flag values', () => {
      const featureFlags = config.getFeatureFlags();
      
      expect(featureFlags.registration).toBe(true);
      expect(featureFlags.passwordReset).toBe(true);
    });
  });

  describe('Configuration Validation', () => {
    it('should validate configuration', () => {
      const validation = config.validateAuthConfig();
      
      expect(validation).toHaveProperty('isValid');
      expect(validation).toHaveProperty('errors');
      expect(Array.isArray(validation.errors)).toBe(true);
    });
  });

  describe('Environment Methods', () => {
    it('should have environment detection methods', () => {
      expect(typeof config.isDevelopment).toBe('function');
      expect(typeof config.isProduction).toBe('function');
      expect(typeof config.isTest).toBe('function');
    });

    it('should return environment name', () => {
      const environment = config.getEnvironment();
      expect(typeof environment).toBe('string');
      expect(['development', 'production', 'test', 'staging']).toContain(environment);
    });
  });
});