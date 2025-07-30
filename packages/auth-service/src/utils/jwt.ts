// JWT utilities for Authentication Service
// Utilitários JWT para o Serviço de Autenticação

import jwt from 'jsonwebtoken';
import { Logger } from '../../../shared/src/logging/logger';

/**
 * JWT token types
 */
export enum TokenType {
  ACCESS = 'access',
  REFRESH = 'refresh',
  EMAIL_VERIFICATION = 'email_verification',
  PASSWORD_RESET = 'password_reset',
  API_KEY = 'api_key',
}

/**
 * JWT payload interface
 */
export interface JWTPayload {
  userId: string;
  email: string;
  roles: string[];
  permissions: string[];
  tokenType: TokenType;
  sessionId?: string;
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

/**
 * JWT configuration interface
 */
export interface JWTConfig {
  accessTokenSecret: string;
  refreshTokenSecret: string;
  accessTokenExpiry: string | number;
  refreshTokenExpiry: string | number;
  issuer: string;
  audience: string;
  algorithm: jwt.Algorithm;
  clockTolerance: number;
}

/**
 * Token generation options
 */
export interface TokenGenerationOptions {
  expiresIn?: string | number;
  audience?: string;
  issuer?: string;
  subject?: string;
  notBefore?: string | number;
  jwtid?: string;
  keyid?: string;
  header?: Record<string, any>;
}

/**
 * Token validation result
 */
export interface TokenValidationResult {
  isValid: boolean;
  payload?: JWTPayload;
  error?: string;
  expired?: boolean;
  notBefore?: boolean;
  audience?: boolean;
  issuer?: boolean;
  signature?: boolean;
}

/**
 * Token pair interface
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiry: Date;
  refreshTokenExpiry: Date;
  tokenType: string;
}

/**
 * Refresh token payload
 */
export interface RefreshTokenPayload {
  userId: string;
  sessionId: string;
  tokenVersion: number;
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

/**
 * Default JWT configuration
 */
const DEFAULT_CONFIG: JWTConfig = {
  accessTokenSecret: process.env.JWT_ACCESS_SECRET || 'default-access-secret-change-in-production',
  refreshTokenSecret:
    process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-change-in-production',
  accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
  refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  issuer: process.env.JWT_ISSUER || 'adms-auth-service',
  audience: process.env.JWT_AUDIENCE || 'adms-client',
  algorithm: (process.env.JWT_ALGORITHM as jwt.Algorithm) || 'HS256',
  clockTolerance: parseInt(process.env.JWT_CLOCK_TOLERANCE || '30'),
};

/**
 * JWT utility class
 */
export class JWTUtils {
  private static logger = new Logger('JWTUtils');
  private static config: JWTConfig = DEFAULT_CONFIG;

  /**
   * Configure JWT settings
   */
  static configure(config: Partial<JWTConfig>): void {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.logger.info('JWT configuration updated', {
      algorithm: this.config.algorithm,
      accessTokenExpiry: this.config.accessTokenExpiry,
      refreshTokenExpiry: this.config.refreshTokenExpiry,
      issuer: this.config.issuer,
      audience: this.config.audience,
    });
  }

  /**
   * Generate access token
   */
  static generateAccessToken(
    payload: Omit<JWTPayload, 'tokenType'>,
    options?: TokenGenerationOptions
  ): string {
    try {
      const tokenPayload: JWTPayload = {
        ...payload,
        tokenType: TokenType.ACCESS,
      };

      const signOptions: jwt.SignOptions = {
        expiresIn: options?.expiresIn || this.config.accessTokenExpiry,
        audience: options?.audience || this.config.audience,
        issuer: options?.issuer || this.config.issuer,
        subject: options?.subject || payload.userId,
        algorithm: this.config.algorithm,
        notBefore: options?.notBefore,
        jwtid: options?.jwtid,
        keyid: options?.keyid,
        header: options?.header,
      };

      const token = jwt.sign(tokenPayload, this.config.accessTokenSecret, signOptions);

      this.logger.debug('Access token generated', {
        userId: payload.userId,
        expiresIn: signOptions.expiresIn,
        algorithm: this.config.algorithm,
      });

      return token;
    } catch (error) {
      this.logger.error('Error generating access token', { error, payload });
      throw new Error('Failed to generate access token');
    }
  }

  /**
   * Generate refresh token
   */
  static generateRefreshToken(
    payload: RefreshTokenPayload,
    options?: TokenGenerationOptions
  ): string {
    try {
      const tokenPayload = {
        ...payload,
        tokenType: TokenType.REFRESH,
      };

      const signOptions: jwt.SignOptions = {
        expiresIn: options?.expiresIn || this.config.refreshTokenExpiry,
        audience: options?.audience || this.config.audience,
        issuer: options?.issuer || this.config.issuer,
        subject: options?.subject || payload.userId,
        algorithm: this.config.algorithm,
        notBefore: options?.notBefore,
        jwtid: options?.jwtid,
        keyid: options?.keyid,
        header: options?.header,
      };

      const token = jwt.sign(tokenPayload, this.config.refreshTokenSecret, signOptions);

      this.logger.debug('Refresh token generated', {
        userId: payload.userId,
        sessionId: payload.sessionId,
        expiresIn: signOptions.expiresIn,
      });

      return token;
    } catch (error) {
      this.logger.error('Error generating refresh token', { error, payload });
      throw new Error('Failed to generate refresh token');
    }
  }

  /**
   * Generate token pair (access + refresh)
   */
  static generateTokenPair(
    accessPayload: Omit<JWTPayload, 'tokenType'>,
    refreshPayload: RefreshTokenPayload,
    options?: {
      access?: TokenGenerationOptions;
      refresh?: TokenGenerationOptions;
    }
  ): TokenPair {
    try {
      const accessToken = this.generateAccessToken(accessPayload, options?.access);
      const refreshToken = this.generateRefreshToken(refreshPayload, options?.refresh);

      // Calculate expiry dates
      const accessTokenExpiry = this.getTokenExpiry(accessToken);
      const refreshTokenExpiry = this.getTokenExpiry(refreshToken);

      this.logger.info('Token pair generated', {
        userId: accessPayload.userId,
        sessionId: refreshPayload.sessionId,
        accessExpiry: accessTokenExpiry,
        refreshExpiry: refreshTokenExpiry,
      });

      return {
        accessToken,
        refreshToken,
        accessTokenExpiry,
        refreshTokenExpiry,
        tokenType: 'Bearer',
      };
    } catch (error) {
      this.logger.error('Error generating token pair', { error });
      throw new Error('Failed to generate token pair');
    }
  }

  /**
   * Validate access token
   */
  static validateAccessToken(token: string): TokenValidationResult {
    return this.validateToken(token, this.config.accessTokenSecret, TokenType.ACCESS);
  }

  /**
   * Validate refresh token
   */
  static validateRefreshToken(token: string): TokenValidationResult {
    return this.validateToken(token, this.config.refreshTokenSecret, TokenType.REFRESH);
  }

  /**
   * Generic token validation
   */
  static validateToken(
    token: string,
    secret: string,
    expectedType?: TokenType
  ): TokenValidationResult {
    try {
      if (!token || typeof token !== 'string') {
        return {
          isValid: false,
          error: 'Token is required and must be a string',
        };
      }

      // Remove Bearer prefix if present
      const cleanToken = token.replace(/^Bearer\s+/, '');

      const verifyOptions: jwt.VerifyOptions = {
        audience: this.config.audience,
        issuer: this.config.issuer,
        algorithms: [this.config.algorithm],
        clockTolerance: this.config.clockTolerance,
      };

      const decoded = jwt.verify(cleanToken, secret, verifyOptions) as JWTPayload;

      // Validate token type if specified
      if (expectedType && decoded.tokenType !== expectedType) {
        return {
          isValid: false,
          error: `Invalid token type. Expected ${expectedType}, got ${decoded.tokenType}`,
        };
      }

      this.logger.debug('Token validated successfully', {
        userId: decoded.userId,
        tokenType: decoded.tokenType,
        expiresAt: decoded.exp,
      });

      return {
        isValid: true,
        payload: decoded,
      };
    } catch (error) {
      this.logger.warn('Token validation failed', { error: error.message });

      const result: TokenValidationResult = {
        isValid: false,
        error: error.message,
      };

      // Categorize specific JWT errors
      if (error instanceof jwt.TokenExpiredError) {
        result.expired = true;
        result.error = 'Token has expired';
      } else if (error instanceof jwt.NotBeforeError) {
        result.notBefore = true;
        result.error = 'Token not active yet';
      } else if (error instanceof jwt.JsonWebTokenError) {
        if (error.message.includes('audience')) {
          result.audience = true;
          result.error = 'Invalid token audience';
        } else if (error.message.includes('issuer')) {
          result.issuer = true;
          result.error = 'Invalid token issuer';
        } else if (error.message.includes('signature')) {
          result.signature = true;
          result.error = 'Invalid token signature';
        } else {
          result.error = 'Invalid token format';
        }
      }

      return result;
    }
  }

  /**
   * Decode token without verification (for inspection)
   */
  static decodeToken(token: string): JWTPayload | null {
    try {
      const cleanToken = token.replace(/^Bearer\s+/, '');
      const decoded = jwt.decode(cleanToken) as JWTPayload;
      return decoded;
    } catch (error) {
      this.logger.warn('Error decoding token', { error });
      return null;
    }
  }

  /**
   * Get token expiry date
   */
  static getTokenExpiry(token: string): Date {
    try {
      const decoded = this.decodeToken(token);
      if (decoded && decoded.exp) {
        return new Date(decoded.exp * 1000);
      }
      throw new Error('Token does not have expiry information');
    } catch (error) {
      this.logger.error('Error getting token expiry', { error });
      throw new Error('Failed to get token expiry');
    }
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(token: string): boolean {
    try {
      const expiry = this.getTokenExpiry(token);
      return expiry < new Date();
    } catch (error) {
      return true; // Assume expired if we can't determine
    }
  }

  /**
   * Get time until token expires
   */
  static getTimeUntilExpiry(token: string): number {
    try {
      const expiry = this.getTokenExpiry(token);
      const now = new Date();
      return Math.max(0, expiry.getTime() - now.getTime());
    } catch (error) {
      return 0;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshAccessToken(
    refreshToken: string,
    newAccessPayload: Omit<JWTPayload, 'tokenType'>,
    options?: TokenGenerationOptions
  ): Promise<{ accessToken: string; accessTokenExpiry: Date }> {
    try {
      // Validate refresh token
      const validation = this.validateRefreshToken(refreshToken);
      if (!validation.isValid) {
        throw new Error(`Invalid refresh token: ${validation.error}`);
      }

      // Generate new access token
      const accessToken = this.generateAccessToken(newAccessPayload, options);
      const accessTokenExpiry = this.getTokenExpiry(accessToken);

      this.logger.info('Access token refreshed', {
        userId: newAccessPayload.userId,
        newExpiry: accessTokenExpiry,
      });

      return {
        accessToken,
        accessTokenExpiry,
      };
    } catch (error) {
      this.logger.error('Error refreshing access token', { error });
      throw new Error('Failed to refresh access token');
    }
  }

  /**
   * Generate special purpose token (email verification, password reset, etc.)
   */
  static generateSpecialToken(
    payload: {
      userId: string;
      email: string;
      purpose: string;
      metadata?: Record<string, any>;
    },
    tokenType: TokenType,
    expiresIn: string | number = '1h'
  ): string {
    try {
      const tokenPayload = {
        userId: payload.userId,
        email: payload.email,
        roles: [],
        permissions: [],
        tokenType,
        metadata: {
          purpose: payload.purpose,
          ...payload.metadata,
        },
      };

      const signOptions: jwt.SignOptions = {
        expiresIn,
        audience: this.config.audience,
        issuer: this.config.issuer,
        subject: payload.userId,
        algorithm: this.config.algorithm,
      };

      const token = jwt.sign(tokenPayload, this.config.accessTokenSecret, signOptions);

      this.logger.debug('Special token generated', {
        userId: payload.userId,
        tokenType,
        purpose: payload.purpose,
        expiresIn,
      });

      return token;
    } catch (error) {
      this.logger.error('Error generating special token', { error, payload });
      throw new Error('Failed to generate special token');
    }
  }

  /**
   * Blacklist token (for logout)
   */
  static async blacklistToken(token: string, reason: string = 'logout'): Promise<void> {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded) {
        throw new Error('Invalid token format');
      }

      // In a real implementation, you would store this in Redis or database
      // For now, we'll just log it
      this.logger.info('Token blacklisted', {
        userId: decoded.userId,
        tokenType: decoded.tokenType,
        jti: decoded.jti,
        reason,
        expiresAt: decoded.exp ? new Date(decoded.exp * 1000) : null,
      });

      // TODO: Implement actual blacklist storage
      // await this.storeBlacklistedToken(token, decoded, reason);
    } catch (error) {
      this.logger.error('Error blacklisting token', { error });
      throw new Error('Failed to blacklist token');
    }
  }

  /**
   * Check if token is blacklisted
   */
  static async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      // TODO: Implement actual blacklist check
      // For now, always return false
      return false;
    } catch (error) {
      this.logger.error('Error checking token blacklist', { error });
      return true; // Assume blacklisted on error for security
    }
  }

  /**
   * Get token metadata
   */
  static getTokenMetadata(token: string): {
    header: jwt.JwtHeader | null;
    payload: JWTPayload | null;
    signature: string | null;
  } {
    try {
      const cleanToken = token.replace(/^Bearer\s+/, '');
      const parts = cleanToken.split('.');

      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }

      const header = jwt.decode(cleanToken, { complete: true })?.header || null;
      const payload = (jwt.decode(cleanToken) as JWTPayload) || null;
      const signature = parts[2];

      return { header, payload, signature };
    } catch (error) {
      this.logger.warn('Error getting token metadata', { error });
      return { header: null, payload: null, signature: null };
    }
  }

  /**
   * Validate token format without verification
   */
  static isValidTokenFormat(token: string): boolean {
    try {
      const cleanToken = token.replace(/^Bearer\s+/, '');
      const parts = cleanToken.split('.');
      return parts.length === 3 && parts.every(part => part.length > 0);
    } catch (error) {
      return false;
    }
  }

  /**
   * Get current configuration (for debugging)
   */
  static getConfig(): Partial<JWTConfig> {
    return {
      accessTokenExpiry: this.config.accessTokenExpiry,
      refreshTokenExpiry: this.config.refreshTokenExpiry,
      issuer: this.config.issuer,
      audience: this.config.audience,
      algorithm: this.config.algorithm,
      clockTolerance: this.config.clockTolerance,
    };
  }
}

/**
 * Convenience functions for common operations
 */

/**
 * Generate access token
 */
export const generateAccessToken = (
  payload: Omit<JWTPayload, 'tokenType'>,
  options?: TokenGenerationOptions
): string => {
  return JWTUtils.generateAccessToken(payload, options);
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (
  payload: RefreshTokenPayload,
  options?: TokenGenerationOptions
): string => {
  return JWTUtils.generateRefreshToken(payload, options);
};

/**
 * Generate token pair
 */
export const generateTokenPair = (
  accessPayload: Omit<JWTPayload, 'tokenType'>,
  refreshPayload: RefreshTokenPayload,
  options?: { access?: TokenGenerationOptions; refresh?: TokenGenerationOptions }
): TokenPair => {
  return JWTUtils.generateTokenPair(accessPayload, refreshPayload, options);
};

/**
 * Validate access token
 */
export const validateAccessToken = (token: string): TokenValidationResult => {
  return JWTUtils.validateAccessToken(token);
};

/**
 * Validate refresh token
 */
export const validateRefreshToken = (token: string): TokenValidationResult => {
  return JWTUtils.validateRefreshToken(token);
};

/**
 * Decode token without verification
 */
export const decodeToken = (token: string): JWTPayload | null => {
  return JWTUtils.decodeToken(token);
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  return JWTUtils.isTokenExpired(token);
};

/**
 * Export types and classes
 */
export type { JWTConfig, TokenGenerationOptions };
export { JWTUtils };
