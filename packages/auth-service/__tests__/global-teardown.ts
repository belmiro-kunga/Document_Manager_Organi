// Global test teardown for Authentication Service
// Limpeza global de testes para o Serviço de Autenticação
export default async function globalTeardown() {
  console.log('🧹 Cleaning up Auth Service tests...');
  
  // Clean up any global resources
  // Close database connections, clear caches, etc.
  
  console.log('✅ Auth Service test cleanup complete');
}