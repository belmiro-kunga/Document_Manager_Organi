// Database service for Authentication Service
// Serviço de banco de dados para o Serviço de Autenticação
import { Pool, PoolClient, QueryResult } from 'pg';
import { createLogger } from '@adms/shared';
import { config } from '../config/environment';

const logger = createLogger({ service: 'auth-service-db' });

/**
 * Database service class
 */
export class DatabaseService {
  private static instance: DatabaseService;
  private pool: Pool | null = null;
  private isConnected = false;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * Connect to database
   */
  public async connect(): Promise<void> {
    if (this.isConnected && this.pool) {
      return;
    }

    try {
      const databaseUrl = config.getDatabaseUrl();
      this.pool = new Pool({
        connectionString: databaseUrl,
        ssl: config.get('DATABASE_SSL') === 'true' ? {
          rejectUnauthorized: false
        } : false,
        max: parseInt(config.get('DATABASE_POOL_MAX') || '20'),
        min: parseInt(config.get('DATABASE_POOL_MIN') || '2'),
        idleTimeoutMillis: parseInt(config.get('DATABASE_IDLE_TIMEOUT') || '30000'),
        connectionTimeoutMillis: parseInt(config.get('DATABASE_CONNECTION_TIMEOUT') || '10000'),
        statement_timeout: parseInt(config.get('DATABASE_STATEMENT_TIMEOUT') || '30000'),
        query_timeout: parseInt(config.get('DATABASE_QUERY_TIMEOUT') || '30000'),
      });

      // Test connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();

      this.isConnected = true;
      logger.info('Database connected successfully', {
        host: config.get('DATABASE_HOST'),
        database: config.get('DATABASE_NAME'),
        poolMax: this.pool.options.max,
        poolMin: this.pool.options.min
      });

      // Setup connection event handlers
      this.pool.on('connect', (client) => {
        logger.debug('New database client connected');
      });

      this.pool.on('error', (err, client) => {
        logger.error('Database pool error', { error: err });
      });

      this.pool.on('remove', (client) => {
        logger.debug('Database client removed from pool');
      });

      // Run migrations
      await this.runMigrations();
    } catch (error) {
      logger.error('Failed to connect to database', { error });
      throw error;
    }
  }

  /**
   * Disconnect from database
   */
  public async disconnect(): Promise<void> {
    if (this.pool) {
      try {
        await this.pool.end();
        this.isConnected = false;
        logger.info('Database disconnected successfully');
      } catch (error) {
        logger.error('Error disconnecting from database', { error });
        throw error;
      }
    }
  }

  /**
   * Get database pool
   */
  public getPool(): Pool {
    if (!this.pool || !this.isConnected) {
      throw new Error('Database not connected');
    }
    return this.pool;
  }

  /**
   * Execute query with connection from pool
   */
  public async query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    if (!this.pool) {
      throw new Error('Database not connected');
    }

    const start = Date.now();
    try {
      const result = await this.pool.query<T>(text, params);
      const duration = Date.now() - start;
      
      logger.debug('Database query executed', {
        query: text.substring(0, 100),
        duration,
        rows: result.rowCount
      });

      return result;
    } catch (error) {
      const duration = Date.now() - start;
      logger.error('Database query failed', {
        query: text.substring(0, 100),
        params: params?.map(p => typeof p === 'string' && p.length > 50 ? p.substring(0, 50) + '...' : p),
        duration,
        error
      });
      throw error;
    }
  }

  /**
   * Execute query with transaction
   */
  public async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    if (!this.pool) {
      throw new Error('Database not connected');
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Check database health
   */
  public async healthCheck(): Promise<{ healthy: boolean; latency: number; error?: string }> {
    const start = Date.now();
    try {
      await this.query('SELECT 1');
      const latency = Date.now() - start;
      return { healthy: true, latency };
    } catch (error) {
      const latency = Date.now() - start;
      return { 
        healthy: false, 
        latency, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Run database migrations
   */
  private async runMigrations(): Promise<void> {
    try {
      // Create migrations table if it doesn't exist
      await this.query(`
        CREATE TABLE IF NOT EXISTS migrations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Get list of executed migrations
      const executedMigrations = await this.query<{ name: string }>(
        'SELECT name FROM migrations ORDER BY id'
      );
      const executedNames = new Set(executedMigrations.rows.map(row => row.name));

      // Define migrations in order
      const migrations = [
        {
          name: '001_create_users_table',
          sql: `
            CREATE TABLE IF NOT EXISTS users (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              email VARCHAR(255) NOT NULL UNIQUE,
              username VARCHAR(100) NOT NULL UNIQUE,
              first_name VARCHAR(100) NOT NULL,
              last_name VARCHAR(100) NOT NULL,
              password_hash VARCHAR(255) NOT NULL,
              password_salt VARCHAR(255) NOT NULL,
              role VARCHAR(50) NOT NULL DEFAULT 'user',
              language VARCHAR(10) NOT NULL DEFAULT 'pt',
              department VARCHAR(100),
              position VARCHAR(100),
              phone VARCHAR(20),
              is_active BOOLEAN NOT NULL DEFAULT true,
              email_verified_at TIMESTAMP,
              email_verification_token VARCHAR(255),
              email_verification_expires TIMESTAMP,
              password_reset_token VARCHAR(255),
              password_reset_expires TIMESTAMP,
              last_password_change TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              login_attempts INTEGER NOT NULL DEFAULT 0,
              locked_until TIMESTAMP,
              two_factor_secret VARCHAR(255),
              two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
              last_login_at TIMESTAMP,
              last_login_ip INET,
              current_session_id VARCHAR(255),
              preferences JSONB NOT NULL DEFAULT '{}',
              security_settings JSONB NOT NULL DEFAULT '{}',
              profile JSONB NOT NULL DEFAULT '{}',
              created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              deleted_at TIMESTAMP,
              created_by UUID,
              updated_by UUID
            );

            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
            CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
            CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
            CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
            CREATE INDEX IF NOT EXISTS idx_users_deleted ON users(deleted_at);
            CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);
          `
        },
        {
          name: '002_create_refresh_tokens_table',
          sql: `
            CREATE TABLE IF NOT EXISTS refresh_tokens (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              token_hash VARCHAR(255) NOT NULL UNIQUE,
              expires_at TIMESTAMP NOT NULL,
              created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              last_used_at TIMESTAMP,
              device_info JSONB,
              ip_address INET,
              is_revoked BOOLEAN NOT NULL DEFAULT false,
              revoked_at TIMESTAMP,
              revoked_reason VARCHAR(255)
            );

            CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
            CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
            CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
            CREATE INDEX IF NOT EXISTS idx_refresh_tokens_revoked ON refresh_tokens(is_revoked);
          `
        },
        {
          name: '003_create_oauth_providers_table',
          sql: `
            CREATE TABLE IF NOT EXISTS oauth_providers (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              provider VARCHAR(50) NOT NULL,
              provider_id VARCHAR(255) NOT NULL,
              email VARCHAR(255) NOT NULL,
              name VARCHAR(255) NOT NULL,
              avatar VARCHAR(500),
              access_token TEXT,
              refresh_token TEXT,
              expires_at TIMESTAMP,
              connected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              last_used_at TIMESTAMP,
              is_active BOOLEAN NOT NULL DEFAULT true,
              UNIQUE(provider, provider_id)
            );

            CREATE INDEX IF NOT EXISTS idx_oauth_providers_user_id ON oauth_providers(user_id);
            CREATE INDEX IF NOT EXISTS idx_oauth_providers_provider ON oauth_providers(provider);
            CREATE INDEX IF NOT EXISTS idx_oauth_providers_active ON oauth_providers(is_active);
          `
        },
        {
          name: '004_create_api_keys_table',
          sql: `
            CREATE TABLE IF NOT EXISTS api_keys (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              name VARCHAR(255) NOT NULL,
              key_hash VARCHAR(255) NOT NULL UNIQUE,
              prefix VARCHAR(20) NOT NULL,
              permissions JSONB NOT NULL DEFAULT '[]',
              expires_at TIMESTAMP,
              last_used_at TIMESTAMP,
              created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              is_active BOOLEAN NOT NULL DEFAULT true,
              usage_count INTEGER NOT NULL DEFAULT 0,
              rate_limit_tier VARCHAR(50) NOT NULL DEFAULT 'basic'
            );

            CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
            CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
            CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(prefix);
            CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);
          `
        },
        {
          name: '005_create_login_attempts_table',
          sql: `
            CREATE TABLE IF NOT EXISTS login_attempts (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              user_id UUID REFERENCES users(id) ON DELETE SET NULL,
              email VARCHAR(255) NOT NULL,
              ip_address INET NOT NULL,
              user_agent TEXT,
              success BOOLEAN NOT NULL,
              failure_reason VARCHAR(255),
              timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              location JSONB
            );

            CREATE INDEX IF NOT EXISTS idx_login_attempts_user_id ON login_attempts(user_id);
            CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);
            CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address);
            CREATE INDEX IF NOT EXISTS idx_login_attempts_timestamp ON login_attempts(timestamp);
            CREATE INDEX IF NOT EXISTS idx_login_attempts_success ON login_attempts(success);
          `
        },
        {
          name: '006_create_security_events_table',
          sql: `
            CREATE TABLE IF NOT EXISTS security_events (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              type VARCHAR(100) NOT NULL,
              description TEXT NOT NULL,
              severity VARCHAR(20) NOT NULL DEFAULT 'low',
              ip_address INET,
              user_agent TEXT,
              timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              metadata JSONB,
              resolved BOOLEAN NOT NULL DEFAULT false,
              resolved_at TIMESTAMP,
              resolved_by UUID REFERENCES users(id)
            );

            CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
            CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(type);
            CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
            CREATE INDEX IF NOT EXISTS idx_security_events_timestamp ON security_events(timestamp);
            CREATE INDEX IF NOT EXISTS idx_security_events_resolved ON security_events(resolved);
          `
        },
        {
          name: '007_create_trusted_devices_table',
          sql: `
            CREATE TABLE IF NOT EXISTS trusted_devices (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              name VARCHAR(255) NOT NULL,
              fingerprint VARCHAR(255) NOT NULL,
              device_info JSONB NOT NULL,
              trusted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              last_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              is_active BOOLEAN NOT NULL DEFAULT true,
              UNIQUE(user_id, fingerprint)
            );

            CREATE INDEX IF NOT EXISTS idx_trusted_devices_user_id ON trusted_devices(user_id);
            CREATE INDEX IF NOT EXISTS idx_trusted_devices_fingerprint ON trusted_devices(fingerprint);
            CREATE INDEX IF NOT EXISTS idx_trusted_devices_active ON trusted_devices(is_active);
          `
        }
      ];

      // Execute pending migrations
      for (const migration of migrations) {
        if (!executedNames.has(migration.name)) {
          logger.info(`Running migration: ${migration.name}`);
          
          await this.transaction(async (client) => {
            await client.query(migration.sql);
            await client.query(
              'INSERT INTO migrations (name) VALUES ($1)',
              [migration.name]
            );
          });

          logger.info(`Migration completed: ${migration.name}`);
        }
      }

      logger.info('All migrations completed successfully');
    } catch (error) {
      logger.error('Migration failed', { error });
      throw error;
    }
  }

  /**
   * Get connection statistics
   */
  public getStats() {
    if (!this.pool) {
      return null;
    }

    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount
    };
  }
}

// Export singleton instance
const databaseServiceInstance = DatabaseService.getInstance();
export { databaseServiceInstance as DatabaseService };

// Static methods for convenience
export const connectDatabase = () => databaseServiceInstance.connect();
export const disconnectDatabase = () => databaseServiceInstance.disconnect();
export const queryDatabase = <T = any>(text: string, params?: any[]) => 
  databaseServiceInstance.query<T>(text, params);
export const transactionDatabase = <T>(callback: (client: PoolClient) => Promise<T>) => 
  databaseServiceInstance.transaction(callback);