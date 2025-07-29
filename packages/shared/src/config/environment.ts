// Environment configuration utilities
// Utilitários de configuração de ambiente

import * as fs from 'fs';
import * as path from 'path';
import { z } from 'zod';

/**
 * Environment types
 */
export type Environment = 'development' | 'production' | 'test';

/**
 * Configuration schema validation
 */
const ConfigSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  APP_NAME: z.string().default('Advanced DMS'),
  APP_VERSION: z.string().default('1.0.0'),
  APP_PORT: z.coerce.number().default(8000),
  APP_HOST: z.string().default('localhost'),

  // Database
  DATABASE_HOST: z.string().default('localhost'),
  DATABASE_PORT: z.coerce.number().default(5432),
  DATABASE_NAME: z.string().default('adms'),
  DATABASE_USER: z.string().default('adms_user'),
  DATABASE_PASSWORD: z.string().min(1),
  DATABASE_URL: z.string().optional(),
  DATABASE_SSL: z.coerce.boolean().default(false),
  DATABASE_LOGGING: z.coerce.boolean().default(false),

  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_URL: z.string().optional(),
  REDIS_DB: z.coerce.number().default(0),

  // Elasticsearch
  ELASTICSEARCH_HOST: z.string().default('localhost'),
  ELASTICSEARCH_PORT: z.coerce.number().default(9200),
  ELASTICSEARCH_URL: z.string().optional(),
  ELASTICSEARCH_INDEX_PREFIX: z.string().default('adms'),

  // Authentication
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('1h'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_ROUNDS: z.coerce.number().default(12),

  // Storage
  STORAGE_PROVIDER: z.enum(['local', 's3', 'minio']).default('local'),
  LOCAL_STORAGE_PATH: z.string().default('./storage'),
  MAX_FILE_SIZE: z.string().default('100MB'),
  ALLOWED_FILE_TYPES: z.string().default('pdf,doc,docx,txt,jpg,jpeg,png'),

  // AWS S3
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FORMAT: z.enum(['json', 'dev']).default('json'),
  LOG_FILE: z.string().optional(),

  // API
  API_PREFIX: z.string().default('/api/v1'),
  API_RATE_LIMIT: z.coerce.number().default(100),
  API_RATE_WINDOW: z.coerce.number().default(15),

  // CORS
  CORS_ORIGIN: z.string().default('*'),
  CORS_CREDENTIALS: z.coerce.boolean().default(true),

  // Internationalization
  DEFAULT_LANGUAGE: z.string().default('pt-PT'),
  SUPPORTED_LANGUAGES: z.string().default('pt-PT,en-US,fr-FR'),
  TIMEZONE: z.string().default('Africa/Luanda'),

  // Security
  SECURITY_HEADERS: z.coerce.boolean().default(true),
  RATE_LIMITING: z.coerce.boolean().default(true),
  CSRF_PROTECTION: z.coerce.boolean().default(true),
  HELMET_ENABLED: z.coerce.boolean().default(true),

  // Development
  HOT_RELOAD: z.coerce.boolean().default(false),
  DEBUG_MODE: z.coerce.boolean().default(false),
  MOCK_EXTERNAL_APIS: z.coerce.boolean().default(false),
});

export type Config = z.infer<typeof ConfigSchema>;

/**
 * Environment configuration manager
 */
export class EnvironmentConfig {
  private static instance: EnvironmentConfig;
  private config: Config;
  private environment: Environment;

  private constructor() {
    this.environment = this.detectEnvironment();
    this.config = this.loadConfiguration();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): EnvironmentConfig {
    if (!EnvironmentConfig.instance) {
      EnvironmentConfig.instance = new EnvironmentConfig();
    }
    return EnvironmentConfig.instance;
  }

  /**
   * Get current environment
   */
  public getEnvironment(): Environment {
    return this.environment;
  }

  /**
   * Get configuration value
   */
  public get<K extends keyof Config>(key: K): Config[K] {
    return this.config[key];
  }

  /**
   * Get all configuration
   */
  public getAll(): Config {
    return { ...this.config };
  }

  /**
   * Check if running in development
   */
  public isDevelopment(): boolean {
    return this.environment === 'development';
  }

  /**
   * Check if running in production
   */
  public isProduction(): boolean {
    return this.environment === 'production';
  }

  /**
   * Check if running in test
   */
  public isTest(): boolean {
    return this.environment === 'test';
  }

  /**
   * Get database URL
   */
  public getDatabaseUrl(): string {
    if (this.config.DATABASE_URL) {
      return this.config.DATABASE_URL;
    }

    const { DATABASE_USER, DATABASE_PASSWORD, DATABASE_HOST, DATABASE_PORT, DATABASE_NAME } = this.config;
    return `postgresql://${DATABASE_USER}:${DATABASE_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}`;
  }

  /**
   * Get Redis URL
   */
  public getRedisUrl(): string {
    if (this.config.REDIS_URL) {
      return this.config.REDIS_URL;
    }

    const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_DB } = this.config;
    const auth = REDIS_PASSWORD ? `:${REDIS_PASSWORD}@` : '';
    return `redis://${auth}${REDIS_HOST}:${REDIS_PORT}/${REDIS_DB}`;
  }

  /**
   * Get Elasticsearch URL
   */
  public getElasticsearchUrl(): string {
    if (this.config.ELASTICSEARCH_URL) {
      return this.config.ELASTICSEARCH_URL;
    }

    const { ELASTICSEARCH_HOST, ELASTICSEARCH_PORT } = this.config;
    return `http://${ELASTICSEARCH_HOST}:${ELASTICSEARCH_PORT}`;
  }

  /**
   * Get supported languages as array
   */
  public getSupportedLanguages(): string[] {
    return this.config.SUPPORTED_LANGUAGES.split(',').map(lang => lang.trim());
  }

  /**
   * Get allowed file types as array
   */
  public getAllowedFileTypes(): string[] {
    return this.config.ALLOWED_FILE_TYPES.split(',').map(type => type.trim());
  }

  /**
   * Get CORS origins as array
   */
  public getCorsOrigins(): string[] {
    return this.config.CORS_ORIGIN.split(',').map(origin => origin.trim());
  }

  /**
   * Validate configuration
   */
  public validate(): { isValid: boolean; errors: string[] } {
    try {
      ConfigSchema.parse(process.env);
      return { isValid: true, errors: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
        return { isValid: false, errors };
      }
      return { isValid: false, errors: ['Unknown validation error'] };
    }
  }

  /**
   * Reload configuration
   */
  public reload(): void {
    this.environment = this.detectEnvironment();
    this.config = this.loadConfiguration();
  }

  /**
   * Detect current environment
   */
  private detectEnvironment(): Environment {
    const env = process.env.NODE_ENV as Environment;
    if (['development', 'production', 'test'].includes(env)) {
      return env;
    }
    return 'development';
  }

  /**
   * Load configuration from environment and files
   */
  private loadConfiguration(): Config {
    // Load environment-specific file
    this.loadEnvironmentFile();

    // Parse and validate configuration
    const result = ConfigSchema.safeParse(process.env);
    
    if (!result.success) {
      const errors = result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
    }

    return result.data;
  }

  /**
   * Load environment file
   */
  private loadEnvironmentFile(): void {
    const configDir = path.resolve(process.cwd(), 'config');
    const envFile = path.join(configDir, `${this.environment}.env`);

    if (fs.existsSync(envFile)) {
      const content = fs.readFileSync(envFile, 'utf8');
      const lines = content.split('\n');

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=');
          if (key && valueParts.length > 0) {
            const value = valueParts.join('=');
            // Only set if not already defined
            if (!process.env[key]) {
              process.env[key] = value;
            }
          }
        }
      }
    }
  }
}

/**
 * Global configuration instance
 */
export const config = EnvironmentConfig.getInstance();

/**
 * Configuration validation utility
 */
export function validateEnvironment(): void {
  const validation = config.validate();
  if (!validation.isValid) {
    console.error('❌ Environment configuration validation failed:');
    validation.errors.forEach(error => console.error(`  - ${error}`));
    process.exit(1);
  }
  console.log('✅ Environment configuration validated successfully');
}

/**
 * Environment setup utility
 */
export function setupEnvironment(): Config {
  validateEnvironment();
  
  console.log(`🚀 Starting Advanced DMS in ${config.getEnvironment()} mode`);
  console.log(`📊 Configuration loaded for ${config.get('APP_NAME')} v${config.get('APP_VERSION')}`);
  
  return config.getAll();
}