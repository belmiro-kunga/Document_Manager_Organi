// User repository tests for Authentication Service
// Testes do repositório de usuário para o Serviço de Autenticação
import { UserRepository } from '../../src/repositories/user-repository';
import { DatabaseService } from '../../src/services/database';
import { UserRole, SupportedLanguage, CreateUserInput } from '../../src/models/user';

// Mock the database service
jest.mock('../../src/services/database');

describe('UserRepository', () => {
  let userRepository: UserRepository;
  let mockDb: jest.Mocked<typeof DatabaseService>;

  beforeEach(() => {
    userRepository = new UserRepository();
    mockDb = DatabaseService as jest.Mocked<typeof DatabaseService>;
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      const userData: CreateUserInput = {
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        password: 'TestPassword123!',
        role: UserRole.USER,
        language: SupportedLanguage.PT
      };

      const mockUserRow = {
        id: 'user-123',
        email: userData.email,
        username: userData.username,
        first_name: userData.firstName,
        last_name: userData.lastName,
        password_hash: 'hashed-password',
        password_salt: 'salt',
        role: userData.role,
        language: userData.language,
        department: null,
        position: null,
        phone: null,
        is_active: true,
        email_verified_at: null,
        email_verification_token: null,
        email_verification_expires: null,
        password_reset_token: null,
        password_reset_expires: null,
        last_password_change: new Date(),
        login_attempts: 0,
        locked_until: null,
        two_factor_secret: null,
        two_factor_enabled: false,
        last_login_at: null,
        last_login_ip: null,
        current_session_id: null,
        preferences: {},
        security_settings: {},
        profile: {},
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
        created_by: null,
        updated_by: null
      };

      mockDb.query.mockResolvedValue({
        rows: [mockUserRow],
        rowCount: 1,
        command: 'INSERT',
        oid: 0,
        fields: []
      });

      const result = await userRepository.create(userData, 'hashed-password', 'salt');

      expect(result).toBeDefined();
      expect(result.email).toBe(userData.email);
      expect(result.username).toBe(userData.username);
      expect(result.firstName).toBe(userData.firstName);
      expect(result.lastName).toBe(userData.lastName);
      expect(result.role).toBe(userData.role);
      expect(result.language).toBe(userData.language);
      expect(result.isActive).toBe(true);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        expect.arrayContaining([
          userData.email,
          userData.username,
          userData.firstName,
          userData.lastName,
          'hashed-password',
          'salt'
        ])
      );
    });

    it('should create user with default values', async () => {
      const userData: CreateUserInput = {
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        password: 'TestPassword123!'
      };

      const mockUserRow = {
        id: 'user-123',
        email: userData.email,
        username: userData.username,
        first_name: userData.firstName,
        last_name: userData.lastName,
        password_hash: 'hashed-password',
        password_salt: 'salt',
        role: UserRole.USER,
        language: SupportedLanguage.PT,
        department: null,
        position: null,
        phone: null,
        is_active: true,
        email_verified_at: null,
        email_verification_token: null,
        email_verification_expires: null,
        password_reset_token: null,
        password_reset_expires: null,
        last_password_change: new Date(),
        login_attempts: 0,
        locked_until: null,
        two_factor_secret: null,
        two_factor_enabled: false,
        last_login_at: null,
        last_login_ip: null,
        current_session_id: null,
        preferences: {},
        security_settings: {},
        profile: {},
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
        created_by: null,
        updated_by: null
      };

      mockDb.query.mockResolvedValue({
        rows: [mockUserRow],
        rowCount: 1,
        command: 'INSERT',
        oid: 0,
        fields: []
      });

      const result = await userRepository.create(userData, 'hashed-password', 'salt');

      expect(result.role).toBe(UserRole.USER);
      expect(result.language).toBe(SupportedLanguage.PT);
    });
  });

  describe('findById', () => {
    it('should find user by ID', async () => {
      const userId = 'user-123';
      const mockUserRow = {
        id: userId,
        email: 'test@example.com',
        username: 'testuser',
        first_name: 'Test',
        last_name: 'User',
        password_hash: 'hashed-password',
        password_salt: 'salt',
        role: UserRole.USER,
        language: SupportedLanguage.PT,
        department: null,
        position: null,
        phone: null,
        is_active: true,
        email_verified_at: null,
        email_verification_token: null,
        email_verification_expires: null,
        password_reset_token: null,
        password_reset_expires: null,
        last_password_change: new Date(),
        login_attempts: 0,
        locked_until: null,
        two_factor_secret: null,
        two_factor_enabled: false,
        last_login_at: null,
        last_login_ip: null,
        current_session_id: null,
        preferences: {},
        security_settings: {},
        profile: {},
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
        created_by: null,
        updated_by: null
      };

      mockDb.query.mockResolvedValue({
        rows: [mockUserRow],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await userRepository.findById(userId);

      expect(result).toBeDefined();
      expect(result?.id).toBe(userId);
      expect(result?.email).toBe('test@example.com');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL'),
        [userId]
      );
    });

    it('should return null if user not found', async () => {
      mockDb.query.mockResolvedValue({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await userRepository.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const email = 'test@example.com';
      const mockUserRow = {
        id: 'user-123',
        email: email,
        username: 'testuser',
        first_name: 'Test',
        last_name: 'User',
        password_hash: 'hashed-password',
        password_salt: 'salt',
        role: UserRole.USER,
        language: SupportedLanguage.PT,
        department: null,
        position: null,
        phone: null,
        is_active: true,
        email_verified_at: null,
        email_verification_token: null,
        email_verification_expires: null,
        password_reset_token: null,
        password_reset_expires: null,
        last_password_change: new Date(),
        login_attempts: 0,
        locked_until: null,
        two_factor_secret: null,
        two_factor_enabled: false,
        last_login_at: null,
        last_login_ip: null,
        current_session_id: null,
        preferences: {},
        security_settings: {},
        profile: {},
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
        created_by: null,
        updated_by: null
      };

      mockDb.query.mockResolvedValue({
        rows: [mockUserRow],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await userRepository.findByEmail(email);

      expect(result).toBeDefined();
      expect(result?.email).toBe(email);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL'),
        [email]
      );
    });

    it('should return null if user not found by email', async () => {
      mockDb.query.mockResolvedValue({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await userRepository.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findByUsername', () => {
    it('should find user by username', async () => {
      const username = 'testuser';
      const mockUserRow = {
        id: 'user-123',
        email: 'test@example.com',
        username: username,
        first_name: 'Test',
        last_name: 'User',
        password_hash: 'hashed-password',
        password_salt: 'salt',
        role: UserRole.USER,
        language: SupportedLanguage.PT,
        department: null,
        position: null,
        phone: null,
        is_active: true,
        email_verified_at: null,
        email_verification_token: null,
        email_verification_expires: null,
        password_reset_token: null,
        password_reset_expires: null,
        last_password_change: new Date(),
        login_attempts: 0,
        locked_until: null,
        two_factor_secret: null,
        two_factor_enabled: false,
        last_login_at: null,
        last_login_ip: null,
        current_session_id: null,
        preferences: {},
        security_settings: {},
        profile: {},
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
        created_by: null,
        updated_by: null
      };

      mockDb.query.mockResolvedValue({
        rows: [mockUserRow],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await userRepository.findByUsername(username);

      expect(result).toBeDefined();
      expect(result?.username).toBe(username);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM users WHERE username = $1 AND deleted_at IS NULL'),
        [username]
      );
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const userId = 'user-123';
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        email: 'updated@example.com'
      };

      const mockUpdatedRow = {
        id: userId,
        email: updateData.email,
        username: 'testuser',
        first_name: updateData.firstName,
        last_name: updateData.lastName,
        password_hash: 'hashed-password',
        password_salt: 'salt',
        role: UserRole.USER,
        language: SupportedLanguage.PT,
        department: null,
        position: null,
        phone: null,
        is_active: true,
        email_verified_at: null,
        email_verification_token: null,
        email_verification_expires: null,
        password_reset_token: null,
        password_reset_expires: null,
        last_password_change: new Date(),
        login_attempts: 0,
        locked_until: null,
        two_factor_secret: null,
        two_factor_enabled: false,
        last_login_at: null,
        last_login_ip: null,
        current_session_id: null,
        preferences: {},
        security_settings: {},
        profile: {},
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
        created_by: null,
        updated_by: null
      };

      mockDb.query.mockResolvedValue({
        rows: [mockUpdatedRow],
        rowCount: 1,
        command: 'UPDATE',
        oid: 0,
        fields: []
      });

      const result = await userRepository.update(userId, updateData);

      expect(result).toBeDefined();
      expect(result?.firstName).toBe(updateData.firstName);
      expect(result?.lastName).toBe(updateData.lastName);
      expect(result?.email).toBe(updateData.email);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET'),
        expect.arrayContaining([updateData.firstName, updateData.lastName, updateData.email, userId])
      );
    });

    it('should return existing user if no updates provided', async () => {
      const userId = 'user-123';
      const mockUserRow = {
        id: userId,
        email: 'test@example.com',
        username: 'testuser',
        first_name: 'Test',
        last_name: 'User',
        password_hash: 'hashed-password',
        password_salt: 'salt',
        role: UserRole.USER,
        language: SupportedLanguage.PT,
        department: null,
        position: null,
        phone: null,
        is_active: true,
        email_verified_at: null,
        email_verification_token: null,
        email_verification_expires: null,
        password_reset_token: null,
        password_reset_expires: null,
        last_password_change: new Date(),
        login_attempts: 0,
        locked_until: null,
        two_factor_secret: null,
        two_factor_enabled: false,
        last_login_at: null,
        last_login_ip: null,
        current_session_id: null,
        preferences: {},
        security_settings: {},
        profile: {},
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
        created_by: null,
        updated_by: null
      };

      mockDb.query.mockResolvedValue({
        rows: [mockUserRow],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await userRepository.update(userId, {});

      expect(result).toBeDefined();
      expect(result?.id).toBe(userId);

      // Should call findById instead of update
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL'),
        [userId]
      );
    });
  });

  describe('updatePassword', () => {
    it('should update user password successfully', async () => {
      const userId = 'user-123';
      const newPasswordHash = 'new-hashed-password';
      const newPasswordSalt = 'new-salt';

      mockDb.query.mockResolvedValue({
        rows: [],
        rowCount: 1,
        command: 'UPDATE',
        oid: 0,
        fields: []
      });

      const result = await userRepository.updatePassword(userId, newPasswordHash, newPasswordSalt);

      expect(result).toBe(true);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET password_hash = $1, password_salt = $2'),
        [newPasswordHash, newPasswordSalt, userId]
      );
    });

    it('should return false if user not found', async () => {
      mockDb.query.mockResolvedValue({
        rows: [],
        rowCount: 0,
        command: 'UPDATE',
        oid: 0,
        fields: []
      });

      const result = await userRepository.updatePassword('non-existent-id', 'hash', 'salt');

      expect(result).toBe(false);
    });
  });

  describe('softDelete', () => {
    it('should soft delete user successfully', async () => {
      const userId = 'user-123';
      const deletedBy = 'admin-123';

      mockDb.query.mockResolvedValue({
        rows: [],
        rowCount: 1,
        command: 'UPDATE',
        oid: 0,
        fields: []
      });

      const result = await userRepository.softDelete(userId, deletedBy);

      expect(result).toBe(true);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET deleted_at = NOW()'),
        [userId, deletedBy]
      );
    });

    it('should return false if user not found', async () => {
      mockDb.query.mockResolvedValue({
        rows: [],
        rowCount: 0,
        command: 'UPDATE',
        oid: 0,
        fields: []
      });

      const result = await userRepository.softDelete('non-existent-id');

      expect(result).toBe(false);
    });
  });

  describe('emailExists', () => {
    it('should return true if email exists', async () => {
      mockDb.query.mockResolvedValue({
        rows: [{ id: 'user-123' }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await userRepository.emailExists('test@example.com');

      expect(result).toBe(true);
    });

    it('should return false if email does not exist', async () => {
      mockDb.query.mockResolvedValue({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await userRepository.emailExists('nonexistent@example.com');

      expect(result).toBe(false);
    });

    it('should exclude specific user ID when checking email existence', async () => {
      const email = 'test@example.com';
      const excludeId = 'user-123';

      mockDb.query.mockResolvedValue({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await userRepository.emailExists(email, excludeId);

      expect(result).toBe(false);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('AND id != $2'),
        [email, excludeId]
      );
    });
  });

  describe('usernameExists', () => {
    it('should return true if username exists', async () => {
      mockDb.query.mockResolvedValue({
        rows: [{ id: 'user-123' }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await userRepository.usernameExists('testuser');

      expect(result).toBe(true);
    });

    it('should return false if username does not exist', async () => {
      mockDb.query.mockResolvedValue({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await userRepository.usernameExists('nonexistentuser');

      expect(result).toBe(false);
    });
  });

  describe('count', () => {
    it('should return user count', async () => {
      mockDb.query.mockResolvedValue({
        rows: [{ count: '42' }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await userRepository.count();

      expect(result).toBe(42);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL')
      );
    });
  });

  describe('search', () => {
    it('should search users with filters and pagination', async () => {
      const filters = {
        query: 'test',
        role: UserRole.USER,
        isActive: true,
        page: 1,
        limit: 10,
        sortBy: 'created_at',
        sortOrder: 'desc'
      };

      const mockUserRow = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        first_name: 'Test',
        last_name: 'User',
        password_hash: 'hashed-password',
        password_salt: 'salt',
        role: UserRole.USER,
        language: SupportedLanguage.PT,
        department: null,
        position: null,
        phone: null,
        is_active: true,
        email_verified_at: null,
        email_verification_token: null,
        email_verification_expires: null,
        password_reset_token: null,
        password_reset_expires: null,
        last_password_change: new Date(),
        login_attempts: 0,
        locked_until: null,
        two_factor_secret: null,
        two_factor_enabled: false,
        last_login_at: null,
        last_login_ip: null,
        current_session_id: null,
        preferences: {},
        security_settings: {},
        profile: {},
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
        created_by: null,
        updated_by: null
      };

      // Mock count query
      mockDb.query
        .mockResolvedValueOnce({
          rows: [{ count: '1' }],
          rowCount: 1,
          command: 'SELECT',
          oid: 0,
          fields: []
        })
        // Mock search query
        .mockResolvedValueOnce({
          rows: [mockUserRow],
          rowCount: 1,
          command: 'SELECT',
          oid: 0,
          fields: []
        });

      const result = await userRepository.search(filters);

      expect(result).toBeDefined();
      expect(result.users).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.pages).toBe(1);

      expect(mockDb.query).toHaveBeenCalledTimes(2);
    });
  });
});