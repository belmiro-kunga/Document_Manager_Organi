// JWT Authentication Middleware for Authentication Service
// Middleware de Autenticação JWT para o Serviço de Autenticação

import { Request, Response, NextFunction } from 'express';
import { JWTUtils, JWTPayload, TokenType } from '../utils/jwt';
import { Logger } from '../../../shared/src/logging/logger';

/**
 * Extended Request interface with user information
 */
export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
  token?: string;
  sessionId?: string;
}

/**
 * JWT Authentication options
 */
export interface JWTAuthOptions {
  required?: boolean;
  tokenType?: TokenType;
  roles?: string[];
  permissions?: string[];
  skipBlacklistCheck?: boolean;
}

/**
 * Logger instance
 */
const logger = new Logger('JWTAuthMiddleware');

/**
 * JWT Authentication Middleware
 */
export const jwtAuth = (options: JWTAuthOptions = {}) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const {
        required = true,
        tokenType = TokenType.ACCESS,
        roles = [],
        permissions = [],
        skipBlacklistCheck = false,
      } = options;

      // Extract token from Authorization header
      const authHeader = req.headers.authorization;
      let token: string | undefined;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }

      // If no token and not required, continue
      if (!token && !required) {
        return next();
      }

      // If no token and required, return error
      if (!token && required) {
        logger.warn('Missing authorization token', {
          path: req.path,
          method: req.method,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
        });

        return res.status(401).json({
          success: false,
          error: 'MISSING_TOKEN',
          message: 'Token de autorização é obrigatório',
          code: 'AUTH_001',
        });
      }

      // Validate token format
      if (token && !JWTUtils.isValidTokenFormat(token)) {
        logger.warn('Invalid token format', {
          path: req.path,
          method: req.method,
          ip: req.ip,
        });

        return res.status(401).json({
          success: false,
          error: 'INVALID_TOKEN_FORMAT',
          message: 'Formato de token inválido',
          code: 'AUTH_002',
        });
      }

      // Validate token
      const validation =
        tokenType === TokenType.ACCESS
          ? JWTUtils.validateAccessToken(token!)
          : JWTUtils.validateRefreshToken(token!);

      if (!validation.isValid) {
        logger.warn('Token validation failed', {
          error: validation.error,
          expired: validation.expired,
          path: req.path,
          method: req.method,
          ip: req.ip,
        });

        // Return specific error based on validation result
        if (validation.expired) {
          return res.status(401).json({
            success: false,
            error: 'TOKEN_EXPIRED',
            message: 'Token expirado',
            code: 'AUTH_003',
          });
        }

        if (validation.signature) {
          return res.status(401).json({
            success: false,
            error: 'INVALID_SIGNATURE',
            message: 'Assinatura do token inválida',
            code: 'AUTH_004',
          });
        }

        return res.status(401).json({
          success: false,
          error: 'INVALID_TOKEN',
          message: validation.error || 'Token inválido',
          code: 'AUTH_005',
        });
      }

      // Check if token is blacklisted (if not skipped)
      if (!skipBlacklistCheck && (await JWTUtils.isTokenBlacklisted(token!))) {
        logger.warn('Blacklisted token used', {
          userId: validation.payload?.userId,
          path: req.path,
          method: req.method,
          ip: req.ip,
        });

        return res.status(401).json({
          success: false,
          error: 'TOKEN_BLACKLISTED',
          message: 'Token foi revogado',
          code: 'AUTH_006',
        });
      }

      // Check role requirements
      if (roles.length > 0 && validation.payload) {
        const userRoles = validation.payload.roles || [];
        const hasRequiredRole = roles.some(role => userRoles.includes(role));

        if (!hasRequiredRole) {
          logger.warn('Insufficient role permissions', {
            userId: validation.payload.userId,
            userRoles,
            requiredRoles: roles,
            path: req.path,
            method: req.method,
          });

          return res.status(403).json({
            success: false,
            error: 'INSUFFICIENT_ROLE',
            message: 'Permissões de função insuficientes',
            code: 'AUTH_007',
            details: {
              required: roles,
              current: userRoles,
            },
          });
        }
      }

      // Check permission requirements
      if (permissions.length > 0 && validation.payload) {
        const userPermissions = validation.payload.permissions || [];
        const hasRequiredPermission = permissions.some(permission =>
          userPermissions.includes(permission)
        );

        if (!hasRequiredPermission) {
          logger.warn('Insufficient permissions', {
            userId: validation.payload.userId,
            userPermissions,
            requiredPermissions: permissions,
            path: req.path,
            method: req.method,
          });

          return res.status(403).json({
            success: false,
            error: 'INSUFFICIENT_PERMISSIONS',
            message: 'Permissões insuficientes',
            code: 'AUTH_008',
            details: {
              required: permissions,
              current: userPermissions,
            },
          });
        }
      }

      // Attach user information to request
      req.user = validation.payload!;
      req.token = token;
      req.sessionId = validation.payload!.sessionId;

      logger.debug('Authentication successful', {
        userId: validation.payload!.userId,
        email: validation.payload!.email,
        roles: validation.payload!.roles,
        permissions: validation.payload!.permissions,
        path: req.path,
        method: req.method,
      });

      next();
    } catch (error) {
      logger.error('JWT authentication middleware error', {
        error: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method,
        ip: req.ip,
      });

      return res.status(500).json({
        success: false,
        error: 'AUTHENTICATION_ERROR',
        message: 'Erro interno de autenticação',
        code: 'AUTH_009',
      });
    }
  };
};

/**
 * Require authentication (shorthand)
 */
export const requireAuth = jwtAuth({ required: true });

/**
 * Optional authentication (shorthand)
 */
export const optionalAuth = jwtAuth({ required: false });

/**
 * Require specific roles
 */
export const requireRoles = (...roles: string[]) =>
  jwtAuth({
    required: true,
    roles,
  });

/**
 * Require specific permissions
 */
export const requirePermissions = (...permissions: string[]) =>
  jwtAuth({
    required: true,
    permissions,
  });

/**
 * Require admin role
 */
export const requireAdmin = requireRoles('admin');

/**
 * Require user role or higher
 */
export const requireUser = requireRoles('user', 'admin', 'moderator');

/**
 * Refresh token authentication
 */
export const requireRefreshToken = jwtAuth({
  required: true,
  tokenType: TokenType.REFRESH,
});

/**
 * Extract user ID from token (utility function)
 */
export const extractUserId = (req: AuthenticatedRequest): string | null => {
  return req.user?.userId || null;
};

/**
 * Extract user email from token (utility function)
 */
export const extractUserEmail = (req: AuthenticatedRequest): string | null => {
  return req.user?.email || null;
};

/**
 * Check if user has role (utility function)
 */
export const hasRole = (req: AuthenticatedRequest, role: string): boolean => {
  return req.user?.roles?.includes(role) || false;
};

/**
 * Check if user has permission (utility function)
 */
export const hasPermission = (req: AuthenticatedRequest, permission: string): boolean => {
  return req.user?.permissions?.includes(permission) || false;
};

/**
 * Check if user has any of the specified roles (utility function)
 */
export const hasAnyRole = (req: AuthenticatedRequest, roles: string[]): boolean => {
  if (!req.user?.roles) return false;
  return roles.some(role => req.user!.roles.includes(role));
};

/**
 * Check if user has any of the specified permissions (utility function)
 */
export const hasAnyPermission = (req: AuthenticatedRequest, permissions: string[]): boolean => {
  if (!req.user?.permissions) return false;
  return permissions.some(permission => req.user!.permissions.includes(permission));
};

/**
 * Get user context from request (utility function)
 */
export const getUserContext = (req: AuthenticatedRequest) => {
  if (!req.user) return null;

  return {
    userId: req.user.userId,
    email: req.user.email,
    roles: req.user.roles,
    permissions: req.user.permissions,
    sessionId: req.user.sessionId,
    deviceId: req.user.deviceId,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
  };
};

/**
 * Middleware to log authenticated requests
 */
export const logAuthenticatedRequest = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user) {
    logger.info('Authenticated request', {
      userId: req.user.userId,
      email: req.user.email,
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      sessionId: req.user.sessionId,
    });
  }
  next();
};

/**
 * Export types
 */
export type { AuthenticatedRequest, JWTAuthOptions };
