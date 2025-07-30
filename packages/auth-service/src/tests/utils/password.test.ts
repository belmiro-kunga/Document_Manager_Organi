// Password utilities tests for Authentication Service
// Testes dos utilitários de senha para o Serviço de Autenticação

import {
  PasswordUtils,
  PasswordStrength,
  hashPassword,
  comparePassword,
  validatePassword,
  generateSecurePassword,
  PasswordValidationResult,
} from '../../utils/password';

describe('PasswordUtils', () => {
  beforeEach(() => {
    // Reset to default configuration before each test
    PasswordUtils.configure({});
  });

  describe('hash', () => {
    it('should hash a password successfully', async () => {
      const password = 'TestPassword123!';
      const hash = await PasswordUtils.hash(password);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50); // bcrypt hashes are typically 60 chars
    });

    it('should produce different hashes for the same password', async () => {
      const password = 'TestPassword123!';
      const hash1 = await PasswordUtils.hash(password);
      const hash2 = await PasswordUtils.hash(password);

      expect(hash1).not.toBe(hash2); // Due to salt
    });

    it('should reject empty password', async () => {
      await expect(PasswordUtils.hash('')).rejects.toThrow('Password must be a non-empty string');
    });

    it('should reject null password', async () => {
      await expect(PasswordUtils.hash(null as any)).rejects.toThrow(
        'Password must be a non-empty string'
      );
    });

    it('should reject undefined password', async () => {
      await expect(PasswordUtils.hash(undefined as any)).rejects.toThrow(
        'Password must be a non-empty string'
      );
    });

    it('should reject non-string password', async () => {
      await expect(PasswordUtils.hash(123 as any)).rejects.toThrow(
        'Password must be a non-empty string'
      );
    });

    it('should reject password that exceeds maximum length', async () => {
      const longPassword = 'a'.repeat(200);
      await expect(PasswordUtils.hash(longPassword)).rejects.toThrow(
        'Password must not exceed 128 characters'
      );
    });
  });

  describe('compare', () => {
    it('should return true for matching password and hash', async () => {
      const password = 'TestPassword123!';
      const hash = await PasswordUtils.hash(password);
      const isMatch = await PasswordUtils.compare(password, hash);

      expect(isMatch).toBe(true);
    });

    it('should return false for non-matching password and hash', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword123!';
      const hash = await PasswordUtils.hash(password);
      const isMatch = await PasswordUtils.compare(wrongPassword, hash);

      expect(isMatch).toBe(false);
    });

    it('should return false for empty password', async () => {
      const hash = await PasswordUtils.hash('TestPassword123!');
      const isMatch = await PasswordUtils.compare('', hash);

      expect(isMatch).toBe(false);
    });

    it('should return false for empty hash', async () => {
      const isMatch = await PasswordUtils.compare('TestPassword123!', '');

      expect(isMatch).toBe(false);
    });

    it('should return false for null inputs', async () => {
      const isMatch1 = await PasswordUtils.compare(null as any, 'hash');
      const isMatch2 = await PasswordUtils.compare('password', null as any);
      const isMatch3 = await PasswordUtils.compare(null as any, null as any);

      expect(isMatch1).toBe(false);
      expect(isMatch2).toBe(false);
      expect(isMatch3).toBe(false);
    });

    it('should return false for non-string inputs', async () => {
      const isMatch1 = await PasswordUtils.compare(123 as any, 'hash');
      const isMatch2 = await PasswordUtils.compare('password', 123 as any);

      expect(isMatch1).toBe(false);
      expect(isMatch2).toBe(false);
    });

    it('should handle bcrypt errors gracefully', async () => {
      const isMatch = await PasswordUtils.compare('password', 'invalid-hash');

      expect(isMatch).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should validate a strong password', () => {
      const result = validatePassword('StrongP@ssw0rd123!');

      expect(result.isValid).toBe(true);
      expect(result.strength).toBe(PasswordStrength.STRONG);
      expect(result.score).toBeGreaterThan(70);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject password that is too short', () => {
      const result = validatePassword('Sh0rt!');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Senha deve ter pelo menos 8 caracteres');
    });

    it('should reject password without uppercase letters', () => {
      const result = validatePassword('lowercase123!');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Senha deve conter pelo menos uma letra maiúscula');
      expect(result.suggestions).toContain('Adicione letras maiúsculas (A-Z)');
    });

    it('should reject password without lowercase letters', () => {
      const result = validatePassword('UPPERCASE123!');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Senha deve conter pelo menos uma letra minúscula');
      expect(result.suggestions).toContain('Adicione letras minúsculas (a-z)');
    });

    it('should reject password without numbers', () => {
      const result = validatePassword('NoNumbers!');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Senha deve conter pelo menos um número');
      expect(result.suggestions).toContain('Adicione números (0-9)');
    });

    it('should reject password without special characters', () => {
      const result = validatePassword('NoSpecialChars123');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Senha deve conter pelo menos um caractere especial');
    });

    it('should reject common passwords', () => {
      const commonPasswords = ['password', '123456', 'admin', 'senha'];

      commonPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Senha muito comum, escolha uma senha mais segura');
      });
    });

    it('should handle empty password', () => {
      const result = validatePassword('');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Senha é obrigatória');
    });

    it('should handle null password', () => {
      const result = validatePassword(null as any);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Senha é obrigatória');
    });

    it('should handle undefined password', () => {
      const result = validatePassword(undefined as any);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Senha é obrigatória');
    });

    it('should calculate correct strength levels', () => {
      const testCases = [
        { password: 'a', expectedStrength: PasswordStrength.VERY_WEAK },
        { password: 'password', expectedStrength: PasswordStrength.VERY_WEAK },
        { password: 'Password1', expectedStrength: PasswordStrength.WEAK },
        { password: 'Password1!', expectedStrength: PasswordStrength.FAIR },
        { password: 'StrongPassword1!', expectedStrength: PasswordStrength.GOOD },
        { password: 'VeryStr0ngP@ssw0rd123!', expectedStrength: PasswordStrength.STRONG },
      ];

      testCases.forEach(({ password, expectedStrength }) => {
        const result = validatePassword(password);
        expect(result.strength).toBe(expectedStrength);
      });
    });

    it('should penalize repeated characters', () => {
      const weakPassword = 'Aaaa1111!!!!';
      const strongPassword = 'AbCd1234!@#$';

      const weakResult = validatePassword(weakPassword);
      const strongResult = validatePassword(strongPassword);

      expect(weakResult.score).toBeLessThan(strongResult.score);
    });

    it('should penalize sequential patterns', () => {
      const weakPassword = 'Abc123!@#';
      const strongPassword = 'Xz7$Kp2&Q';

      const weakResult = validatePassword(weakPassword);
      const strongResult = validatePassword(strongPassword);

      expect(weakResult.score).toBeLessThan(strongResult.score);
    });
  });

  describe('generateSecurePassword', () => {
    it('should generate password with default length', () => {
      const password = generateSecurePassword();

      expect(password).toBeDefined();
      expect(typeof password).toBe('string');
      expect(password.length).toBe(16);
    });

    it('should generate password with specified length', () => {
      const length = 20;
      const password = generateSecurePassword(length);

      expect(password.length).toBe(length);
    });

    it('should generate password with minimum length when requested length is too small', () => {
      const password = generateSecurePassword(4);

      expect(password.length).toBe(8); // Minimum length
    });

    it('should generate password with maximum length when requested length is too large', () => {
      const password = generateSecurePassword(200);

      expect(password.length).toBe(128); // Maximum length
    });

    it('should generate passwords that meet strength requirements', () => {
      const password = generateSecurePassword();
      const validation = validatePassword(password);

      expect(validation.isValid).toBe(true);
      expect(validation.strength).toBeOneOf([PasswordStrength.GOOD, PasswordStrength.STRONG]);
    });

    it('should generate different passwords each time', () => {
      const password1 = generateSecurePassword();
      const password2 = generateSecurePassword();

      expect(password1).not.toBe(password2);
    });

    it('should include required character types', () => {
      const password = generateSecurePassword();

      expect(/[a-z]/.test(password)).toBe(true); // Lowercase
      expect(/[A-Z]/.test(password)).toBe(true); // Uppercase
      expect(/\d/.test(password)).toBe(true); // Numbers
      expect(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)).toBe(true); // Special chars
    });
  });

  describe('needsRehash', () => {
    it('should return false for hash with current salt rounds', async () => {
      const password = 'TestPassword123!';
      const hash = await PasswordUtils.hash(password);
      const needsRehash = await PasswordUtils.needsRehash(hash);

      expect(needsRehash).toBe(false);
    });

    it('should return true for hash with different salt rounds', async () => {
      // Configure with different salt rounds
      PasswordUtils.configure({ saltRounds: 10 });
      const password = 'TestPassword123!';
      const hash = await PasswordUtils.hash(password);

      // Change salt rounds
      PasswordUtils.configure({ saltRounds: 14 });
      const needsRehash = await PasswordUtils.needsRehash(hash);

      expect(needsRehash).toBe(true);
    });

    it('should return true for invalid hash', async () => {
      const needsRehash = await PasswordUtils.needsRehash('invalid-hash');

      expect(needsRehash).toBe(true);
    });
  });

  describe('getStrengthDescription', () => {
    it('should return correct Portuguese descriptions', () => {
      expect(PasswordUtils.getStrengthDescription(PasswordStrength.VERY_WEAK)).toBe('Muito Fraca');
      expect(PasswordUtils.getStrengthDescription(PasswordStrength.WEAK)).toBe('Fraca');
      expect(PasswordUtils.getStrengthDescription(PasswordStrength.FAIR)).toBe('Razoável');
      expect(PasswordUtils.getStrengthDescription(PasswordStrength.GOOD)).toBe('Boa');
      expect(PasswordUtils.getStrengthDescription(PasswordStrength.STRONG)).toBe('Forte');
    });
  });

  describe('getStrengthColor', () => {
    it('should return correct color codes', () => {
      expect(PasswordUtils.getStrengthColor(PasswordStrength.VERY_WEAK)).toBe('#ff4444');
      expect(PasswordUtils.getStrengthColor(PasswordStrength.WEAK)).toBe('#ff8800');
      expect(PasswordUtils.getStrengthColor(PasswordStrength.FAIR)).toBe('#ffbb00');
      expect(PasswordUtils.getStrengthColor(PasswordStrength.GOOD)).toBe('#88cc00');
      expect(PasswordUtils.getStrengthColor(PasswordStrength.STRONG)).toBe('#00cc44');
    });
  });

  describe('estimateCrackTime', () => {
    it('should return reasonable estimates for different password strengths', () => {
      const weakPassword = 'abc';
      const strongPassword = 'Str0ngP@ssw0rd123!';

      const weakTime = PasswordUtils.estimateCrackTime(weakPassword);
      const strongTime = PasswordUtils.estimateCrackTime(strongPassword);

      expect(weakTime).toMatch(/(Instantâneo|segundos|minutos)/);
      expect(strongTime).toMatch(/(anos|Séculos)/);
    });

    it('should handle empty password', () => {
      const time = PasswordUtils.estimateCrackTime('');

      expect(time).toBe('Instantâneo');
    });
  });

  describe('configure', () => {
    it('should update configuration correctly', () => {
      const customConfig = {
        saltRounds: 10,
        minLength: 12,
        requireSpecialChars: false,
      };

      PasswordUtils.configure(customConfig);

      // Test that configuration is applied
      const result = validatePassword('SimplePassword123');
      expect(result.isValid).toBe(true); // Should be valid without special chars
    });

    it('should merge with default configuration', () => {
      PasswordUtils.configure({ minLength: 10 });

      const result = validatePassword('Short1!'); // 7 chars
      expect(result.errors).toContain('Senha deve ter pelo menos 10 caracteres');
    });
  });

  describe('convenience functions', () => {
    it('should work with hashPassword function', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
    });

    it('should work with comparePassword function', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      const isMatch = await comparePassword(password, hash);

      expect(isMatch).toBe(true);
    });

    it('should work with validatePassword function', () => {
      const result = validatePassword('TestPassword123!');

      expect(result).toBeDefined();
      expect(result.isValid).toBe(true);
    });

    it('should work with generateSecurePassword function', () => {
      const password = generateSecurePassword();

      expect(password).toBeDefined();
      expect(typeof password).toBe('string');
      expect(password.length).toBe(16);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle very long passwords gracefully', () => {
      const longPassword = 'A'.repeat(150) + '1!';
      const result = validatePassword(longPassword);

      expect(result.errors).toContain('Senha deve ter no máximo 128 caracteres');
    });

    it('should handle passwords with only special characters', () => {
      const specialOnlyPassword = '!@#$%^&*()';
      const result = validatePassword(specialOnlyPassword);

      expect(result.errors).toContain('Senha deve conter pelo menos uma letra maiúscula');
      expect(result.errors).toContain('Senha deve conter pelo menos uma letra minúscula');
      expect(result.errors).toContain('Senha deve conter pelo menos um número');
    });

    it('should handle passwords with unicode characters', () => {
      const unicodePassword = 'Pássw0rd123!ção';
      const result = validatePassword(unicodePassword);

      expect(result.isValid).toBe(true);
    });

    it('should handle concurrent hashing operations', async () => {
      const passwords = ['Pass1!', 'Pass2!', 'Pass3!', 'Pass4!', 'Pass5!'];
      const hashPromises = passwords.map(password => hashPassword(password));
      const hashes = await Promise.all(hashPromises);

      expect(hashes).toHaveLength(5);
      hashes.forEach(hash => {
        expect(hash).toBeDefined();
        expect(typeof hash).toBe('string');
      });

      // All hashes should be different
      const uniqueHashes = new Set(hashes);
      expect(uniqueHashes.size).toBe(5);
    });
  });
});
