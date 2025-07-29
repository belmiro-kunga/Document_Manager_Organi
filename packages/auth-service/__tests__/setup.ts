// Test setup for Authentication Service
// Configuração de testes para o Serviço de Autenticação
import { createLogger } from '@adms/shared';

// Mock logger to reduce noise in tests
jest.mock('@adms/shared', () => ({
  ...jest.requireActual('@adms/shared'),
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }))
}));

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes-only';
process.env.SESSION_SECRET = 'test-session-secret-key-for-testing-purposes-only';
process.env.ENCRYPTION_KEY = 'test-encryption-key-for-testing-purposes-only';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/adms_auth_test';
process.env.REDIS_URL = 'redis://localhost:6379/1';

// Increase timeout for integration tests
jest.setTimeout(30000);

// Global test utilities
global.testUtils = {
  createMockUser: () => ({
    id: 'test-user-id',
    email: 'test@example.com',
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    role: 'user',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }),
  
  createMockRequest: (overrides = {}) => ({
    body: {},
    params: {},
    query: {},
    headers: {},
    ip: '127.0.0.1',
    get: jest.fn(),
    ...overrides
  }),
  
  createMockResponse: () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.setHeader = jest.fn().mockReturnValue(res);
    res.removeHeader = jest.fn().mockReturnValue(res);
    res.set = jest.fn().mockReturnValue(res);
    res.get = jest.fn();
    res.on = jest.fn();
    res.headersSent = false;
    return res;
  }
};

// Mock external services
jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue({
      query: jest.fn().mockResolvedValue({ rows: [] }),
      release: jest.fn()
    }),
    query: jest.fn().mockResolvedValue({ rows: [] }),
    end: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    options: { max: 20, min: 2 },
    totalCount: 0,
    idleCount: 0,
    waitingCount: 0
  }))
}));

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    ping: jest.fn().mockResolvedValue('PONG'),
    quit: jest.fn().mockResolvedValue(undefined),
    set: jest.fn().mockResolvedValue('OK'),
    setex: jest.fn().mockResolvedValue('OK'),
    get: jest.fn().mockResolvedValue(null),
    del: jest.fn().mockResolvedValue(1),
    exists: jest.fn().mockResolvedValue(0),
    expire: jest.fn().mockResolvedValue(1),
    ttl: jest.fn().mockResolvedValue(-1),
    incr: jest.fn().mockResolvedValue(1),
    incrby: jest.fn().mockResolvedValue(1),
    sadd: jest.fn().mockResolvedValue(1),
    smembers: jest.fn().mockResolvedValue([]),
    srem: jest.fn().mockResolvedValue(1),
    sismember: jest.fn().mockResolvedValue(0),
    hset: jest.fn().mockResolvedValue(1),
    hget: jest.fn().mockResolvedValue(null),
    hgetall: jest.fn().mockResolvedValue({}),
    hdel: jest.fn().mockResolvedValue(1),
    keys: jest.fn().mockResolvedValue([]),
    flushdb: jest.fn().mockResolvedValue('OK'),
    info: jest.fn().mockResolvedValue('redis_version:6.0.0'),
    eval: jest.fn().mockResolvedValue(1),
    on: jest.fn()
  }));
});

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true),
  genSalt: jest.fn().mockResolvedValue('salt')
}));

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
  verify: jest.fn().mockReturnValue({ userId: 'test-user-id' }),
  decode: jest.fn().mockReturnValue({ userId: 'test-user-id' })
}));

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransporter: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' })
  })
}));

// Mock speakeasy (2FA)
jest.mock('speakeasy', () => ({
  generateSecret: jest.fn().mockReturnValue({
    base32: 'test-secret',
    otpauth_url: 'otpauth://totp/test'
  }),
  totp: {
    verify: jest.fn().mockReturnValue(true)
  }
}));

// Mock qrcode
jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,test')
}));

// Console override for cleaner test output
const originalConsole = console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
};

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Cleanup after all tests
afterAll(() => {
  global.console = originalConsole;
});