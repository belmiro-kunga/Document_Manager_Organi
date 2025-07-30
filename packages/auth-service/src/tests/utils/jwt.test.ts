// JWT utilities tests for Authentication Service
// Testes dos utilitários JWT para o Serviço de Autenticação

import jwt from 'jsonwebtoken';
import {
  JWTUtils,
  TokenType,
  JWTPayload,
  RefreshTokenPayload,
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  validateAccessToken,
  validateRefreshToken,
  decodeToken,
  isTokenExpired,
} from '../../utils/jwt';

describe('JWTUtils', () => {
  const mockAccessPayload: Omit<JWTPayload, 'tokenType'> = {
    userId: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    roles: ['user'],
    permissions: ['read:documents'],
    sessionId: 'session-123',
    deviceId: 'device-123',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0...',
  };

  const mockRefreshPayload: RefreshTokenPayload = {
    userId: '123e4567-e89b-12d3-a456-426614174000',
    sessionId: 'session-123',
    tokenVersion: 1,
    deviceId: 'device-123',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0...',
    createdAt: new Date(),
  };

  beforeEach(() => {
    // Reset to default configuration before each test
    JWTUtils.configure({});
  });

  describe('configure', () => {
    it('should update configuration correctly', () => {
      const customConfig = {
        accessTokenExpiry: '30m',
        refreshTokenExpiry: '14d',
        issuer: 'test-issuer',
        audience: 'test-audience',
      };

      JWTUtils.configure(customConfig);
      const config = JWTUtils.getConfig();

      expect(config.accessTokenExpiry).toBe('30m');
      expect(config.refreshTokenExpiry).toBe('14d');
      expect(config.issuer).toBe('test-issuer');
      expect(config.audience).toBe('test-audience');
    });

    it('should merge with default configuration', () => {
      JWTUtils.configure({ accessTokenExpiry: '1h' });
      const config = JWTUtils.getConfig();

      expect(config.accessTokenExpiry).toBe('1h');
      expect(config.issuer).toBeDefined(); // Should keep default
      expect(config.audience).toBeDefined(); // Should keep default
    });
  });

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = JWTUtils.generateAccessToken(mockAccessPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT format
    });

    it('should include correct payload in token', () => {
      const token = JWTUtils.generateAccessToken(mockAccessPayload);
      const decoded = JWTUtils.decodeToken(token);

      expect(decoded).toBeDefined();
      expect(decoded!.userId).toBe(mockAccessPayload.userId);
      expect(decoded!.email).toBe(mockAccessPayload.email);
      expect(decoded!.roles).toEqual(mockAccessPayload.roles);
      expect(decoded!.permissions).toEqual(mockAccessPayload.permissions);
      expect(decoded!.tokenType).toBe(TokenType.ACCESS);
    });

    it('should respect custom expiration', () => {
      const token = JWTUtils.generateAccessToken(mockAccessPayload, { expiresIn: '1h' });
      const decoded = JWTUtils.decodeToken(token);

      expect(decoded).toBeDefined();
      expect(decoded!.exp).toBeDefined();

      // Token should expire in approximately 1 hour
      const expiryTime = new Date(decoded!.exp! * 1000);
      const expectedExpiry = new Date(Date.now() + 60 * 60 * 1000);
      const timeDiff = Math.abs(expiryTime.getTime() - expectedExpiry.getTime());

      expect(timeDiff).toBeLessThan(5000); // Within 5 seconds
    });

    it('should handle custom options', () => {
      const options = {
        audience: 'custom-audience',
        issuer: 'custom-issuer',
        subject: 'custom-subject',
        jwtid: 'custom-jti',
      };

      const token = JWTUtils.generateAccessToken(mockAccessPayload, options);
      const decoded = jwt.decode(token, { complete: true });

      expect(decoded).toBeDefined();
      expect(decoded!.payload.aud).toBe('custom-audience');
      expect(decoded!.payload.iss).toBe('custom-issuer');
      expect(decoded!.payload.sub).toBe('custom-subject');
      expect(decoded!.payload.jti).toBe('custom-jti');
    });

    it('should throw error for invalid payload', () => {
      expect(() => {
        JWTUtils.generateAccessToken(null as any);
      }).toThrow('Failed to generate access token');
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = JWTUtils.generateRefreshToken(mockRefreshPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include correct payload in refresh token', () => {
      const token = JWTUtils.generateRefreshToken(mockRefreshPayload);
      const decoded = JWTUtils.decodeToken(token);

      expect(decoded).toBeDefined();
      expect(decoded!.userId).toBe(mockRefreshPayload.userId);
      expect(decoded!.sessionId).toBe(mockRefreshPayload.sessionId);
      expect(decoded!.tokenType).toBe(TokenType.REFRESH);
    });

    it('should have longer expiry than access token by default', () => {
      const accessToken = JWTUtils.generateAccessToken(mockAccessPayload);
      const refreshToken = JWTUtils.generateRefreshToken(mockRefreshPayload);

      const accessDecoded = JWTUtils.decodeToken(accessToken);
      const refreshDecoded = JWTUtils.decodeToken(refreshToken);

      expect(refreshDecoded!.exp!).toBeGreaterThan(accessDecoded!.exp!);
    });
  });

  describe('generateTokenPair', () => {
    it('should generate both access and refresh tokens', () => {
      const tokenPair = JWTUtils.generateTokenPair(mockAccessPayload, mockRefreshPayload);

      expect(tokenPair.accessToken).toBeDefined();
      expect(tokenPair.refreshToken).toBeDefined();
      expect(tokenPair.accessTokenExpiry).toBeInstanceOf(Date);
      expect(tokenPair.refreshTokenExpiry).toBeInstanceOf(Date);
      expect(tokenPair.tokenType).toBe('Bearer');
    });

    it('should have refresh token expiry after access token expiry', () => {
      const tokenPair = JWTUtils.generateTokenPair(mockAccessPayload, mockRefreshPayload);

      expect(tokenPair.refreshTokenExpiry.getTime()).toBeGreaterThan(
        tokenPair.accessTokenExpiry.getTime()
      );
    });

    it('should respect custom options for both tokens', () => {
      const options = {
        access: { expiresIn: '30m' },
        refresh: { expiresIn: '30d' },
      };

      const tokenPair = JWTUtils.generateTokenPair(mockAccessPayload, mockRefreshPayload, options);

      expect(tokenPair.accessToken).toBeDefined();
      expect(tokenPair.refreshToken).toBeDefined();
    });
  });

  describe('validateAccessToken', () => {
    it('should validate a valid access token', () => {
      const token = JWTUtils.generateAccessToken(mockAccessPayload);
      const result = JWTUtils.validateAccessToken(token);

      expect(result.isValid).toBe(true);
      expect(result.payload).toBeDefined();
      expect(result.payload!.userId).toBe(mockAccessPayload.userId);
      expect(result.payload!.tokenType).toBe(TokenType.ACCESS);
      expect(result.error).toBeUndefined();
    });

    it('should reject invalid token', () => {
      const result = JWTUtils.validateAccessToken('invalid-token');

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.payload).toBeUndefined();
    });

    it('should reject empty token', () => {
      const result = JWTUtils.validateAccessToken('');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Token is required and must be a string');
    });

    it('should reject null token', () => {
      const result = JWTUtils.validateAccessToken(null as any);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Token is required and must be a string');
    });

    it('should handle Bearer prefix', () => {
      const token = JWTUtils.generateAccessToken(mockAccessPayload);
      const bearerToken = `Bearer ${token}`;
      const result = JWTUtils.validateAccessToken(bearerToken);

      expect(result.isValid).toBe(true);
      expect(result.payload).toBeDefined();
    });

    it('should detect expired token', () => {
      const expiredToken = JWTUtils.generateAccessToken(mockAccessPayload, { expiresIn: '-1s' });
      const result = JWTUtils.validateAccessToken(expiredToken);

      expect(result.isValid).toBe(false);
      expect(result.expired).toBe(true);
      expect(result.error).toBe('Token has expired');
    });

    it('should reject refresh token when validating access token', () => {
      const refreshToken = JWTUtils.generateRefreshToken(mockRefreshPayload);
      const result = JWTUtils.validateAccessToken(refreshToken);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid token type');
    });
  });

  describe('validateRefreshToken', () => {
    it('should validate a valid refresh token', () => {
      const token = JWTUtils.generateRefreshToken(mockRefreshPayload);
      const result = JWTUtils.validateRefreshToken(token);

      expect(result.isValid).toBe(true);
      expect(result.payload).toBeDefined();
      expect(result.payload!.userId).toBe(mockRefreshPayload.userId);
      expect(result.payload!.tokenType).toBe(TokenType.REFRESH);
    });

    it('should reject access token when validating refresh token', () => {
      const accessToken = JWTUtils.generateAccessToken(mockAccessPayload);
      const result = JWTUtils.validateRefreshToken(accessToken);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid token type');
    });
  });

  describe('validateToken', () => {
    it('should validate token with correct secret and type', () => {
      const token = JWTUtils.generateAccessToken(mockAccessPayload);
      const config = JWTUtils.getConfig();

      // We need to access the private method through the class
      const result = JWTUtils.validateToken(
        token,
        process.env.JWT_ACCESS_SECRET || 'default-access-secret-change-in-production',
        TokenType.ACCESS
      );

      expect(result.isValid).toBe(true);
    });

    it('should categorize JWT errors correctly', () => {
      // Test with wrong secret
      const token = JWTUtils.generateAccessToken(mockAccessPayload);
      const result = JWTUtils.validateToken(token, 'wrong-secret');

      expect(result.isValid).toBe(false);
      expect(result.signature).toBe(true);
      expect(result.error).toBe('Invalid token signature');
    });
  });

  describe('decodeToken', () => {
    it('should decode token without verification', () => {
      const token = JWTUtils.generateAccessToken(mockAccessPayload);
      const decoded = JWTUtils.decodeToken(token);

      expect(decoded).toBeDefined();
      expect(decoded!.userId).toBe(mockAccessPayload.userId);
      expect(decoded!.email).toBe(mockAccessPayload.email);
      expect(decoded!.tokenType).toBe(TokenType.ACCESS);
    });

    it('should handle Bearer prefix when decoding', () => {
      const token = JWTUtils.generateAccessToken(mockAccessPayload);
      const bearerToken = `Bearer ${token}`;
      const decoded = JWTUtils.decodeToken(bearerToken);

      expect(decoded).toBeDefined();
      expect(decoded!.userId).toBe(mockAccessPayload.userId);
    });

    it('should return null for invalid token', () => {
      const decoded = JWTUtils.decodeToken('invalid-token');

      expect(decoded).toBeNull();
    });

    it('should return null for empty token', () => {
      const decoded = JWTUtils.decodeToken('');

      expect(decoded).toBeNull();
    });
  });

  describe('getTokenExpiry', () => {
    it('should return correct expiry date', () => {
      const token = JWTUtils.generateAccessToken(mockAccessPayload, { expiresIn: '1h' });
      const expiry = JWTUtils.getTokenExpiry(token);

      expect(expiry).toBeInstanceOf(Date);

      // Should be approximately 1 hour from now
      const expectedExpiry = new Date(Date.now() + 60 * 60 * 1000);
      const timeDiff = Math.abs(expiry.getTime() - expectedExpiry.getTime());

      expect(timeDiff).toBeLessThan(5000); // Within 5 seconds
    });

    it('should throw error for token without expiry', () => {
      expect(() => {
        JWTUtils.getTokenExpiry('invalid-token');
      }).toThrow('Failed to get token expiry');
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for valid token', () => {
      const token = JWTUtils.generateAccessToken(mockAccessPayload, { expiresIn: '1h' });
      const isExpired = JWTUtils.isTokenExpired(token);

      expect(isExpired).toBe(false);
    });

    it('should return true for expired token', () => {
      const token = JWTUtils.generateAccessToken(mockAccessPayload, { expiresIn: '-1s' });
      const isExpired = JWTUtils.isTokenExpired(token);

      expect(isExpired).toBe(true);
    });

    it('should return true for invalid token', () => {
      const isExpired = JWTUtils.isTokenExpired('invalid-token');

      expect(isExpired).toBe(true);
    });
  });

  describe('getTimeUntilExpiry', () => {
    it('should return positive time for valid token', () => {
      const token = JWTUtils.generateAccessToken(mockAccessPayload, { expiresIn: '1h' });
      const timeUntilExpiry = JWTUtils.getTimeUntilExpiry(token);

      expect(timeUntilExpiry).toBeGreaterThan(0);
      expect(timeUntilExpiry).toBeLessThanOrEqual(60 * 60 * 1000); // Less than or equal to 1 hour in ms
    });

    it('should return 0 for expired token', () => {
      const token = JWTUtils.generateAccessToken(mockAccessPayload, { expiresIn: '-1s' });
      const timeUntilExpiry = JWTUtils.getTimeUntilExpiry(token);

      expect(timeUntilExpiry).toBe(0);
    });

    it('should return 0 for invalid token', () => {
      const timeUntilExpiry = JWTUtils.getTimeUntilExpiry('invalid-token');

      expect(timeUntilExpiry).toBe(0);
    });
  });

  describe('refreshAccessToken', () => {
    it('should generate new access token from valid refresh token', async () => {
      const refreshToken = JWTUtils.generateRefreshToken(mockRefreshPayload);
      const newAccessPayload = {
        ...mockAccessPayload,
        permissions: ['read:documents', 'write:documents'],
      };

      const result = await JWTUtils.refreshAccessToken(refreshToken, newAccessPayload);

      expect(result.accessToken).toBeDefined();
      expect(result.accessTokenExpiry).toBeInstanceOf(Date);

      // Verify new token has updated permissions
      const decoded = JWTUtils.decodeToken(result.accessToken);
      expect(decoded!.permissions).toEqual(['read:documents', 'write:documents']);
    });

    it('should reject invalid refresh token', async () => {
      const newAccessPayload = { ...mockAccessPayload };

      await expect(JWTUtils.refreshAccessToken('invalid-token', newAccessPayload)).rejects.toThrow(
        'Failed to refresh access token'
      );
    });

    it('should reject expired refresh token', async () => {
      const expiredRefreshToken = JWTUtils.generateRefreshToken(mockRefreshPayload, {
        expiresIn: '-1s',
      });
      const newAccessPayload = { ...mockAccessPayload };

      await expect(
        JWTUtils.refreshAccessToken(expiredRefreshToken, newAccessPayload)
      ).rejects.toThrow('Failed to refresh access token');
    });
  });

  describe('generateSpecialToken', () => {
    it('should generate email verification token', () => {
      const payload = {
        userId: mockAccessPayload.userId,
        email: mockAccessPayload.email,
        purpose: 'email-verification',
      };

      const token = JWTUtils.generateSpecialToken(payload, TokenType.EMAIL_VERIFICATION, '24h');
      const decoded = JWTUtils.decodeToken(token);

      expect(decoded).toBeDefined();
      expect(decoded!.tokenType).toBe(TokenType.EMAIL_VERIFICATION);
      expect(decoded!.metadata?.purpose).toBe('email-verification');
    });

    it('should generate password reset token', () => {
      const payload = {
        userId: mockAccessPayload.userId,
        email: mockAccessPayload.email,
        purpose: 'password-reset',
        metadata: { requestId: 'req-123' },
      };

      const token = JWTUtils.generateSpecialToken(payload, TokenType.PASSWORD_RESET, '1h');
      const decoded = JWTUtils.decodeToken(token);

      expect(decoded).toBeDefined();
      expect(decoded!.tokenType).toBe(TokenType.PASSWORD_RESET);
      expect(decoded!.metadata?.purpose).toBe('password-reset');
      expect(decoded!.metadata?.requestId).toBe('req-123');
    });
  });

  describe('blacklistToken', () => {
    it('should blacklist token successfully', async () => {
      const token = JWTUtils.generateAccessToken(mockAccessPayload);

      // Should not throw
      await expect(JWTUtils.blacklistToken(token, 'logout')).resolves.not.toThrow();
    });

    it('should handle invalid token gracefully', async () => {
      await expect(JWTUtils.blacklistToken('invalid-token')).rejects.toThrow(
        'Failed to blacklist token'
      );
    });
  });

  describe('isTokenBlacklisted', () => {
    it('should return false for non-blacklisted token', async () => {
      const token = JWTUtils.generateAccessToken(mockAccessPayload);
      const isBlacklisted = await JWTUtils.isTokenBlacklisted(token);

      expect(isBlacklisted).toBe(false);
    });
  });

  describe('getTokenMetadata', () => {
    it('should return token metadata', () => {
      const token = JWTUtils.generateAccessToken(mockAccessPayload);
      const metadata = JWTUtils.getTokenMetadata(token);

      expect(metadata.header).toBeDefined();
      expect(metadata.payload).toBeDefined();
      expect(metadata.signature).toBeDefined();
      expect(metadata.header!.alg).toBeDefined();
      expect(metadata.payload!.userId).toBe(mockAccessPayload.userId);
    });

    it('should handle invalid token', () => {
      const metadata = JWTUtils.getTokenMetadata('invalid-token');

      expect(metadata.header).toBeNull();
      expect(metadata.payload).toBeNull();
      expect(metadata.signature).toBeNull();
    });
  });

  describe('isValidTokenFormat', () => {
    it('should return true for valid JWT format', () => {
      const token = JWTUtils.generateAccessToken(mockAccessPayload);
      const isValid = JWTUtils.isValidTokenFormat(token);

      expect(isValid).toBe(true);
    });

    it('should return true for valid JWT format with Bearer prefix', () => {
      const token = JWTUtils.generateAccessToken(mockAccessPayload);
      const bearerToken = `Bearer ${token}`;
      const isValid = JWTUtils.isValidTokenFormat(bearerToken);

      expect(isValid).toBe(true);
    });

    it('should return false for invalid format', () => {
      expect(JWTUtils.isValidTokenFormat('invalid-token')).toBe(false);
      expect(JWTUtils.isValidTokenFormat('part1.part2')).toBe(false);
      expect(JWTUtils.isValidTokenFormat('part1..part3')).toBe(false);
      expect(JWTUtils.isValidTokenFormat('')).toBe(false);
    });
  });

  describe('convenience functions', () => {
    it('should work with generateAccessToken function', () => {
      const token = generateAccessToken(mockAccessPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should work with generateRefreshToken function', () => {
      const token = generateRefreshToken(mockRefreshPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should work with generateTokenPair function', () => {
      const tokenPair = generateTokenPair(mockAccessPayload, mockRefreshPayload);

      expect(tokenPair.accessToken).toBeDefined();
      expect(tokenPair.refreshToken).toBeDefined();
    });

    it('should work with validateAccessToken function', () => {
      const token = generateAccessToken(mockAccessPayload);
      const result = validateAccessToken(token);

      expect(result.isValid).toBe(true);
    });

    it('should work with validateRefreshToken function', () => {
      const token = generateRefreshToken(mockRefreshPayload);
      const result = validateRefreshToken(token);

      expect(result.isValid).toBe(true);
    });

    it('should work with decodeToken function', () => {
      const token = generateAccessToken(mockAccessPayload);
      const decoded = decodeToken(token);

      expect(decoded).toBeDefined();
      expect(decoded!.userId).toBe(mockAccessPayload.userId);
    });

    it('should work with isTokenExpired function', () => {
      const token = generateAccessToken(mockAccessPayload);
      const expired = isTokenExpired(token);

      expect(expired).toBe(false);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle concurrent token generation', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        JWTUtils.generateAccessToken({
          ...mockAccessPayload,
          userId: `user-${i}`,
        })
      );

      const tokens = await Promise.all(promises);

      expect(tokens).toHaveLength(10);
      tokens.forEach(token => {
        expect(token).toBeDefined();
        expect(typeof token).toBe('string');
      });

      // All tokens should be different
      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).toBe(10);
    });

    it('should handle very short expiry times', () => {
      const token = JWTUtils.generateAccessToken(mockAccessPayload, { expiresIn: '1ms' });

      expect(token).toBeDefined();

      // Wait a bit and check if expired
      setTimeout(() => {
        expect(JWTUtils.isTokenExpired(token)).toBe(true);
      }, 10);
    });

    it('should handle very long expiry times', () => {
      const token = JWTUtils.generateAccessToken(mockAccessPayload, { expiresIn: '100y' });
      const decoded = JWTUtils.decodeToken(token);

      expect(decoded).toBeDefined();
      expect(JWTUtils.isTokenExpired(token)).toBe(false);
    });

    it('should handle tokens with special characters in payload', () => {
      const specialPayload = {
        ...mockAccessPayload,
        email: 'test+special@example.com',
        metadata: {
          specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
          unicode: 'Olá, 世界, مرحبا',
        },
      };

      const token = JWTUtils.generateAccessToken(specialPayload);
      const decoded = JWTUtils.decodeToken(token);

      expect(decoded).toBeDefined();
      expect(decoded!.email).toBe('test+special@example.com');
      expect(decoded!.metadata?.specialChars).toBe('!@#$%^&*()_+-=[]{}|;:,.<>?');
      expect(decoded!.metadata?.unicode).toBe('Olá, 世界, مرحبا');
    });

    it('should handle empty arrays and objects in payload', () => {
      const emptyPayload = {
        ...mockAccessPayload,
        roles: [],
        permissions: [],
        metadata: {},
      };

      const token = JWTUtils.generateAccessToken(emptyPayload);
      const decoded = JWTUtils.decodeToken(token);

      expect(decoded).toBeDefined();
      expect(decoded!.roles).toEqual([]);
      expect(decoded!.permissions).toEqual([]);
      expect(decoded!.metadata).toEqual({});
    });
  });
});
