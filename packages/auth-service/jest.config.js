// Jest configuration for Authentication Service
// Configuração do Jest para o Serviço de Autenticação
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  displayName: 'Auth Service',

  // Test file patterns
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],

  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/index.ts',
    '!src/scripts/**',
    '!src/**/__tests__/**',
  ],

  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],

  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],

  // Module resolution
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@adms/shared$': '<rootDir>/../shared/src/index.ts',
  },

  // Transform configuration
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },

  // Test timeout
  testTimeout: 30000,

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks after each test
  restoreMocks: true,

  // Global setup and teardown
  globalSetup: '<rootDir>/__tests__/global-setup.ts',
  globalTeardown: '<rootDir>/__tests__/global-teardown.ts',

  // Environment variables for testing
  setupFiles: ['<rootDir>/__tests__/env-setup.ts'],

  // Ignore patterns
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/coverage/'],

  // Watch mode configuration
  watchPathIgnorePatterns: ['/node_modules/', '/dist/', '/coverage/'],

  // Error handling
  errorOnDeprecated: true,

  // Reporters
  reporters: ['default'],

  // Mock configuration
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Test file patterns - include src/tests
  testMatch: ['**/__tests__/**/*.test.ts', '**/src/tests/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
};
