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
    if (userData.role !== undefined) {
      updateFields.push(`role = $${paramIndex++}`);
      values.push(userData.role);
    }
    if (userData.language !== undefined) {
      updateFields.push(`language = $${paramIndex++}`);
      values.push(userData.language);
    }
    if (userData.department !== undefined) {
      updateFields.push(`department = $${paramIndex++}`);
      values.push(userData.department);
    }
    if (userData.position !== undefined) {
      updateFields.push(`position = $${paramIndex++}`);
      values.push(userData.position);
    }
    if (userData.phone !== undefined) {
      updateFields.push(`phone = $${paramIndex++}`);
      values.push(userData.phone);
    }
    if (userData.isActive !== undefined) {
      updateFields.push(`is_active = $${paramIndex++}`);
      values.push(userData.isActive);
    }
    if (userData.preferences !== undefined) {
      updateFields.push(`preferences = $${paramIndex++}`);
      values.push(JSON.stringify(userData.preferences));
    }
    if (userData.profile !== undefined) {
      updateFields.push(`profile = $${paramIndex++}`);
      values.push(JSON.stringify(userData.profile));
    }

    if (updateFields.length === 0) {
      return this.findById(id);
    }

    // Always update updated_at and updated_by
    updateFields.push(`updated_at = NOW()`);
    if (updatedBy) {
      updateFields.push(`updated_by = $${paramIndex++}`);
      values.push(updatedBy);
    }

    // Add ID parameter
    values.push(id);

    const query = `
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex} AND deleted_at IS NULL
      RETURNING *
    `;

    const result = await this.db.query<UserRow>(query, values);
    return result.rows.length > 0 ? this.mapRowToUser(result.rows[0]) : null;
  }

  /**
   * Update user password
   */
  async updatePassword(id: string, passwordHash: string, passwordSalt: string): Promise<boolean> {
    const query = `
      UPDATE users 
      SET password_hash = $1, password_salt = $2, last_password_change = NOW(), updated_at = NOW()
      WHERE id = $3 AND deleted_at IS NULL
    `;

    const result = await this.db.query(query, [passwordHash, passwordSalt, id]);
    return result.rowCount > 0;
  }

  /**
   * Soft delete user
   */
  async softDelete(id: string, deletedBy?: string): Promise<boolean> {
    const query = `
      UPDATE users 
      SET deleted_at = NOW(), updated_at = NOW(), updated_by = $2
      WHERE id = $1 AND deleted_at IS NULL
    `;

    const result = await this.db.query(query, [id, deletedBy]);
    return result.rowCount > 0;
  }

  /**
   * Search users with filters and pagination
   */
  async search(filters: UserSearchFilters & { page?: number; limit?: number; sortBy?: string; sortOrder?: string }) {
    let query = `
      SELECT * FROM users 
      WHERE deleted_at IS NULL
    `;
    const values: any[] = [];
    let paramIndex = 1;

    // Apply filters
    if (filters.query) {
      query += ` AND (
        first_name ILIKE $${paramIndex} OR 
        last_name ILIKE $${paramIndex} OR 
        email ILIKE $${paramIndex} OR 
        username ILIKE $${paramIndex}
      )`;
      values.push(`%${filters.query}%`);
      paramIndex++;
    }

    if (filters.role) {
      query += ` AND role = $${paramIndex}`;
      values.push(filters.role);
      paramIndex++;
    }

    if (filters.department) {
      query += ` AND department = $${paramIndex}`;
      values.push(filters.department);
      paramIndex++;
    }

    if (filters.isActive !== undefined) {
      query += ` AND is_active = $${paramIndex}`;
      values.push(filters.isActive);
      paramIndex++;
    }

    // Count total records
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)');
    const countResult = await this.db.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count);

    // Apply sorting
    const sortBy = filters.sortBy || 'created_at';
    const sortOrder = filters.sortOrder || 'desc';
    query += ` ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`;

    // Apply pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(limit, offset);

    const result = await this.db.query<UserRow>(query, values);
    const users = result.rows.map(row => this.mapRowToUser(row));

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string, excludeId?: string): Promise<boolean> {
    let query = `SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL`;
    const values: any[] = [email];

    if (excludeId) {
      query += ` AND id != $2`;
      values.push(excludeId);
    }

    const result = await this.db.query(query, values);
    return result.rows.length > 0;
  }

  /**
   * Check if username exists
   */
  async usernameExists(username: string, excludeId?: string): Promise<boolean> {
    let query = `SELECT id FROM users WHERE username = $1 AND deleted_at IS NULL`;
    const values: any[] = [username];

    if (excludeId) {
      query += ` AND id != $2`;
      values.push(excludeId);
    }

    const result = await this.db.query(query, values);
    return result.rows.length > 0;
  }

  /**
   * Get user count
   */
  async count(): Promise<number> {
    const query = `SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL`;
    const result = await this.db.query(query);
    return parseInt(result.rows[0].count);
  }

  /**
   * Map database row to user object
   */
  private mapRowToUser(row: UserRow): AuthUser {
    return {
      id: row.id,
      email: row.email,
      username: row.username,
      firstName: row.first_name,
      lastName: row.last_name,
      passwordHash: row.password_hash,
      passwordSalt: row.password_salt,
      role: row.role as UserRole,
      language: row.language as SupportedLanguage,
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
      twoFactorBackupCodes: [],
      refreshTokens: [],
      lastLoginAt: row.last_login_at,
      lastLoginIp: row.last_login_ip,
      currentSessionId: row.current_session_id,
      oauthProviders: [],
      apiKeys: [],
      preferences: row.preferences || {},
      securitySettings: row.security_settings || {},
      profile: row.profile || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
      createdBy: row.created_by,
      updatedBy: row.updated_by
    };
  }
}

// Export singleton instance
export const userRepository = new UserRepository();