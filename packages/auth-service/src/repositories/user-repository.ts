// User Repository for Authentication Service
// Repositório de Usuários para o Serviço de Autenticação
import { PoolClient } from 'pg';
import { 
  AuthUser, 
  CreateUserInput, 
  UpdateUserInput, 
  UserSearchFilters,
  RefreshToken,
  ApiKey,
  SecurityEvent,
  LoginAttempt
} from '../models/user';
import { DatabaseService } from '../services/database';
import { createLogger, AppError, ValidationError } from '@adms/shared';
import { validateUser, validateCreateUser, validateUpdateUser } from '../validators/user-validator';

const logger = createLogger({ service: 'auth-service-user-repo' });

/**
 * User Repository class
 */
export class UserRepository {
  /**
   * Create a new user
   */
  public async create(userData: CreateUserInput): Promise<AuthUser> {
    try {
      // Validate input data
      const validationResult = validateCreateUser(userData);
      if (!validationResult.isValid) {
        throw new ValidationError('Invalid user data', validationResult.errors);
      }

      const query = `
        INSERT INTO users (
          email, username, first_name, last_name, password_hash, password_salt,
          role, language, department, position, phone, is_active,
          preferences, security_settings, profile, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        ) RETURNING *
      `;

      const values = [
        userData.email,
        userData.username,
        userData.firstName,
        userData.lastName,
        userData.password, // This should be hashed before calling this method
        '', // Salt will be generated during hashing
        userData.role || 'user',
        userData.language || 'pt',
        userData.department,
        userData.position,
        userData.phone,
        true, // is_active
        JSON.stringify({}), // preferences
        JSON.stringify({}), // security_settings
        JSON.stringify({}) // profile
      ];

      const result = await DatabaseService.query<AuthUser>(query, values);
      
      if (result.rows.length === 0) {
        throw new AppError('USER_CREATION_FAILED', 'Failed to create user', 500);
      }

      const user = this.mapRowToUser(result.rows[0]);
      
      logger.info('User created successfully', {
        userId: user.id,
        email: user.email,
        username: user.username
      });

      return user;
    } catch (error) {
      logger.error('Failed to create user', { error, userData: { ...userData, password: '[REDACTED]' } });
      throw error;
    }
  }

  /**
   * Find user by ID
   */
  public async findById(id: string): Promise<AuthUser | null> {
    try {
      const query = `
        SELECT * FROM users 
        WHERE id = $1 AND deleted_at IS NULL
      `;

      const result = await DatabaseService.query<any>(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToUser(result.rows[0]);
    } catch (error) {
      logger.error('Failed to find user by ID', { error, userId: id });
      throw error;
    }
  }

  /**
   * Find user by email
   */
  public async findByEmail(email: string): Promise<AuthUser | null> {
    try {
      const query = `
        SELECT * FROM users 
        WHERE email = $1 AND deleted_at IS NULL
      `;

      const result = await DatabaseService.query<any>(query, [email]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToUser(result.rows[0]);
    } catch (error) {
      logger.error('Failed to find user by email', { error, email });
      throw error;
    }
  }

  /**
   * Find user by username
   */
  public async findByUsername(username: string): Promise<AuthUser | null> {
    try {
      const query = `
        SELECT * FROM users 
        WHERE username = $1 AND deleted_at IS NULL
      `;

      const result = await DatabaseService.query<any>(query, [username]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToUser(result.rows[0]);
    } catch (error) {
      logger.error('Failed to find user by username', { error, username });
      throw error;
    }
  }

  /**
   * Update user
   */
  public async update(id: string, updateData: UpdateUserInput): Promise<AuthUser> {
    try {
      // Validate input data
      const validationResult = validateUpdateUser(updateData);
      if (!validationResult.isValid) {
        throw new ValidationError('Invalid update data', validationResult.errors);
      }

      // Build dynamic update query
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (updateData.firstName !== undefined) {
        updateFields.push(`first_name = $${paramIndex++}`);
        values.push(updateData.firstName);
      }
      if (updateData.lastName !== undefined) {
        updateFields.push(`last_name = $${paramIndex++}`);
        values.push(updateData.lastName);
      }
      if (updateData.email !== undefined) {
        updateFields.push(`email = $${paramIndex++}`);
        values.push(updateData.email);
      }
      if (updateData.username !== undefined) {
        updateFields.push(`username = $${paramIndex++}`);
        values.push(updateData.username);
      }
      if (updateData.role !== undefined) {
        updateFields.push(`role = $${paramIndex++}`);
        values.push(updateData.role);
      }
      if (updateData.language !== undefined) {
        updateFields.push(`language = $${paramIndex++}`);
        values.push(updateData.language);
      }
      if (updateData.department !== undefined) {
        updateFields.push(`department = $${paramIndex++}`);
        values.push(updateData.department);
      }
      if (updateData.position !== undefined) {
        updateFields.push(`position = $${paramIndex++}`);
        values.push(updateData.position);
      }
      if (updateData.phone !== undefined) {
        updateFields.push(`phone = $${paramIndex++}`);
        values.push(updateData.phone);
      }
      if (updateData.isActive !== undefined) {
        updateFields.push(`is_active = $${paramIndex++}`);
        values.push(updateData.isActive);
      }
      if (updateData.preferences !== undefined) {
        updateFields.push(`preferences = $${paramIndex++}`);
        values.push(JSON.stringify(updateData.preferences));
      }
      if (updateData.profile !== undefined) {
        updateFields.push(`profile = $${paramIndex++}`);
        values.push(JSON.stringify(updateData.profile));
      }

      if (updateFields.length === 0) {
        throw new ValidationError('No fields to update');
      }

      // Add updated_at and user ID
      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id);

      const query = `
        UPDATE users 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex} AND deleted_at IS NULL
        RETURNING *
      `;

      const result = await DatabaseService.query<any>(query, values);
      
      if (result.rows.length === 0) {
        throw new AppError('USER_NOT_FOUND', 'User not found or already deleted', 404);
      }

      const user = this.mapRowToUser(result.rows[0]);
      
      logger.info('User updated successfully', {
        userId: user.id,
        updatedFields: Object.keys(updateData)
      });

      return user;
    } catch (error) {
      logger.error('Failed to update user', { error, userId: id, updateData });
      throw error;
    }
  }

  /**
   * Soft delete user
   */
  public async softDelete(id: string): Promise<void> {
    try {
      const query = `
        UPDATE users 
        SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND deleted_at IS NULL
      `;

      const result = await DatabaseService.query(query, [id]);
      
      if (result.rowCount === 0) {
        throw new AppError('USER_NOT_FOUND', 'User not found or already deleted', 404);
      }

      logger.info('User soft deleted successfully', { userId: id });
    } catch (error) {
      logger.error('Failed to soft delete user', { error, userId: id });
      throw error;
    }
  }

  /**
   * Hard delete user (permanent)
   */
  public async hardDelete(id: string): Promise<void> {
    try {
      await DatabaseService.transaction(async (client) => {
        // Delete related records first
        await client.query('DELETE FROM refresh_tokens WHERE user_id = $1', [id]);
        await client.query('DELETE FROM oauth_providers WHERE user_id = $1', [id]);
        await client.query('DELETE FROM api_keys WHERE user_id = $1', [id]);
        await client.query('DELETE FROM security_events WHERE user_id = $1', [id]);
        await client.query('DELETE FROM trusted_devices WHERE user_id = $1', [id]);
        
        // Delete user
        const result = await client.query('DELETE FROM users WHERE id = $1', [id]);
        
        if (result.rowCount === 0) {
          throw new AppError('USER_NOT_FOUND', 'User not found', 404);
        }
      });

      logger.warn('User hard deleted permanently', { userId: id });
    } catch (error) {
      logger.error('Failed to hard delete user', { error, userId: id });
      throw error;
    }
  }

  /**
   * Find users with filters and pagination
   */
  public async findMany(
    filters: UserSearchFilters = {},
    page = 1,
    limit = 20
  ): Promise<{ users: AuthUser[]; total: number; page: number; limit: number }> {
    try {
      const offset = (page - 1) * limit;
      const whereConditions: string[] = ['deleted_at IS NULL'];
      const values: any[] = [];
      let paramIndex = 1;

      // Build WHERE conditions
      if (filters.query) {
        whereConditions.push(`(
          first_name ILIKE $${paramIndex} OR 
          last_name ILIKE $${paramIndex} OR 
          email ILIKE $${paramIndex} OR 
          username ILIKE $${paramIndex}
        )`);
        values.push(`%${filters.query}%`);
        paramIndex++;
      }

      if (filters.role) {
        whereConditions.push(`role = $${paramIndex++}`);
        values.push(filters.role);
      }

      if (filters.department) {
        whereConditions.push(`department = $${paramIndex++}`);
        values.push(filters.department);
      }

      if (filters.isActive !== undefined) {
        whereConditions.push(`is_active = $${paramIndex++}`);
        values.push(filters.isActive);
      }

      if (filters.isEmailVerified !== undefined) {
        if (filters.isEmailVerified) {
          whereConditions.push('email_verified_at IS NOT NULL');
        } else {
          whereConditions.push('email_verified_at IS NULL');
        }
      }

      if (filters.createdAfter) {
        whereConditions.push(`created_at >= $${paramIndex++}`);
        values.push(filters.createdAfter);
      }

      if (filters.createdBefore) {
        whereConditions.push(`created_at <= $${paramIndex++}`);
        values.push(filters.createdBefore);
      }

      if (filters.lastLoginAfter) {
        whereConditions.push(`last_login_at >= $${paramIndex++}`);
        values.push(filters.lastLoginAfter);
      }

      if (filters.lastLoginBefore) {
        whereConditions.push(`last_login_at <= $${paramIndex++}`);
        values.push(filters.lastLoginBefore);
      }

      const whereClause = whereConditions.join(' AND ');

      // Count total records
      const countQuery = `SELECT COUNT(*) as total FROM users WHERE ${whereClause}`;
      const countResult = await DatabaseService.query<{ total: string }>(countQuery, values);
      const total = parseInt(countResult.rows[0].total);

      // Get paginated results
      const dataQuery = `
        SELECT * FROM users 
        WHERE ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex}
      `;
      values.push(limit, offset);

      const dataResult = await DatabaseService.query<any>(dataQuery, values);
      const users = dataResult.rows.map(row => this.mapRowToUser(row));

      return {
        users,
        total,
        page,
        limit
      };
    } catch (error) {
      logger.error('Failed to find users', { error, filters, page, limit });
      throw error;
    }
  }

  /**
   * Update user login information
   */
  public async updateLoginInfo(
    id: string, 
    loginInfo: { 
      lastLoginAt: Date; 
      lastLoginIp: string; 
      sessionId?: string;
      resetLoginAttempts?: boolean;
    }
  ): Promise<void> {
    try {
      const updateFields = [
        'last_login_at = $2',
        'last_login_ip = $3',
        'updated_at = CURRENT_TIMESTAMP'
      ];
      const values = [id, loginInfo.lastLoginAt, loginInfo.lastLoginIp];
      let paramIndex = 4;

      if (loginInfo.sessionId) {
        updateFields.push(`current_session_id = $${paramIndex++}`);
        values.push(loginInfo.sessionId);
      }

      if (loginInfo.resetLoginAttempts) {
        updateFields.push('login_attempts = 0', 'locked_until = NULL');
      }

      const query = `
        UPDATE users 
        SET ${updateFields.join(', ')}
        WHERE id = $1 AND deleted_at IS NULL
      `;

      await DatabaseService.query(query, values);
      
      logger.info('User login info updated', { userId: id });
    } catch (error) {
      logger.error('Failed to update user login info', { error, userId: id });
      throw error;
    }
  }

  /**
   * Increment login attempts
   */
  public async incrementLoginAttempts(id: string, lockoutDuration?: number): Promise<void> {
    try {
      let query = `
        UPDATE users 
        SET login_attempts = login_attempts + 1, updated_at = CURRENT_TIMESTAMP
      `;
      const values = [id];

      if (lockoutDuration) {
        query += `, locked_until = CURRENT_TIMESTAMP + INTERVAL '${lockoutDuration} milliseconds'`;
      }

      query += ' WHERE id = $1 AND deleted_at IS NULL';

      await DatabaseService.query(query, values);
      
      logger.warn('User login attempts incremented', { userId: id, lockoutDuration });
    } catch (error) {
      logger.error('Failed to increment login attempts', { error, userId: id });
      throw error;
    }
  }

  /**
   * Check if user exists by email or username
   */
  public async existsByEmailOrUsername(email: string, username: string, excludeId?: string): Promise<boolean> {
    try {
      let query = `
        SELECT COUNT(*) as count FROM users 
        WHERE (email = $1 OR username = $2) AND deleted_at IS NULL
      `;
      const values = [email, username];

      if (excludeId) {
        query += ' AND id != $3';
        values.push(excludeId);
      }

      const result = await DatabaseService.query<{ count: string }>(query, values);
      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      logger.error('Failed to check user existence', { error, email, username });
      throw error;
    }
  }

  /**
   * Map database row to User object
   */
  private mapRowToUser(row: any): AuthUser {
    return {
      id: row.id,
      email: row.email,
      username: row.username,
      firstName: row.first_name,
      lastName: row.last_name,
      passwordHash: row.password_hash,
      passwordSalt: row.password_salt,
      role: row.role,
      language: row.language,
      department: row.department,
      position: row.position,
      phone: row.phone,
      isActive: row.is_active,
      emailVerifiedAt: row.email_verified_at,
      emailVerificationToken: row.email_verification_token,
      emailVerificationExpires: row.email_verification_expires,
      passwordResetToken: row.password_reset_token,
      passwordResetExpires: row.password_reset_expires,
      lastPasswordChange: row.last_password_change,
      loginAttempts: row.login_attempts,
      lockedUntil: row.locked_until,
      twoFactorSecret: row.two_factor_secret,
      twoFactorEnabled: row.two_factor_enabled,
      lastLoginAt: row.last_login_at,
      lastLoginIp: row.last_login_ip,
      currentSessionId: row.current_session_id,
      preferences: row.preferences ? JSON.parse(row.preferences) : {},
      securitySettings: row.security_settings ? JSON.parse(row.security_settings) : {},
      profile: row.profile ? JSON.parse(row.profile) : {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
      createdBy: row.created_by,
      updatedBy: row.updated_by,
      // These will be loaded separately when needed
      refreshTokens: [],
      oauthProviders: [],
      apiKeys: [],
      twoFactorBackupCodes: []
    };
  }
}

// Export singleton instance
export const userRepository = new UserRepository();