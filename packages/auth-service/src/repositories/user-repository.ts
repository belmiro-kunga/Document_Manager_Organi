// User repository for Authentication Service
// Repositório de usuário para o Serviço de Autenticação
import { PoolClient } from 'pg';
import { DatabaseService } from '../services/database';
import { 
  AuthUser, 
  UserRow, 
  CreateUserInput, 
  UpdateUserInput, 
  UserSearchFilters,
  UserRole,
  SupportedLanguage,
  ExtendedUserPreferences,
  SecuritySettings,
  UserProfile
} from '../models/user';

/**
 * User repository class
 */
export class UserRepository {
  private db = DatabaseService;

  /**
   * Create a new user
   */
  async create(userData: CreateUserInput, passwordHash: string, passwordSalt: string): Promise<AuthUser> {
    const query = `
      INSERT INTO users (
        email, username, first_name, last_name, password_hash, password_salt,
        role, language, department, position, phone, is_active,
        preferences, security_settings, profile, last_password_change
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW()
      ) RETURNING *
    `;

    const defaultPreferences: ExtendedUserPreferences = {
      language: userData.language || SupportedLanguage.PT,
      timezone: 'Africa/Luanda',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
      theme: 'light',
      notifications: {
        email: true,
        push: true,
        sms: false,
        desktop: true,
        documentUpdates: true,
        workflowUpdates: true,
        systemUpdates: true,
        securityAlerts: true,
        marketingEmails: false
      },
      dashboard: {
        widgets: ['recent-documents', 'tasks', 'notifications'],
        layout: 'grid',
        defaultView: 'recent',
        itemsPerPage: 20,
        showTutorials: true
      },
      privacy: {
        profileVisibility: 'private',
        showOnlineStatus: true,
        allowDirectMessages: true,
        shareUsageData: false
      },
      accessibility: {
        highContrast: false,
        largeText: false,
        reduceMotion: false,
        screenReader: false,
        keyboardNavigation: false
      }
    };

    const defaultSecuritySettings: SecuritySettings = {
      requirePasswordChange: false,
      maxConcurrentSessions: 5,
      sessionTimeout: 480, // 8 hours
      requireReauthentication: false,
      twoFactorMethods: [],
      backupCodesGenerated: false,
      trustedDevices: [],
      requireDeviceVerification: false,
      logSecurityEvents: true,
      alertOnSuspiciousActivity: true
    };

    const defaultProfile: UserProfile = {
      displayName: `${userData.firstName} ${userData.lastName}`,
      phoneNumbers: [],
      addresses: [],
      socialLinks: [],
      isPublic: false,
      showContactInfo: false
    };

    const values = [
      userData.email,
      userData.username,
      userData.firstName,
      userData.lastName,
      passwordHash,
      passwordSalt,
      userData.role || UserRole.USER,
      userData.language || SupportedLanguage.PT,
      userData.department || null,
      userData.position || null,
      userData.phone || null,
      true, // is_active
      JSON.stringify(defaultPreferences),
      JSON.stringify(defaultSecuritySettings),
      JSON.stringify(defaultProfile)
    ];

    const result = await this.db.query<UserRow>(query, values);
    return this.mapRowToUser(result.rows[0]);
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<AuthUser | null> {
    const query = `
      SELECT * FROM users 
      WHERE id = $1 AND deleted_at IS NULL
    `;

    const result = await this.db.query<UserRow>(query, [id]);
    return result.rows.length > 0 ? this.mapRowToUser(result.rows[0]) : null;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<AuthUser | null> {
    const query = `
      SELECT * FROM users 
      WHERE email = $1 AND deleted_at IS NULL
    `;

    const result = await this.db.query<UserRow>(query, [email]);
    return result.rows.length > 0 ? this.mapRowToUser(result.rows[0]) : null;
  }

  /**
   * Find user by username
   */
  async findByUsername(username: string): Promise<AuthUser | null> {
    const query = `
      SELECT * FROM users 
      WHERE username = $1 AND deleted_at IS NULL
    `;

    const result = await this.db.query<UserRow>(query, [username]);
    return result.rows.length > 0 ? this.mapRowToUser(result.rows[0]) : null;
  }

  /**
   * Find user by email or username
   */
  async findByEmailOrUsername(emailOrUsername: string): Promise<AuthUser | null> {
    const query = `
      SELECT * FROM users 
      WHERE (email = $1 OR username = $1) AND deleted_at IS NULL
    `;

    const result = await this.db.query<UserRow>(query, [emailOrUsername]);
    return result.rows.length > 0 ? this.mapRowToUser(result.rows[0]) : null;
  }

  /**
   * Update user
   */
  async update(id: string, userData: UpdateUserInput, updatedBy?: string): Promise<AuthUser | null> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Build dynamic update query
    if (userData.firstName !== undefined) {
      updateFields.push(`first_name = $${paramIndex++}`);
      values.push(userData.firstName);
    }
    if (userData.lastName !== undefined) {
      updateFields.push(`last_name = $${paramIndex++}`);
      values.push(userData.lastName);
    }
    if (userData.email !== undefined) {
      updateFields.push(`email = $${paramIndex++}`);
      values.push(userData.email);
    }
    if (userData.username !== undefined) {
      updateFields.push(`username = $${paramIndex++}`);
      values.push(userData.username);
    }
    if (userDateData.position !== undefined) {
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