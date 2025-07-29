// Tests for build configuration
// Testes para configuração de build

const fs = require('fs');
const path = require('path');

describe('Build Configuration Tests', () => {
  describe('Package.json Configuration', () => {
    let packageJson;

    beforeAll(() => {
      const packagePath = path.join(__dirname, '../package.json');
      packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    });

    test('should have correct workspace configuration', () => {
      expect(packageJson.workspaces).toEqual(['packages/*']);
    });

    test('should have all required scripts', () => {
      const requiredScripts = [
        'dev', 'build', 'test', 'lint',
        'dev:auth', 'dev:document', 'dev:python', 'dev:web',
        'build:auth', 'build:document', 'build:web',
        'test:auth', 'test:document', 'test:web',
        'docker:dev', 'docker:prod', 'docker:down'
      ];

      requiredScripts.forEach(script => {
        expect(packageJson.scripts).toHaveProperty(script);
      });
    });

    test('should have correct Node.js engine requirement', () => {
      expect(packageJson.engines.node).toBe('>=18.0.0');
      expect(packageJson.engines.npm).toBe('>=9.0.0');
    });

    test('should have required dev dependencies', () => {
      const requiredDevDeps = [
        '@typescript-eslint/eslint-plugin',
        '@typescript-eslint/parser',
        'eslint',
        'prettier',
        'typescript',
        'husky',
        'lint-staged',
        'concurrently'
      ];

      requiredDevDeps.forEach(dep => {
        expect(packageJson.devDependencies).toHaveProperty(dep);
      });
    });
  });

  describe('TypeScript Configuration', () => {
    let tsConfig;

    beforeAll(() => {
      const tsConfigPath = path.join(__dirname, '../tsconfig.json');
      tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf8'));
    });

    test('should have correct compiler options', () => {
      expect(tsConfig.compilerOptions.target).toBe('ES2022');
      expect(tsConfig.compilerOptions.module).toBe('commonjs');
      expect(tsConfig.compilerOptions.strict).toBe(true);
      expect(tsConfig.compilerOptions.esModuleInterop).toBe(true);
    });

    test('should have path mappings configured', () => {
      expect(tsConfig.compilerOptions.paths).toHaveProperty('@shared/*');
      expect(tsConfig.compilerOptions.paths).toHaveProperty('@auth/*');
      expect(tsConfig.compilerOptions.paths).toHaveProperty('@document/*');
      expect(tsConfig.compilerOptions.paths).toHaveProperty('@web/*');
    });

    test('should have project references', () => {
      const expectedReferences = [
        { path: './packages/shared' },
        { path: './packages/auth-service' },
        { path: './packages/document-service' },
        { path: './packages/web-client' }
      ];

      expect(tsConfig.references).toEqual(expectedReferences);
    });
  });

  describe('ESLint Configuration', () => {
    let eslintConfig;

    beforeAll(() => {
      const eslintConfigPath = path.join(__dirname, '../.eslintrc.js');
      delete require.cache[require.resolve(eslintConfigPath)];
      eslintConfig = require(eslintConfigPath);
    });

    test('should extend required configurations', () => {
      expect(eslintConfig.extends).toContain('eslint:recommended');
      expect(eslintConfig.extends).toContain('@typescript-eslint/recommended');
      expect(eslintConfig.extends).toContain('prettier');
    });

    test('should have TypeScript parser configured', () => {
      expect(eslintConfig.parser).toBe('@typescript-eslint/parser');
    });

    test('should have required plugins', () => {
      expect(eslintConfig.plugins).toContain('@typescript-eslint');
      expect(eslintConfig.plugins).toContain('prettier');
    });

    test('should have React overrides for web-client', () => {
      const reactOverride = eslintConfig.overrides.find(
        override => override.files.includes('packages/web-client/**/*')
      );
      
      expect(reactOverride).toBeDefined();
      expect(reactOverride.plugins).toContain('react');
      expect(reactOverride.plugins).toContain('react-hooks');
    });
  });

  describe('Lerna Configuration', () => {
    let lernaConfig;

    beforeAll(() => {
      const lernaConfigPath = path.join(__dirname, '../lerna.json');
      lernaConfig = JSON.parse(fs.readFileSync(lernaConfigPath, 'utf8'));
    });

    test('should have independent versioning', () => {
      expect(lernaConfig.version).toBe('independent');
    });

    test('should have correct packages configuration', () => {
      expect(lernaConfig.packages).toEqual(['packages/*']);
    });

    test('should have npm as client', () => {
      expect(lernaConfig.npmClient).toBe('npm');
    });

    test('should ignore test files in changes', () => {
      expect(lernaConfig.ignoreChanges).toContain('**/*.test.ts');
      expect(lernaConfig.ignoreChanges).toContain('**/*.spec.ts');
      expect(lernaConfig.ignoreChanges).toContain('**/__tests__/**');
    });
  });

  describe('Package Structure', () => {
    test('should have all required packages', () => {
      const packagesDir = path.join(__dirname, '../packages');
      const packages = fs.readdirSync(packagesDir);
      
      const requiredPackages = [
        'shared',
        'auth-service',
        'document-service',
        'python-analysis',
        'web-client'
      ];

      requiredPackages.forEach(pkg => {
        expect(packages).toContain(pkg);
      });
    });

    test('each package should have package.json', () => {
      const packagesDir = path.join(__dirname, '../packages');
      const packages = fs.readdirSync(packagesDir);
      
      packages.forEach(pkg => {
        const packageJsonPath = path.join(packagesDir, pkg, 'package.json');
        expect(fs.existsSync(packageJsonPath)).toBe(true);
      });
    });

    test('TypeScript packages should have tsconfig.json', () => {
      const tsPackages = ['shared', 'auth-service', 'document-service', 'web-client'];
      
      tsPackages.forEach(pkg => {
        const tsConfigPath = path.join(__dirname, '../packages', pkg, 'tsconfig.json');
        expect(fs.existsSync(tsConfigPath)).toBe(true);
      });
    });

    test('each package should have src directory', () => {
      const packagesDir = path.join(__dirname, '../packages');
      const packages = fs.readdirSync(packagesDir);
      
      packages.forEach(pkg => {
        const srcPath = path.join(packagesDir, pkg, 'src');
        expect(fs.existsSync(srcPath)).toBe(true);
      });
    });
  });

  describe('Docker Configuration', () => {
    test('should have .dockerignore file', () => {
      const dockerignorePath = path.join(__dirname, '../.dockerignore');
      expect(fs.existsSync(dockerignorePath)).toBe(true);
    });

    test('should have .gitignore file', () => {
      const gitignorePath = path.join(__dirname, '../.gitignore');
      expect(fs.existsSync(gitignorePath)).toBe(true);
    });

    test('.dockerignore should exclude development files', () => {
      const dockerignorePath = path.join(__dirname, '../.dockerignore');
      const dockerignoreContent = fs.readFileSync(dockerignorePath, 'utf8');
      
      expect(dockerignoreContent).toContain('node_modules/');
      expect(dockerignoreContent).toContain('.git');
      expect(dockerignoreContent).toContain('*.md');
      expect(dockerignoreContent).toContain('.env*');
    });

    test('.gitignore should exclude build artifacts', () => {
      const gitignorePath = path.join(__dirname, '../.gitignore');
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
      
      expect(gitignoreContent).toContain('node_modules/');
      expect(gitignoreContent).toContain('dist/');
      expect(gitignoreContent).toContain('.env');
      expect(gitignoreContent).toContain('coverage/');
    });
  });

  describe('Prettier Configuration', () => {
    let prettierConfig;

    beforeAll(() => {
      const prettierConfigPath = path.join(__dirname, '../.prettierrc');
      prettierConfig = JSON.parse(fs.readFileSync(prettierConfigPath, 'utf8'));
    });

    test('should have consistent formatting rules', () => {
      expect(prettierConfig.semi).toBe(true);
      expect(prettierConfig.singleQuote).toBe(true);
      expect(prettierConfig.printWidth).toBe(100);
      expect(prettierConfig.tabWidth).toBe(2);
      expect(prettierConfig.trailingComma).toBe('es5');
    });

    test('should have file-specific overrides', () => {
      expect(prettierConfig.overrides).toBeDefined();
      
      const jsonOverride = prettierConfig.overrides.find(
        override => override.files === '*.json'
      );
      expect(jsonOverride).toBeDefined();
      expect(jsonOverride.options.printWidth).toBe(80);
    });
  });
});