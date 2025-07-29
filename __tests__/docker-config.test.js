// Tests for Docker configuration
// Testes para configuração Docker

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

describe('Docker Configuration Tests', () => {
  describe('Docker Compose Configuration', () => {
    let dockerCompose;

    beforeAll(() => {
      const dockerComposePath = path.join(__dirname, '../docker-compose.dev.yml');
      const dockerComposeContent = fs.readFileSync(dockerComposePath, 'utf8');
      dockerCompose = yaml.load(dockerComposeContent);
    });

    test('should have all required services', () => {
      const requiredServices = [
        'postgres',
        'redis', 
        'elasticsearch',
        'minio',
        'minio-client'
      ];

      requiredServices.forEach(service => {
        expect(dockerCompose.services).toHaveProperty(service);
      });
    });

    test('PostgreSQL should be configured correctly', () => {
      const postgres = dockerCompose.services.postgres;
      
      expect(postgres.image).toBe('postgres:15-alpine');
      expect(postgres.container_name).toBe('adms-postgres-dev');
      expect(postgres.environment.POSTGRES_DB).toBe('adms_dev');
      expect(postgres.environment.POSTGRES_USER).toBe('adms_user');
      expect(postgres.ports).toContain('5433:5432');
      expect(postgres.healthcheck).toBeDefined();
    });

    test('Redis should be configured correctly', () => {
      const redis = dockerCompose.services.redis;
      
      expect(redis.image).toBe('redis:7-alpine');
      expect(redis.container_name).toBe('adms-redis-dev');
      expect(redis.ports).toContain('6379:6379');
      expect(redis.healthcheck).toBeDefined();
    });

    test('ElasticSearch should be configured correctly', () => {
      const elasticsearch = dockerCompose.services.elasticsearch;
      
      expect(elasticsearch.image).toBe('docker.elastic.co/elasticsearch/elasticsearch:8.8.0');
      expect(elasticsearch.container_name).toBe('adms-elasticsearch-dev');
      expect(elasticsearch.ports).toContain('9200:9200');
      expect(elasticsearch.environment).toContain('cluster.name=adms-cluster');
      expect(elasticsearch.healthcheck).toBeDefined();
    });

    test('MinIO should be configured correctly', () => {
      const minio = dockerCompose.services.minio;
      
      expect(minio.image).toBe('minio/minio:latest');
      expect(minio.container_name).toBe('adms-minio-dev');
      expect(minio.ports).toContain('9000:9000');
      expect(minio.ports).toContain('9001:9001');
      expect(minio.environment.MINIO_ROOT_USER).toBe('minioadmin');
      expect(minio.healthcheck).toBeDefined();
    });

    test('should have shared network configured', () => {
      expect(dockerCompose.networks).toHaveProperty('adms-network');
      expect(dockerCompose.networks['adms-network'].driver).toBe('bridge');
    });

    test('should have persistent volumes configured', () => {
      const expectedVolumes = [
        'postgres_data',
        'redis_data',
        'elasticsearch_data',
        'minio_data'
      ];

      expectedVolumes.forEach(volume => {
        expect(dockerCompose.volumes).toHaveProperty(volume);
        expect(dockerCompose.volumes[volume].driver).toBe('local');
      });
    });

    test('all services should be connected to adms-network', () => {
      Object.keys(dockerCompose.services).forEach(serviceName => {
        const service = dockerCompose.services[serviceName];
        if (service.networks) {
          if (Array.isArray(service.networks)) {
            expect(service.networks).toContain('adms-network');
          } else {
            expect(service.networks).toHaveProperty('adms-network');
          }
        }
      });
    });

    test('all services should have health checks', () => {
      const servicesWithHealthChecks = ['postgres', 'redis', 'elasticsearch', 'minio'];
      
      servicesWithHealthChecks.forEach(serviceName => {
        const service = dockerCompose.services[serviceName];
        expect(service.healthcheck).toBeDefined();
        expect(service.healthcheck.test).toBeDefined();
      });
    });
  });

  describe('PostgreSQL Configuration', () => {
    test('should have initialization script', () => {
      const initScriptPath = path.join(__dirname, '../docker/postgres/init/01-init-database.sql');
      expect(fs.existsSync(initScriptPath)).toBe(true);
      
      const scriptContent = fs.readFileSync(initScriptPath, 'utf8');
      expect(scriptContent).toContain('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
      expect(scriptContent).toContain('CREATE SCHEMA IF NOT EXISTS auth');
      expect(scriptContent).toContain('CREATE SCHEMA IF NOT EXISTS documents');
    });
  });

  describe('Redis Configuration', () => {
    test('should have redis.conf file', () => {
      const redisConfPath = path.join(__dirname, '../docker/redis/redis.conf');
      expect(fs.existsSync(redisConfPath)).toBe(true);
      
      const confContent = fs.readFileSync(redisConfPath, 'utf8');
      expect(confContent).toContain('requirepass redis_password');
      expect(confContent).toContain('appendonly yes');
    });
  });

  describe('Health Check Scripts', () => {
    test('should have PowerShell health check script', () => {
      const healthCheckPath = path.join(__dirname, '../docker/scripts/health-check.ps1');
      expect(fs.existsSync(healthCheckPath)).toBe(true);
    });

    test('should have Bash health check script', () => {
      const healthCheckPath = path.join(__dirname, '../docker/scripts/health-check.sh');
      expect(fs.existsSync(healthCheckPath)).toBe(true);
    });

    test('should have PowerShell setup script', () => {
      const setupPath = path.join(__dirname, '../docker/scripts/dev-setup.ps1');
      expect(fs.existsSync(setupPath)).toBe(true);
    });

    test('should have Bash setup script', () => {
      const setupPath = path.join(__dirname, '../docker/scripts/dev-setup.sh');
      expect(fs.existsSync(setupPath)).toBe(true);
    });
  });

  describe('Storage Directories', () => {
    test('should have storage directories with .gitkeep files', () => {
      const storageDirectories = [
        'storage/documents',
        'storage/backups',
        'storage/uploads'
      ];

      storageDirectories.forEach(dir => {
        const dirPath = path.join(__dirname, '..', dir);
        const gitkeepPath = path.join(dirPath, '.gitkeep');
        
        expect(fs.existsSync(dirPath)).toBe(true);
        expect(fs.existsSync(gitkeepPath)).toBe(true);
      });
    });
  });

  describe('Environment Configuration', () => {
    test('should have .env.example file', () => {
      const envExamplePath = path.join(__dirname, '../.env.example');
      expect(fs.existsSync(envExamplePath)).toBe(true);
      
      const envContent = fs.readFileSync(envExamplePath, 'utf8');
      expect(envContent).toContain('DATABASE_PORT=5433');
      expect(envContent).toContain('REDIS_PASSWORD=redis_password');
      expect(envContent).toContain('MINIO_ACCESS_KEY=minioadmin');
    });
  });

  describe('Docker Scripts in Package.json', () => {
    let packageJson;

    beforeAll(() => {
      const packagePath = path.join(__dirname, '../package.json');
      packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    });

    test('should have Docker-related scripts', () => {
      const dockerScripts = [
        'docker:dev',
        'docker:dev:build',
        'docker:dev:logs',
        'docker:down',
        'docker:clean',
        'docker:setup',
        'docker:health'
      ];

      dockerScripts.forEach(script => {
        expect(packageJson.scripts).toHaveProperty(script);
      });
    });
  });

  describe('Docker Documentation', () => {
    test('should have Docker README', () => {
      const dockerReadmePath = path.join(__dirname, '../docker/README.md');
      expect(fs.existsSync(dockerReadmePath)).toBe(true);
      
      const readmeContent = fs.readFileSync(dockerReadmePath, 'utf8');
      expect(readmeContent).toContain('Docker Configuration');
      expect(readmeContent).toContain('PostgreSQL');
      expect(readmeContent).toContain('Redis');
      expect(readmeContent).toContain('ElasticSearch');
      expect(readmeContent).toContain('MinIO');
    });
  });
});