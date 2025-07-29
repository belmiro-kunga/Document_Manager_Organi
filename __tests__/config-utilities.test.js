// Tests for configuration utilities
// Testes para utilitários de configuração

const fs = require('fs');
const path = require('path');

describe('Configuration Utilities Tests', () => {
  describe('Environment Configuration Files', () => {
    test('should have development environment file', () => {
      const devEnvPath = path.join(__dirname, '../config/development.env');
      expect(fs.existsSync(devEnvPath)).toBe(true);
      
      const content = fs.readFileSync(devEnvPath, 'utf8');
      expect(content).toContain('NODE_ENV=development');
      expect(content).toContain('DATABASE_HOST=localhost');
      expect(content).toContain('REDIS_HOST=localhost');
      expect(content).toContain('JWT_SECRET=');
    });

    test('should have production environment file', () => {
      const prodEnvPath = path.join(__dirname, '../config/production.env');
      expect(fs.existsSync(prodEnvPath)).toBe(true);
      
      const content = fs.readFileSync(prodEnvPath, 'utf8');
      expect(content).toContain('NODE_ENV=production');
      expect(content).toContain('DATABASE_SSL=true');
      expect(content).toContain('SECURITY_HEADERS=true');
      expect(content).toContain('RATE_LIMITING=true');
    });

    test('development config should have debug features enabled', () => {
      const devEnvPath = path.join(__dirname, '../config/development.env');
      const content = fs.readFileSync(devEnvPath, 'utf8');
      
      expect(content).toContain('DEBUG_MODE=true');
      expect(content).toContain('HOT_RELOAD=true');
      expect(content).toContain('LOG_LEVEL=debug');
      expect(content).toContain('MOCK_EXTERNAL_APIS=true');
    });

    test('production config should have security features enabled', () => {
      const prodEnvPath = path.join(__dirname, '../config/production.env');
      const content = fs.readFileSync(prodEnvPath, 'utf8');
      
      expect(content).toContain('DEBUG_MODE=false');
      expect(content).toContain('HOT_RELOAD=false');
      expect(content).toContain('HTTPS_ONLY=true');
      expect(content).toContain('CSRF_PROTECTION=true');
    });
  });

  describe('Environment Configuration Class', () => {
    test('should have environment configuration TypeScript file', () => {
      const envConfigPath = path.join(__dirname, '../packages/shared/src/config/environment.ts');
      expect(fs.existsSync(envConfigPath)).toBe(true);
      
      const content = fs.readFileSync(envConfigPath, 'utf8');
      expect(content).toContain('export class EnvironmentConfig');
      expect(content).toContain('ConfigSchema');
      expect(content).toContain('validateEnvironment');
      expect(content).toContain('setupEnvironment');
    });

    test('environment config should have proper validation schema', () => {
      const envConfigPath = path.join(__dirname, '../packages/shared/src/config/environment.ts');
      const content = fs.readFileSync(envConfigPath, 'utf8');
      
      expect(content).toContain('NODE_ENV');
      expect(content).toContain('DATABASE_HOST');
      expect(content).toContain('REDIS_HOST');
      expect(content).toContain('JWT_SECRET');
      expect(content).toContain('STORAGE_PROVIDER');
    });

    test('environment config should have utility methods', () => {
      const envConfigPath = path.join(__dirname, '../packages/shared/src/config/environment.ts');
      const content = fs.readFileSync(envConfigPath, 'utf8');
      
      expect(content).toContain('getDatabaseUrl');
      expect(content).toContain('getRedisUrl');
      expect(content).toContain('getElasticsearchUrl');
      expect(content).toContain('getSupportedLanguages');
      expect(content).toContain('getAllowedFileTypes');
    });
  });

  describe('Code Quality Configuration', () => {
    test('should have lint-staged configuration', () => {
      const lintStagedPath = path.join(__dirname, '../.lintstagedrc.js');
      expect(fs.existsSync(lintStagedPath)).toBe(true);
      
      const content = fs.readFileSync(lintStagedPath, 'utf8');
      expect(content).toContain('eslint --fix');
      expect(content).toContain('prettier --write');
      expect(content).toContain('**/*.{js,ts,tsx}');
      expect(content).toContain('**/*.json');
    });

    test('should have commitlint configuration', () => {
      const commitlintPath = path.join(__dirname, '../.commitlintrc.js');
      expect(fs.existsSync(commitlintPath)).toBe(true);
      
      const content = fs.readFileSync(commitlintPath, 'utf8');
      expect(content).toContain('@commitlint/config-conventional');
      expect(content).toContain('type-enum');
      expect(content).toContain('feat');
      expect(content).toContain('fix');
      expect(content).toContain('docs');
    });

    test('commitlint should have project-specific scopes', () => {
      const commitlintPath = path.join(__dirname, '../.commitlintrc.js');
      const content = fs.readFileSync(commitlintPath, 'utf8');
      
      expect(content).toContain('auth');
      expect(content).toContain('document');
      expect(content).toContain('python');
      expect(content).toContain('web');
      expect(content).toContain('shared');
      expect(content).toContain('docker');
    });

    test('should have Husky git hooks', () => {
      const preCommitPath = path.join(__dirname, '../.husky/pre-commit');
      const commitMsgPath = path.join(__dirname, '../.husky/commit-msg');
      
      expect(fs.existsSync(preCommitPath)).toBe(true);
      expect(fs.existsSync(commitMsgPath)).toBe(true);
      
      const preCommitContent = fs.readFileSync(preCommitPath, 'utf8');
      const commitMsgContent = fs.readFileSync(commitMsgPath, 'utf8');
      
      expect(preCommitContent).toContain('lint-staged');
      expect(commitMsgContent).toContain('commitlint');
    });
  });

  describe('Development Scripts', () => {
    test('should have development Docker script', () => {
      const devDockerPath = path.join(__dirname, '../scripts/dev-docker.js');
      expect(fs.existsSync(devDockerPath)).toBe(true);
      
      const content = fs.readFileSync(devDockerPath, 'utf8');
      expect(content).toContain('startDevelopment');
      expect(content).toContain('stopDevelopment');
      expect(content).toContain('restartService');
      expect(content).toContain('viewLogs');
      expect(content).toContain('listServices');
    });

    test('should have hot reload setup script', () => {
      const hotReloadPath = path.join(__dirname, '../scripts/setup-hot-reload.js');
      expect(fs.existsSync(hotReloadPath)).toBe(true);
      
      const content = fs.readFileSync(hotReloadPath, 'utf8');
      expect(content).toContain('setupHotReload');
      expect(content).toContain('createNodemonConfig');
      expect(content).toContain('createDockerDevOverride');
      expect(content).toContain('createVSCodeDebugConfig');
    });

    test('development Docker script should have proper service configurations', () => {
      const devDockerPath = path.join(__dirname, '../scripts/dev-docker.js');
      const content = fs.readFileSync(devDockerPath, 'utf8');
      
      expect(content).toContain('postgres');
      expect(content).toContain('redis');
      expect(content).toContain('elasticsearch');
      expect(content).toContain('auth-service');
      expect(content).toContain('document-service');
      expect(content).toContain('python-analysis');
      expect(content).toContain('web-client');
    });

    test('hot reload script should support all services', () => {
      const hotReloadPath = path.join(__dirname, '../scripts/setup-hot-reload.js');
      const content = fs.readFileSync(hotReloadPath, 'utf8');
      
      expect(content).toContain('auth-service');
      expect(content).toContain('document-service');
      expect(content).toContain('web-client');
      expect(content).toContain('python-analysis');
      expect(content).toContain('nodemon');
      expect(content).toContain('uvicorn');
    });
  });

  describe('Package.json Configuration', () => {
    test('should have updated root package.json with new scripts', () => {
      const packageJsonPath = path.join(__dirname, '../package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      expect(packageJson.scripts).toHaveProperty('format');
      expect(packageJson.scripts).toHaveProperty('format:check');
      expect(packageJson.scripts).toHaveProperty('postinstall');
      
      expect(packageJson.scripts.format).toContain('prettier --write');
      expect(packageJson.scripts['format:check']).toContain('prettier --check');
      expect(packageJson.scripts.postinstall).toContain('husky install');
    });

    test('should have development dependencies for code quality', () => {
      const packageJsonPath = path.join(__dirname, '../package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      expect(packageJson.devDependencies).toHaveProperty('husky');
      expect(packageJson.devDependencies).toHaveProperty('lint-staged');
      expect(packageJson.devDependencies).toHaveProperty('@commitlint/cli');
      expect(packageJson.devDependencies).toHaveProperty('@commitlint/config-conventional');
      expect(packageJson.devDependencies).toHaveProperty('prettier');
      expect(packageJson.devDependencies).toHaveProperty('eslint');
    });
  });

  describe('Docker Development Configuration', () => {
    test('should create Docker override file when hot reload is set up', () => {
      // This test would run after setup-hot-reload.js is executed
      const overridePath = path.join(__dirname, '../docker-compose.override.yml');
      
      // Check if the script exists and can create the override
      const hotReloadScript = path.join(__dirname, '../scripts/setup-hot-reload.js');
      expect(fs.existsSync(hotReloadScript)).toBe(true);
      
      const content = fs.readFileSync(hotReloadScript, 'utf8');
      expect(content).toContain('docker-compose.override.yml');
      expect(content).toContain('CHOKIDAR_USEPOLLING');
      expect(content).toContain('HOT_RELOAD');
    });

    test('should create VS Code debug configuration', () => {
      const hotReloadScript = path.join(__dirname, '../scripts/setup-hot-reload.js');
      const content = fs.readFileSync(hotReloadScript, 'utf8');
      
      expect(content).toContain('.vscode');
      expect(content).toContain('launch.json');
      expect(content).toContain('Debug Auth Service');
      expect(content).toContain('Debug Document Service');
      expect(content).toContain('Debug Python Analysis');
    });
  });

  describe('Environment Variable Management', () => {
    test('development environment should have all required variables', () => {
      const devEnvPath = path.join(__dirname, '../config/development.env');
      const content = fs.readFileSync(devEnvPath, 'utf8');
      
      const requiredVars = [
        'NODE_ENV',
        'DATABASE_HOST',
        'DATABASE_PORT',
        'DATABASE_NAME',
        'DATABASE_USER',
        'DATABASE_PASSWORD',
        'REDIS_HOST',
        'REDIS_PORT',
        'JWT_SECRET',
        'STORAGE_PROVIDER',
        'DEFAULT_LANGUAGE',
        'SUPPORTED_LANGUAGES'
      ];
      
      requiredVars.forEach(varName => {
        expect(content).toContain(`${varName}=`);
      });
    });

    test('production environment should use environment variable substitution', () => {
      const prodEnvPath = path.join(__dirname, '../config/production.env');
      const content = fs.readFileSync(prodEnvPath, 'utf8');
      
      expect(content).toContain('${DB_HOST}');
      expect(content).toContain('${DB_PASSWORD}');
      expect(content).toContain('${REDIS_PASSWORD}');
      expect(content).toContain('${JWT_SECRET}');
      expect(content).toContain('${AWS_ACCESS_KEY_ID}');
    });

    test('should have proper multilingual configuration', () => {
      const devEnvPath = path.join(__dirname, '../config/development.env');
      const content = fs.readFileSync(devEnvPath, 'utf8');
      
      expect(content).toContain('DEFAULT_LANGUAGE=pt-PT');
      expect(content).toContain('SUPPORTED_LANGUAGES=pt-PT,en-US,fr-FR');
      expect(content).toContain('TIMEZONE=Africa/Luanda');
    });
  });

  describe('Script Executability', () => {
    test('development scripts should be executable Node.js files', () => {
      const scripts = [
        '../scripts/dev-docker.js',
        '../scripts/setup-hot-reload.js'
      ];
      
      scripts.forEach(scriptPath => {
        const fullPath = path.join(__dirname, scriptPath);
        expect(fs.existsSync(fullPath)).toBe(true);
        
        const content = fs.readFileSync(fullPath, 'utf8');
        expect(content).toMatch(/^#!/); // Should have shebang
        expect(content).toContain('require.main === module'); // Should be executable
      });
    });

    test('scripts should have proper error handling', () => {
      const devDockerPath = path.join(__dirname, '../scripts/dev-docker.js');
      const content = fs.readFileSync(devDockerPath, 'utf8');
      
      expect(content).toContain('uncaughtException');
      expect(content).toContain('unhandledRejection');
      expect(content).toContain('try {');
      expect(content).toContain('catch');
    });
  });
});