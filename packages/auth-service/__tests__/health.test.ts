// Health check tests for Authentication Service
// Testes de verificação de saúde para o Serviço de Autenticação
import request from 'supertest';
import app from '../src/index';

describe('Health Check Endpoints', () => {
  describe('GET /health', () => {
    it('should return basic health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('service', 'auth-service');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('memory');
    });

    it('should include memory usage information', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.memory).toHaveProperty('rss');
      expect(response.body.memory).toHaveProperty('heapTotal');
      expect(response.body.memory).toHaveProperty('heapUsed');
      expect(response.body.memory).toHaveProperty('external');
    });
  });

  describe('GET /health/detailed', () => {
    it('should return detailed health status', async () => {
      const response = await request(app)
        .get('/health/detailed')
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('service', 'auth-service');
      expect(response.body).toHaveProperty('dependencies');
      expect(response.body.dependencies).toHaveProperty('database');
      expect(response.body.dependencies).toHaveProperty('redis');
    });

    it('should include system information', async () => {
      const response = await request(app)
        .get('/health/detailed');

      expect(response.body).toHaveProperty('system');
      expect(response.body.system).toHaveProperty('memory');
      expect(response.body.system).toHaveProperty('cpu');
      expect(response.body.system).toHaveProperty('nodeVersion');
      expect(response.body.system).toHaveProperty('platform');
    });
  });

  describe('GET /health/ready', () => {
    it('should return readiness status', async () => {
      const response = await request(app)
        .get('/health/ready')
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('service', 'auth-service');
      expect(response.body).toHaveProperty('dependencies');
    });
  });

  describe('GET /health/live', () => {
    it('should return liveness status', async () => {
      const response = await request(app)
        .get('/health/live')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'alive');
      expect(response.body).toHaveProperty('service', 'auth-service');
      expect(response.body).toHaveProperty('uptime');
    });
  });

  describe('GET /health/metrics', () => {
    it('should return service metrics', async () => {
      const response = await request(app)
        .get('/health/metrics')
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('service', 'auth-service');
      expect(response.body).toHaveProperty('memory');
      expect(response.body).toHaveProperty('cpu');
      expect(response.body).toHaveProperty('uptime');
    });

    it('should include memory metrics in bytes', async () => {
      const response = await request(app)
        .get('/health/metrics');

      expect(response.body.memory).toHaveProperty('rss_bytes');
      expect(response.body.memory).toHaveProperty('heap_total_bytes');
      expect(response.body.memory).toHaveProperty('heap_used_bytes');
      expect(response.body.memory).toHaveProperty('heap_usage_percent');
    });
  });

  describe('GET /health/info', () => {
    it('should return service information', async () => {
      const response = await request(app)
        .get('/health/info')
        .expect(200);

      expect(response.body).toHaveProperty('service', 'auth-service');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('environment');
      expect(response.body).toHaveProperty('features');
      expect(response.body).toHaveProperty('security');
    });

    it('should include feature flags', async () => {
      const response = await request(app)
        .get('/health/info');

      expect(response.body.features).toHaveProperty('registration');
      expect(response.body.features).toHaveProperty('emailVerification');
      expect(response.body.features).toHaveProperty('passwordReset');
      expect(response.body.features).toHaveProperty('socialLogin');
      expect(response.body.features).toHaveProperty('twoFactor');
    });

    it('should include security configuration', async () => {
      const response = await request(app)
        .get('/health/info');

      expect(response.body.security).toHaveProperty('jwtIssuer');
      expect(response.body.security).toHaveProperty('jwtAudience');
      expect(response.body.security).toHaveProperty('maxLoginAttempts');
    });
  });
});