module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    'packages/*/src/**/*.{js,ts}',
    '!packages/*/src/**/*.d.ts',
    '!packages/*/src/**/index.ts',
    '!packages/python-analysis/**/*',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  projects: [
    {
      displayName: 'build-config',
      testMatch: ['<rootDir>/__tests__/build-config.test.js'],
    },
    {
      displayName: 'docker-config',
      testMatch: ['<rootDir>/__tests__/docker-config.test.js'],
    },
    {
      displayName: 'dockerfile-config',
      testMatch: ['<rootDir>/__tests__/dockerfile-config.test.js'],
    },
    {
      displayName: 'config-utilities',
      testMatch: ['<rootDir>/__tests__/config-utilities.test.js'],
    },
    {
      displayName: 'shared',
      testMatch: ['<rootDir>/packages/shared/**/*.test.ts'],
      preset: 'ts-jest',
      testEnvironment: 'node',
    },
  ],
};