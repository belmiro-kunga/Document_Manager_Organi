// Environment setup for tests
// Configuração de ambiente para testes
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.HOST = '0.0.0.0';

// Database configuration
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/adms_auth_test';
process.env.DATABASE_HOST = 'localhost';
process.env.DATABASE_PORT = '5432';
process.env.DATABASE_NAME = 'adms_auth_test';
process.env.DATABASE_USER = 'test';
process.env.DATABASE_PASSWORD = 'test';
process.env.DATABASE_SSL = 'false';
process.env.DATABASE_POOL_MAX = '5';
process.env.DATABASE_POOL_MIN = '1';

// Redis configuration
process.env.REDIS_URL = 'redis://localhost:6379/1';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.REDIS_DB = '1';
process.env.REDIS_KEY_PREFIX = 'adms:auth:test:';

// JWT configuration
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes-only-must-be-at-least-32-chars';
process.env.JWT_EXPIRES_IN = '1h';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.JWT_ISSUER = 'adms-auth-service-test';
process.env.JWT_AUDIENCE = 'adms-users-test';

// Session configuration
process.env.SESSION_SECRET = 'test-session-secret-key-for-testing-purposes-only-must-be-at-least-32-chars';
process.env.SESSION_MAX_AGE = '86400000';
process.env.SESSION_SECURE = 'false';
process.env.SESSION_NAME = 'adms.test.sid';

// Security configuration
process.env.ENCRYPTION_KEY = 'test-encryption-key-for-testing-purposes-only-must-be-at-least-32-chars';
process.env.COOKIE_SECRET = 'test-cookie-secret-key-for-testing-purposes-only-must-be-at-least-32-chars';
process.env.MAX_LOGIN_ATTEMPTS = '5';
process.env.LOCKOUT_DURATION = '900000';
process.env.PASSWORD_RESET_EXPIRY = '3600000';
process.env.EMAIL_VERIFICATION_EXPIRY = '86400000';

// Password configuration
process.env.BCRYPT_ROUNDS = '10';
process.env.PASSWORD_MIN_LENGTH = '8';
process.env.PASSWORD_MAX_LENGTH = '128';
process.env.PASSWORD_REQUIRE_UPPERCASE = 'true';
process.env.PASSWORD_REQUIRE_LOWERCASE = 'true';
process.env.PASSWORD_REQUIRE_NUMBERS = 'true';
process.env.PASSWORD_REQUIRE_SPECIAL = 'true';

// Rate limiting
process.env.RATE_LIMIT_WINDOW = '900000';
process.env.RATE_LIMIT_MAX = '100';
process.env.RATE_LIMIT_SKIP_SUCCESS = 'false';

// CORS configuration
process.env.CORS_ORIGINS = 'http://localhost:3000,http://localhost:3001';

// Email configuration (mock)
process.env.SMTP_HOST = 'localhost';
process.env.SMTP_PORT = '587';
process.env.SMTP_SECURE = 'false';
process.env.SMTP_USER = 'test@example.com';
process.env.SMTP_PASSWORD = 'test-password';
process.env.SMTP_FROM = 'noreply@adms.test';

// OAuth configuration (mock)
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
process.env.GOOGLE_REDIRECT_URI = 'http://localhost:3001/api/v1/auth/oauth/google/callback';
process.env.GOOGLE_OAUTH_ENABLED = 'false';

process.env.MICROSOFT_CLIENT_ID = 'test-microsoft-client-id';
process.env.MICROSOFT_CLIENT_SECRET = 'test-microsoft-client-secret';
process.env.MICROSOFT_REDIRECT_URI = 'http://localhost:3001/api/v1/auth/oauth/microsoft/callback';
process.env.MICROSOFT_OAUTH_ENABLED = 'false';

// Feature flags
process.env.FEATURE_REGISTRATION = 'true';
process.env.FEATURE_EMAIL_VERIFICATION = 'false';
process.env.FEATURE_PASSWORD_RESET = 'true';
process.env.FEATURE_SOCIAL_LOGIN = 'false';
process.env.FEATURE_TWO_FACTOR = 'false';
process.env.FEATURE_ADMIN_PANEL = 'false';
process.env.FEATURE_API_KEYS = 'false';
process.env.FEATURE_WEBHOOKS = 'false';

// Two-factor authentication
process.env.TWO_FACTOR_ENABLED = 'false';
process.env.TWO_FACTOR_ISSUER = 'Advanced DMS Test';

// Audit configuration
process.env.AUDIT_ENABLED = 'true';
process.env.AUDIT_LOG_LEVEL = 'info';
process.env.AUDIT_RETENTION_DAYS = '30';
process.env.AUDIT_SENSITIVE_FIELDS = 'password,token,secret,key,authorization';

// Application metadata
process.env.APP_VERSION = '1.0.0-test';
process.env.APP_NAME = 'adms-auth-service-test';