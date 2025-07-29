// Global test setup for Authentication Service
// Configuração global de testes para o Serviço de Autenticação
export default async function globalSetup() {
  console.log('🧪 Setting up Auth Service tests...');
  
  // Set test environment
  process.env.NODE_ENV = 'test';
  
  // Mock external services that might not be available during testing
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/adms_auth_test';
  process.env.REDIS_URL = 'redis://localhost:6379/1';
  
  // Disable external integrations during testing
  process.env.FEATURE_EMAIL_VERIFICATION = 'false';
  process.env.FEATURE_SOCIAL_LOGIN = 'false';
  process.env.FEATURE_TWO_FACTOR = 'false';
  
  console.log('✅ Auth Service test setup complete');
}