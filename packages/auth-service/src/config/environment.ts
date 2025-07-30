// Environment configuration for Authentication Service
// Configuração de ambiente para o Serviço de Autenticação

// Base environment configuration class
class AuthEnvironmentConfig {
  /**
   * Get environment variable
   */
  public get(key: string): string | undefined {
    return process.env[key];
  }

  /**
   * Get environment name
   */
  public getEnvironment(): string {
    return process.env.NODE_ENV || 'development';
  }

  /**
   * Check if development environment
   */
  public isDevelopment(): boolean {
    return this.getEnvironment() === 'development';
  }

  /**
   * Check if production environment
   */
  public isProduction(): boolean {
    return this.getEnvironment() === 'production';
  }

  /**
   * Check if test environment
   */
  public isTest(): boolean {
    return this.getEnvironment() === 'test';
  }

  /**
   * Get database URL
   */
  public getDatabaseUrl(): string {
    return this.get('DATABASE_URL') || 
           `postgresql://${this.get('DATABASE_USER')}:${this.get('DATABASE_PASSWORD')}@${this.get('DATABASE_HOST')}:${this.get('DATABASE_PORT')}/${this.get('DATABASE_NAME')}`;
  }

  /**
   * Get Redis URL
   */
  public getRedisUrl(): string {
    return this.get('REDIS_URL') || 
           `redis://${this.get('REDIS_HOST')}:${this.get('REDIS_PORT')}/${this.get('REDIS_DB') || '0'}`;
  }
  /**
   * Get JWT configuration
   */
  public getJwtConfig() {
    return {
      secret: this.get('JWT_SECRET'),
      expiresIn: this.get('JWT_EXPIRES_IN') || '1h',
      refreshExpiresIn: this.get('JWT_REFRESH_EXPIRES_IN') || '7d',
      issuer: this.get('JWT_ISSUER') || 'adms-auth-service',
      audience: this.get('JWT_AUDIENCE') || 'adms-users'
    };
  }

  /**
   * Get password hashing configuration
   */
  public getPasswordConfig() {
    return {
      saltRounds: parseInt(this.get('BCRYPT_ROUNDS') || '12'),
      minLength: parseInt(this.get('PASSWORD_MIN_LENGTH') || '8'),
      maxLength: parseInt(this.get('PASSWORD_MAX_LENGTH') || '128'),
      requireUppercase: this.get('PASSWORD_REQUIRE_UPPERCASE') === 'true',
      requireLowercase: this.get('PASSWORD_REQUIRE_LOWERCASE') === 'true',
      requireNumbers: this.get('PASSWORD_REQUIRE_NUMBERS') === 'true',
      requireSpecialChars: this.get('PASSWORD_REQUIRE_SPECIAL') === 'true'
    };
  }

  /**
   * Get session configuration
   */
  public getSessionConfig() {
    return {
      secret: this.get('SESSION_SECRET'),
      maxAge: parseInt(this.get('SESSION_MAX_AGE') || '86400000'), // 24 hours
      secure: this.get('SESSION_SECURE') === 'true',
      httpOnly: true,
      sameSite: 'strict' as const,
      name: this.get('SESSION_NAME') || 'adms.sid'
    };
  }

  /**
   * Get rate limiting configuration
   */
  public getRateLimitConfig() {
    return {
      windowMs: parseInt(this.get('RATE_LIMIT_WINDOW') || '900000'), // 15 minutes
      max: parseInt(this.get('RATE_LIMIT_MAX') || '100'),
      skipSuccessfulRequests: this.get('RATE_LIMIT_SKIP_SUCCESS') === 'true',
      skipFailedRequests: false,
      standardHeaders: true,
      legacyHeaders: false
    };
  }

  /**
   * Get email configuration
   */
  public getEmailConfig() {
    return {
      host: this.get('SMTP_HOST'),
      port: parseInt(this.get('SMTP_PORT') || '587'),
      secure: this.get('SMTP_SECURE') === 'true',
      auth: {
        user: this.get('SMTP_USER'),
        pass: this.get('SMTP_PASSWORD')
      },
      from: this.get('SMTP_FROM') || 'noreply@adms.ao',
      templates: {
        welcome: this.get('EMAIL_TEMPLATE_WELCOME') || 'welcome',
        resetPassword: this.get('EMAIL_TEMPLATE_RESET') || 'reset-password',
        verifyEmail: this.get('EMAIL_TEMPLATE_VERIFY') || 'verify-email'
      }
    };
  }

  /**
   * Get OAuth configuration
   */
  public getOAuthConfig() {
    return {
      google: {
        clientId: this.get('GOOGLE_CLIENT_ID'),
        clientSecret: this.get('GOOGLE_CLIENT_SECRET'),
        redirectUri: this.get('GOOGLE_REDIRECT_URI'),
        enabled: this.get('GOOGLE_OAUTH_ENABLED') === 'true'
      },
      microsoft: {
        clientId: this.get('MICROSOFT_CLIENT_ID'),
        clientSecret: this.get('MICROSOFT_CLIENT_SECRET'),
        redirectUri: this.get('MICROSOFT_REDIRECT_URI'),
        enabled: this.get('MICROSOFT_OAUTH_ENABLED') === 'true'
      }
    };
  }

  /**
   * Get security configuration
   */
  public getSecurityConfig() {
    return {
      maxLoginAttempts: parseInt(this.get('MAX_LOGIN_ATTEMPTS') || '5'),
      lockoutDuration: parseInt(this.get('LOCKOUT_DURATION') || '900000'), // 15 minutes
      passwordResetExpiry: parseInt(this.get('PASSWORD_RESET_EXPIRY') || '3600000'), // 1 hour
      emailVerificationExpiry: parseInt(this.get('EMAIL_VERIFICATION_EXPIRY') || '86400000'), // 24 hours
      twoFactorEnabled: this.get('TWO_FACTOR_ENABLED') === 'true',
      twoFactorIssuer: this.get('TWO_FACTOR_ISSUER') || 'Advanced DMS',
      allowedOrigins: this.get('CORS_ORIGINS')?.split(',') || ['http://localhost:3000'],
      trustedProxies: this.get('TRUSTED_PROXIES')?.split(',') || [],
      encryptionKey: this.get('ENCRYPTION_KEY'),
      cookieSecret: this.get('COOKIE_SECRET')
    };
  }

  /**
   * Get audit configuration
   */
  public getAuditConfig() {
    return {
      enabled: this.get('AUDIT_ENABLED') !== 'false',
      logLevel: this.get('AUDIT_LOG_LEVEL') || 'info',
      retentionDays: parseInt(this.get('AUDIT_RETENTION_DAYS') || '90'),
      sensitiveFields: this.get('AUDIT_SENSITIVE_FIELDS')?.split(',') || [
        'password', 'token', 'secret', 'key', 'authorization'
      ]
    };
  }

  /**
   * Get feature flags
   */
  public getFeatureFlags() {
    return {
      registration: this.get('FEATURE_REGISTRATION') !== 'false',
      emailVerification: this.get('FEATURE_EMAIL_VERIFICATION') === 'true',
      passwordReset: this.get('FEATURE_PASSWORD_RESET') !== 'false',
      socialLogin: this.get('FEATURE_SOCIAL_LOGIN') === 'true',
      twoFactor: this.get('FEATURE_TWO_FACTOR') === 'true',
      adminPanel: this.get('FEATURE_ADMIN_PANEL') === 'true',
      apiKeys: this.get('FEATURE_API_KEYS') === 'true',
      webhooks: this.get('FEATURE_WEBHOOKS') === 'true'
    };
  }

  /**
   * Validate auth-specific configuration
   */
  public validateAuthConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate JWT secret
    const jwtSecret = this.get('JWT_SECRET');
    if (!jwtSecret || jwtSecret.length < 32) {
      errors.push('JWT_SECRET must be at least 32 characters long');
    }

    // Validate session secret
    const sessionSecret = this.get('SESSION_SECRET');
    if (!sessionSecret || sessionSecret.length < 32) {
      errors.push('SESSION_SECRET must be at least 32 characters long');
    }

    // Validate encryption key
    const encryptionKey = this.get('ENCRYPTION_KEY');
    if (!encryptionKey || encryptionKey.length < 32) {
      errors.push('ENCRYPTION_KEY must be at least 32 characters long');
    }

    // Validate database configuration
    if (!this.get('DATABASE_URL') && !this.get('DATABASE_HOST')) {
      errors.push('DATABASE_URL or DATABASE_HOST must be provided');
    }

    // Validate Redis configuration
    if (!this.get('REDIS_URL') && !this.get('REDIS_HOST')) {
      errors.push('REDIS_URL or REDIS_HOST must be provided');
    }

    // Validate email configuration if features are enabled
    const features = this.getFeatureFlags();
    if (features.emailVerification || features.passwordReset) {
      const emailConfig = this.getEmailConfig();
      if (!emailConfig.host || !emailConfig.auth.user) {
        errors.push('SMTP configuration required for email features');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Create and export singleton instance
export const config = new AuthEnvironmentConfig();

// Validate configuration on startup (only in non-test environments)
if (process.env.NODE_ENV !== 'test') {
  const validation = config.validateAuthConfig();
  if (!validation.isValid) {
    console.error('❌ Auth service configuration validation failed:');
    validation.errors.forEach(error => console.error(`  - ${error}`));
    process.exit(1);
  }
  console.log('✅ Auth service configuration validated successfully');
}