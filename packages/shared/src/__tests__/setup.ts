// Test setup for shared package
// Configuração de testes para o pacote compartilhado

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Set default timezone for consistent date testing
process.env.TZ = 'UTC';