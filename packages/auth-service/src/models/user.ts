// User model for Authentication Service
// Modelo de usuário para o Serviço de Autenticação

/**
 * User roles enum
 */
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  USER = 'user',
  GUEST = 'guest'
}

/**
 * Supported languages enum
 */
export enum SupportedLanguage {
  PT = 'pt',
  EN = 'en',
  FR = 'fr'
}

/**
 * Base entity interface
 */
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Soft deletable interface
 */
export interface SoftDeletable {
  deletedAt?: Date;
}

/**
 * Auditable interface
 */
export interface Auditable {
  createdBy?: string;
  updatedBy?: string;
}

/**
 * Base user interface
 */
export interface BaseUser extends BaseEntity {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  language: SupportedLanguage;
  department?: string;
  position?: string;
  phone?: string;
  isActive: boolean;
}

/**
 * Extended user interface for authentication service
 */
export interface AuthUser extends BaseUser, SoftDeletable, Auditable {
  // Authentication fields
  passwordHash: string;
  passwordSalt: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  lastPasswordChange: Date;

  // Email verification
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  emailVerifiedAt?: Date;

  // Account security
  loginAttempts: number;
  lockedUntil?: Date;
  twoFactorSecret?: string;
  twoFactorEnabled: boolean;
  twoFactorBackupCodes?: string[];

  // Session management
  refreshTokens: RefreshToken[];
  lastLoginAt?: Date;
  lastLoginIp?: string;
  currentSessionId?: string;

  // OAuth integration
  oauthProviders: OAuthProvider[];

  // API access
  apiKeys: ApiKey[];

  // User preferences (extended)
  preferences: ExtendedUserPreferences;

  // Security settings
  securitySettings: SecuritySettings;

  // Profile information
  profile: UserProfile;
}

/**
 * Refresh token interface
 */
export interface RefreshToken {
  id: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  lastUsedAt?: Date;
  deviceInfo?: DeviceInfo;
  ipAddress?: string;
  isRevoked: boolean;
  revokedAt?: Date;
  revokedReason?: string;
}

/**
 * OAuth provider interface
 */
export interface OAuthProvider {
  id: string;
  provider: 'google' | 'microsoft' | 'github' | 'linkedin';
  providerId: string;
  email: string;
  name: string;
  avatar?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  connectedAt: Date;
  lastUsedAt?: Date;
  isActive: boolean;
}

/**
 * API key interface
 */
export interface ApiKey {
  id: string;
  name: string;
  keyHash: string;
  prefix: string;
  permissions: string[];
  expiresAt?: Date;
  lastUsedAt?: Date;
  createdAt: Date;
  isActive: boolean;
  usageCount: number;
  rateLimitTier: 'basic' | 'premium' | 'enterprise';
}

/**
 * Device information interface
 */
export interface DeviceInfo {
  userAgent: string;
  browser?: string;
  os?: string;
  device?: string;
  isMobile: boolean;
  fingerprint?: string;
}

/**
 * Extended user preferences
 */
export interface ExtendedUserPreferences {
  // Base preferences
  language: SupportedLanguage;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  theme: 'light' | 'dark' | 'auto';

  // Notification preferences
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    desktop: boolean;
    documentUpdates: boolean;
    workflowUpdates: boolean;
    systemUpdates: boolean;
    securityAlerts: boolean;
    marketingEmails: boolean;
  };

  // Dashboard preferences
  dashboard: {
    widgets: string[];
    layout: 'grid' | 'list';
    defaultView: 'recent' | 'favorites' | 'assigned';
    itemsPerPage: number;
    showTutorials: boolean;
  };

  // Privacy preferences
  privacy: {
    profileVisibility: 'public' | 'private' | 'contacts';
    showOnlineStatus: boolean;
    allowDirectMessages: boolean;
    shareUsageData: boolean;
  };

  // Accessibility preferences
  accessibility: {
    highContrast: boolean;
    largeText: boolean;
    reduceMotion: boolean;
    screenReader: boolean;
    keyboardNavigation: boolean;
  };
}

/**
 * Security settings interface
 */
export interface SecuritySettings {
  // Password settings
  passwordExpiry?: Date;
  requirePasswordChange: boolean;

  // Session settings
  maxConcurrentSessions: number;
  sessionTimeout: number; // in minutes
  requireReauthentication: boolean;

  // Two-factor authentication
  twoFactorMethods: ('totp' | 'sms' | 'email')[];
  backupCodesGenerated: boolean;

  // Login restrictions
  allowedIpRanges?: string[];
  blockedIpRanges?: string[];
  allowedCountries?: string[];

  // Device management
  trustedDevices: TrustedDevice[];
  requireDeviceVerification: boolean;

  // Audit settings
  logSecurityEvents: boolean;
  alertOnSuspiciousActivity: boolean;
}

/**
 * Trusted device interface
 */
export interface TrustedDevice {
  id: string;
  name: string;
  fingerprint: string;
  deviceInfo: DeviceInfo;
  trustedAt: Date;
  lastSeenAt: Date;
  isActive: boolean;
}

/**
 * User profile interface
 */
export interface UserProfile {
  // Basic information
  displayName: string;
  bio?: string;
  website?: string;
  location?: string;

  // Contact information
  phoneNumbers: PhoneNumber[];
  addresses: Address[];

  // Professional information
  jobTitle?: string;
  company?: string;
  department?: string;
  manager?: string;
  directReports?: string[];

  // Social links
  socialLinks: SocialLink[];

  // Profile settings
  avatar?: string;
  coverImage?: string;
  isPublic: boolean;
  showContactInfo: boolean;
}

/**
 * Phone number interface
 */
export interface PhoneNumber {
  id: string;
  type: 'mobile' | 'work' | 'home' | 'other';
  number: string;
  countryCode: string;
  isPrimary: boolean;
  isVerified: boolean;
  verifiedAt?: Date;
}

/**
 * Address interface
 */
export interface Address {
  id: string;
  type: 'home' | 'work' | 'other';
  street: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  isPrimary: boolean;
}

/**
 * Social link interface
 */
export interface SocialLink {
  id: string;
  platform: string;
  url: string;
  username?: string;
  isPublic: boolean;
}

/**
 * User creation input
 */
export interface CreateUserInput {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  role?: UserRole;
  language?: SupportedLanguage;
  department?: string;
  position?: string;
  phone?: string;
  sendWelcomeEmail?: boolean;
  requireEmailVerification?: boolean;
}

/**
 * User update input
 */
export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  username?: string;
  role?: UserRole;
  language?: SupportedLanguage;
  department?: string;
  position?: string;
  phone?: string;
  isActive?: boolean;
  preferences?: Partial<ExtendedUserPreferences>;
  profile?: Partial<UserProfile>;
}

/**
 * Password change input
 */
export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  logoutOtherSessions?: boolean;
}

/**
 * User search filters
 */
export interface UserSearchFilters {
  query?: string;
  role?: UserRole;
  department?: string;
  isActive?: boolean;
  isEmailVerified?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
  lastLoginAfter?: Date;
  lastLoginBefore?: Date;
}

/**
 * User statistics
 */
export interface UserStatistics {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  usersByRole: Record<UserRole, number>;
  usersByDepartment: Record<string, number>;
  averageSessionDuration: number;
  topCountries: Array<{ country: string; count: number }>;
}

/**
 * Login attempt interface
 */
export interface LoginAttempt {
  id: string;
  userId?: string;
  email: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  failureReason?: string;
  timestamp: Date;
  location?: {
    country: string;
    city: string;
    coordinates?: [number, number];
  };
}

/**
 * Security event interface
 */
export interface SecurityEvent {
  id: string;
  userId: string;
  type: 'login' | 'logout' | 'password_change' | 'email_change' | 'two_factor_enabled' | 'two_factor_disabled' | 'suspicious_activity';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

/**
 * Database user row interface (matches database schema)
 */
export interface UserRow {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  password_hash: string;
  password_salt: string;
  role: string;
  language: string;
  department?: string;
  position?: string;
  phone?: string;
  is_active: boolean;
  email_verified_at?: Date;
  email_verification_token?: string;
  email_verification_expires?: Date;
  password_reset_token?: string;
  password_reset_expires?: Date;
  last_password_change: Date;
  login_attempts: number;
  locked_until?: Date;
  two_factor_secret?: string;
  two_factor_enabled: boolean;
  last_login_at?: Date;
  last_login_ip?: string;
  current_session_id?: string;
  preferences: any; // JSONB
  security_settings: any; // JSONB
  profile: any; // JSONB
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
  created_by?: string;
  updated_by?: string;
}