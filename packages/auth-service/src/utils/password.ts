// Password utilities for Authentication Service
// Utilitários de senha para o Serviço de Autenticação

import bcrypt from 'bcryptjs';
import { Logger } from '../../../shared/src/logging/logger';

/**
 * Password strength levels
 */
export enum PasswordStrength {
  VERY_WEAK = 'very_weak',
  WEAK = 'weak',
  FAIR = 'fair',
  GOOD = 'good',
  STRONG = 'strong',
}

/**
 * Password validation result
 */
export interface PasswordValidationResult {
  isValid: boolean;
  strength: PasswordStrength;
  score: number; // 0-100
  errors: string[];
  suggestions: string[];
}

/**
 * Password hashing configuration
 */
export interface PasswordHashConfig {
  saltRounds: number;
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  preventCommonPasswords: boolean;
}

/**
 * Default password configuration
 */
const DEFAULT_CONFIG: PasswordHashConfig = {
  saltRounds: 12,
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventCommonPasswords: true,
};

/**
 * Common weak passwords to prevent
 */
const COMMON_PASSWORDS = [
  'password',
  '123456',
  '123456789',
  'qwerty',
  'abc123',
  'password123',
  'admin',
  'letmein',
  'welcome',
  'monkey',
  '1234567890',
  'password1',
  'senha',
  '123456',
  'admin123',
  'root',
  'toor',
  'pass',
  'test',
  'user',
  'guest',
  'demo',
  'sample',
  'temp',
  'temporary',
];

/**
 * Special characters for password validation
 */
const SPECIAL_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

/**
 * Password utility class
 */
export class PasswordUtils {
  private static logger = new Logger('PasswordUtils');
  private static config: PasswordHashConfig = DEFAULT_CONFIG;

  /**
   * Configure password settings
   */
  static configure(config: Partial<PasswordHashConfig>): void {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.logger.info('Password configuration updated', {
      saltRounds: this.config.saltRounds,
      minLength: this.config.minLength,
      maxLength: this.config.maxLength,
    });
  }

  /**
   * Hash a password using bcrypt
   */
  static async hash(password: string): Promise<string> {
    try {
      if (!password || typeof password !== 'string') {
        throw new Error('Password must be a non-empty string');
      }

      if (password.length > this.config.maxLength) {
        throw new Error(`Password must not exceed ${this.config.maxLength} characters`);
      }

      const startTime = Date.now();
      const hashedPassword = await bcrypt.hash(password, this.config.saltRounds);
      const duration = Date.now() - startTime;

      this.logger.debug('Password hashed successfully', {
        duration,
        saltRounds: this.config.saltRounds,
      });

      return hashedPassword;
    } catch (error) {
      this.logger.error('Error hashing password', { error });
      throw error;
    }
  }

  /**
   * Compare a plain password with a hashed password
   */
  static async compare(password: string, hashedPassword: string): Promise<boolean> {
    try {
      if (!password || !hashedPassword) {
        return false;
      }

      if (typeof password !== 'string' || typeof hashedPassword !== 'string') {
        return false;
      }

      const startTime = Date.now();
      const isMatch = await bcrypt.compare(password, hashedPassword);
      const duration = Date.now() - startTime;

      this.logger.debug('Password comparison completed', {
        isMatch,
        duration,
      });

      return isMatch;
    } catch (error) {
      this.logger.error('Error comparing password', { error });
      return false;
    }
  }

  /**
   * Validate password strength and requirements
   */
  static validatePassword(password: string): PasswordValidationResult {
    const result: PasswordValidationResult = {
      isValid: false,
      strength: PasswordStrength.VERY_WEAK,
      score: 0,
      errors: [],
      suggestions: [],
    };

    if (!password || typeof password !== 'string') {
      result.errors.push('Senha é obrigatória');
      return result;
    }

    // Length validation
    if (password.length < this.config.minLength) {
      result.errors.push(`Senha deve ter pelo menos ${this.config.minLength} caracteres`);
    }

    if (password.length > this.config.maxLength) {
      result.errors.push(`Senha deve ter no máximo ${this.config.maxLength} caracteres`);
    }

    // Character requirements
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = new RegExp(
      `[${SPECIAL_CHARS.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`
    ).test(password);

    if (this.config.requireUppercase && !hasUppercase) {
      result.errors.push('Senha deve conter pelo menos uma letra maiúscula');
      result.suggestions.push('Adicione letras maiúsculas (A-Z)');
    }

    if (this.config.requireLowercase && !hasLowercase) {
      result.errors.push('Senha deve conter pelo menos uma letra minúscula');
      result.suggestions.push('Adicione letras minúsculas (a-z)');
    }

    if (this.config.requireNumbers && !hasNumbers) {
      result.errors.push('Senha deve conter pelo menos um número');
      result.suggestions.push('Adicione números (0-9)');
    }

    if (this.config.requireSpecialChars && !hasSpecialChars) {
      result.errors.push('Senha deve conter pelo menos um caractere especial');
      result.suggestions.push(`Adicione caracteres especiais (${SPECIAL_CHARS})`);
    }

    // Common password check
    if (this.config.preventCommonPasswords) {
      const lowerPassword = password.toLowerCase();
      if (COMMON_PASSWORDS.includes(lowerPassword)) {
        result.errors.push('Senha muito comum, escolha uma senha mais segura');
        result.suggestions.push('Use uma combinação única de palavras, números e símbolos');
      }
    }

    // Calculate strength score
    let score = 0;

    // Length scoring (0-25 points)
    if (password.length >= this.config.minLength) {
      score += Math.min(25, (password.length - this.config.minLength + 1) * 3);
    }

    // Character variety scoring (0-60 points)
    if (hasLowercase) score += 10;
    if (hasUppercase) score += 15;
    if (hasNumbers) score += 15;
    if (hasSpecialChars) score += 20;

    // Pattern analysis (0-15 points)
    const uniqueChars = new Set(password).size;
    const uniqueRatio = uniqueChars / password.length;
    score += Math.floor(uniqueRatio * 15);

    // Penalty for common patterns
    if (/(.)\1{2,}/.test(password)) score -= 10; // Repeated characters
    if (/123|abc|qwe/i.test(password)) score -= 15; // Sequential patterns
    if (/password|admin|user/i.test(password)) score -= 20; // Common words

    // Ensure score is within bounds
    score = Math.max(0, Math.min(100, score));
    result.score = score;

    // Determine strength level
    if (score >= 80) {
      result.strength = PasswordStrength.STRONG;
    } else if (score >= 60) {
      result.strength = PasswordStrength.GOOD;
    } else if (score >= 40) {
      result.strength = PasswordStrength.FAIR;
    } else if (score >= 20) {
      result.strength = PasswordStrength.WEAK;
    } else {
      result.strength = PasswordStrength.VERY_WEAK;
    }

    // Add strength-based suggestions
    if (score < 60) {
      if (password.length < 12) {
        result.suggestions.push('Use pelo menos 12 caracteres para maior segurança');
      }
      if (!hasSpecialChars) {
        result.suggestions.push('Adicione símbolos especiais para aumentar a complexidade');
      }
      if (uniqueRatio < 0.7) {
        result.suggestions.push('Evite repetir muitos caracteres');
      }
    }

    // Password is valid if no errors and minimum strength
    result.isValid = result.errors.length === 0 && score >= 40;

    return result;
  }

  /**
   * Generate a secure random password
   */
  static generateSecurePassword(length: number = 16): string {
    if (length < this.config.minLength) {
      length = this.config.minLength;
    }
    if (length > this.config.maxLength) {
      length = this.config.maxLength;
    }

    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const specialChars = SPECIAL_CHARS;

    let charset = '';
    let password = '';

    // Ensure at least one character from each required set
    if (this.config.requireLowercase) {
      charset += lowercase;
      password += lowercase[Math.floor(Math.random() * lowercase.length)];
    }

    if (this.config.requireUppercase) {
      charset += uppercase;
      password += uppercase[Math.floor(Math.random() * uppercase.length)];
    }

    if (this.config.requireNumbers) {
      charset += numbers;
      password += numbers[Math.floor(Math.random() * numbers.length)];
    }

    if (this.config.requireSpecialChars) {
      charset += specialChars;
      password += specialChars[Math.floor(Math.random() * specialChars.length)];
    }

    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }

    // Shuffle the password to avoid predictable patterns
    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }

  /**
   * Check if a password needs to be rehashed (due to config changes)
   */
  static async needsRehash(hashedPassword: string): Promise<boolean> {
    try {
      // Extract salt rounds from the hash
      const rounds = bcrypt.getRounds(hashedPassword);
      return rounds !== this.config.saltRounds;
    } catch (error) {
      this.logger.error('Error checking if password needs rehash', { error });
      return true; // Assume it needs rehashing if we can't determine
    }
  }

  /**
   * Get password strength description in Portuguese
   */
  static getStrengthDescription(strength: PasswordStrength): string {
    const descriptions = {
      [PasswordStrength.VERY_WEAK]: 'Muito Fraca',
      [PasswordStrength.WEAK]: 'Fraca',
      [PasswordStrength.FAIR]: 'Razoável',
      [PasswordStrength.GOOD]: 'Boa',
      [PasswordStrength.STRONG]: 'Forte',
    };

    return descriptions[strength];
  }

  /**
   * Get password strength color for UI
   */
  static getStrengthColor(strength: PasswordStrength): string {
    const colors = {
      [PasswordStrength.VERY_WEAK]: '#ff4444',
      [PasswordStrength.WEAK]: '#ff8800',
      [PasswordStrength.FAIR]: '#ffbb00',
      [PasswordStrength.GOOD]: '#88cc00',
      [PasswordStrength.STRONG]: '#00cc44',
    };

    return colors[strength];
  }

  /**
   * Estimate time to crack password (for educational purposes)
   */
  static estimateCrackTime(password: string): string {
    const charset = this.getCharsetSize(password);
    const combinations = Math.pow(charset, password.length);

    // Assume 1 billion attempts per second (modern GPU)
    const attemptsPerSecond = 1e9;
    const secondsToCrack = combinations / (2 * attemptsPerSecond); // Average case

    if (secondsToCrack < 1) return 'Instantâneo';
    if (secondsToCrack < 60) return `${Math.ceil(secondsToCrack)} segundos`;
    if (secondsToCrack < 3600) return `${Math.ceil(secondsToCrack / 60)} minutos`;
    if (secondsToCrack < 86400) return `${Math.ceil(secondsToCrack / 3600)} horas`;
    if (secondsToCrack < 31536000) return `${Math.ceil(secondsToCrack / 86400)} dias`;
    if (secondsToCrack < 31536000000) return `${Math.ceil(secondsToCrack / 31536000)} anos`;

    return 'Séculos';
  }

  /**
   * Get character set size for crack time estimation
   */
  private static getCharsetSize(password: string): number {
    let size = 0;

    if (/[a-z]/.test(password)) size += 26;
    if (/[A-Z]/.test(password)) size += 26;
    if (/\d/.test(password)) size += 10;
    if (new RegExp(`[${SPECIAL_CHARS.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`).test(password)) {
      size += SPECIAL_CHARS.length;
    }

    return size || 1;
  }
}

/**
 * Convenience functions for common operations
 */

/**
 * Hash a password with default settings
 */
export const hashPassword = (password: string): Promise<string> => {
  return PasswordUtils.hash(password);
};

/**
 * Compare password with hash
 */
export const comparePassword = (password: string, hash: string): Promise<boolean> => {
  return PasswordUtils.compare(password, hash);
};

/**
 * Validate password strength
 */
export const validatePassword = (password: string): PasswordValidationResult => {
  return PasswordUtils.validatePassword(password);
};

/**
 * Generate secure password
 */
export const generateSecurePassword = (length?: number): string => {
  return PasswordUtils.generateSecurePassword(length);
};

/**
 * Export types and enums
 */
export type { PasswordHashConfig };
export { PasswordUtils };
