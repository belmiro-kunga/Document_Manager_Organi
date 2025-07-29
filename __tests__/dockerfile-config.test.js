// Tests for Dockerfile configuration
// Testes para configuração Dockerfile
const fs = require('fs');
const path = require('path');

describe('Dockerfile Configuration Tests', () => {
  describe('Production Dockerfiles', () => {
    const services = ['auth-service', 'document-service', 'python-analysis', 'web-client'];
    
    services.forEach(service => {
      test(`${service} should have production Dockerfile`, () => {
        const dockerfilePath = path.join(__dirname, `../packages/${service}/Dockerfile`);
        expect(fs.existsSync(dockerfilePath)).toBe(true);
        
        const dockerfileContent = fs.readFileSync(dockerfilePath, 'utf8');
        
        // Should use multi-stage build
        expect(dockerfileContent).toContain('FROM');
        expect(dockerfileContent).toContain('AS');
        
        // Should have health check
        expect(dockerfileContent).toContain('HEALTHCHECK');
        
        // Should expose appropriate port
        expect(dockerfileContent).toContain('EXPOSE');
        
        // Should have non-root user
        expect(dockerfileContent).toContain('USER adms');
      });
    });

    test('auth-service Dockerfile should be configured correctly', () => {
      const dockerfilePath = path.join(__dirname, '../packages/auth-service/Dockerfile');
      const content = fs.readFileSync(dockerfilePath, 'utf8');
      
      expect(content).toContain('node:18-alpine');
      expect(content).toContain('EXPOSE 3001');
      expect(content).toContain('USER adms');
    });

    test('document-service Dockerfile should be configured correctly', () => {
      const dockerfilePath = path.join(__dirname, '../packages/document-service/Dockerfile');
      const content = fs.readFileSync(dockerfilePath, 'utf8');
      
      expect(content).toContain('node:18-alpine');
      expect(content).toContain('EXPOSE 3002');
      expect(content).toContain('USER adms');
    });

    test('python-analysis Dockerfile should be configured correctly', () => {
      const dockerfilePath = path.join(__dirname, '../packages/python-analysis/Dockerfile');
      const content = fs.readFileSync(dockerfilePath, 'utf8');
      
      expect(content).toContain('python:3.11-slim');
      expect(content).toContain('EXPOSE 8001');
      expect(content).toContain('tesseract-ocr');
      expect(content).toContain('uvicorn');
      expect(content).toContain('USER adms');
    });

    test('web-client Dockerfile should be configured correctly', () => {
      const dockerfilePath = path.join(__dirname, '../packages/web-client/Dockerfile');
      const content = fs.readFileSync(dockerfilePath, 'utf8');
      
      expect(content).toContain('node:18-alpine');
      expect(content).toContain('nginx:alpine');
      expect(content).toContain('EXPOSE');
      expect(content).toContain('USER adms');
    });
  });

  describe('Multi-stage Development Support', () => {
    const nodeServices = ['auth-service', 'document-service', 'web-client'];
    
    nodeServices.forEach(service => {
      test(`${service} should support development stage`, () => {
        const dockerfilePath = path.join(__dirname, `../packages/${service}/Dockerfile`);
        expect(fs.existsSync(dockerfilePath)).toBe(true);
        
        const dockerfileContent = fs.readFileSync(dockerfilePath, 'utf8');
        
        // Should have development stage
        expect(dockerfileContent).toContain('AS development');
        
        // Should have health check
        expect(dockerfileContent).toContain('HEALTHCHECK');
        
        // Should expose appropriate port
        expect(dockerfileContent).toContain('EXPOSE');
        
        // Should have non-root user
        expect(dockerfileContent).toContain('USER adms');
      });
    });
  });

  describe('Web Client Configuration', () => {
    test('should have nginx configuration', () => {
      const nginxConfPath = path.join(__dirname, '../packages/web-client/nginx.conf');
      expect(fs.existsSync(nginxConfPath)).toBe(true);
      
      const content = fs.readFileSync(nginxConfPath, 'utf8');
      expect(content).toContain('listen 80');
      expect(content).toContain('location /api/');
      expect(content).toContain('proxy_pass');
      expect(content).toContain('gzip on');
    });

    test('should have proper nginx user configuration', () => {
      const nginxConfPath = path.join(__dirname, '../packages/web-client/nginx.conf');
      const content = fs.readFileSync(nginxConfPath, 'utf8');
      
      expect(content).toContain('user adms');
      expect(content).toContain('server_name localhost');
    });
  });

  describe('Production Docker Compose', () => {
    test('should have production docker-compose file', () => {
      const composePath = path.join(__dirname, '../docker-compose.prod.yml');
      expect(fs.existsSync(composePath)).toBe(true);
    });

    test('production compose should have all services', () => {
      const composePath = path.join(__dirname, '../docker-compose.prod.yml');
      const content = fs.readFileSync(composePath, 'utf8');
      
      const requiredServices = [
        'postgres',
        'redis',
        'elasticsearch',
        'auth-service',
        'document-service',
        'python-analysis',
        'web-client',
        'api-gateway'
      ];
      
      requiredServices.forEach(service => {
        expect(content).toContain(service + ':');
      });
    });

    test('production compose should have resource limits', () => {
      const composePath = path.join(__dirname, '../docker-compose.prod.yml');
      const content = fs.readFileSync(composePath, 'utf8');
      
      expect(content).toContain('deploy:');
      expect(content).toContain('resources:');
      expect(content).toContain('limits:');
      expect(content).toContain('memory:');
    });

    test('production compose should use build context', () => {
      const composePath = path.join(__dirname, '../docker-compose.prod.yml');
      const content = fs.readFileSync(composePath, 'utf8');
      
      expect(content).toContain('build:');
      expect(content).toContain('context: .');
      expect(content).toContain('dockerfile: packages/');
    });
  });

  describe('API Gateway Configuration', () => {
    test('should have nginx configuration for API gateway', () => {
      const nginxConfPath = path.join(__dirname, '../docker/nginx/nginx.conf');
      expect(fs.existsSync(nginxConfPath)).toBe(true);
      
      const content = fs.readFileSync(nginxConfPath, 'utf8');
      expect(content).toContain('upstream auth_service');
      expect(content).toContain('upstream document_service');
      expect(content).toContain('upstream python_analysis');
      expect(content).toContain('location /api/v1/auth/');
      expect(content).toContain('location /api/v1/documents/');
      expect(content).toContain('location /api/v1/analysis/');
      expect(content).toContain('limit_req_zone');
    });
  });

  describe('Docker Ignore Files', () => {
    test('should have .dockerignore in root', () => {
      const dockerignorePath = path.join(__dirname, '../.dockerignore');
      expect(fs.existsSync(dockerignorePath)).toBe(true);
      
      const content = fs.readFileSync(dockerignorePath, 'utf8');
      expect(content).toContain('node_modules/');
      expect(content).toContain('.git');
      expect(content).toContain('*.md');
    });
  });

  describe('Multi-stage Build Optimization', () => {
    test('production Dockerfiles should use multi-stage builds', () => {
      const services = ['auth-service', 'document-service', 'web-client'];
      
      services.forEach(service => {
        const dockerfilePath = path.join(__dirname, `../packages/${service}/Dockerfile`);
        const content = fs.readFileSync(dockerfilePath, 'utf8');
        
        expect(content).toContain('AS base');
        expect(content).toContain('AS production');
        expect(content).toContain('AS development');
      });
    });

    test('python-analysis should use multi-stage build', () => {
      const dockerfilePath = path.join(__dirname, '../packages/python-analysis/Dockerfile');
      const content = fs.readFileSync(dockerfilePath, 'utf8');
      
      expect(content).toContain('AS base');
      expect(content).toContain('AS production');
      expect(content).toContain('AS development');
    });
  });

  describe('Security Best Practices', () => {
    test('all Dockerfiles should use non-root users', () => {
      const services = ['auth-service', 'document-service', 'python-analysis', 'web-client'];
      
      services.forEach(service => {
        const dockerfilePath = path.join(__dirname, `../packages/${service}/Dockerfile`);
        const content = fs.readFileSync(dockerfilePath, 'utf8');
        
        // Should create and use non-root user
        expect(content).toContain('USER adms');
      });
    });

    test('all Dockerfiles should have health checks', () => {
      const services = ['auth-service', 'document-service', 'python-analysis', 'web-client'];
      
      services.forEach(service => {
        const dockerfilePath = path.join(__dirname, `../packages/${service}/Dockerfile`);
        const content = fs.readFileSync(dockerfilePath, 'utf8');
        
        expect(content).toContain('HEALTHCHECK');
      });
    });
  });

  describe('Build Test Scripts', () => {
    test('should have PowerShell build test script', () => {
      const scriptPath = path.join(__dirname, '../docker/scripts/test-builds.ps1');
      expect(fs.existsSync(scriptPath)).toBe(true);
      
      const content = fs.readFileSync(scriptPath, 'utf8');
      expect(content).toContain('Test-DockerBuild');
      expect(content).toContain('docker build');
    });

    test('should have Bash build test script', () => {
      const scriptPath = path.join(__dirname, '../docker/scripts/test-builds.sh');
      expect(fs.existsSync(scriptPath)).toBe(true);
      
      const content = fs.readFileSync(scriptPath, 'utf8');
      expect(content).toContain('#!/bin/bash');
      expect(content).toContain('test_docker_build');
      expect(content).toContain('docker build');
    });
  });
});