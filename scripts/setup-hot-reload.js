#!/usr/bin/env node
// Hot reload setup script for development containers
// Script de configuração de hot reload para containers de desenvolvimento

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function step(message) {
  log(`🔧 ${message}`, 'cyan');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Service configurations for hot reload
const serviceConfigs = {
  'auth-service': {
    packagePath: 'packages/auth-service',
    devScript: 'dev',
    watchPaths: ['src/**/*.ts', 'src/**/*.js'],
    envVars: {
      NODE_ENV: 'development',
      HOT_RELOAD: 'true',
      CHOKIDAR_USEPOLLING: 'true',
      CHOKIDAR_INTERVAL: '1000'
    }
  },
  'document-service': {
    packagePath: 'packages/document-service',
    devScript: 'dev',
    watchPaths: ['src/**/*.ts', 'src/**/*.js'],
    envVars: {
      NODE_ENV: 'development',
      HOT_RELOAD: 'true',
      CHOKIDAR_USEPOLLING: 'true',
      CHOKIDAR_INTERVAL: '1000'
    }
  },
  'web-client': {
    packagePath: 'packages/web-client',
    devScript: 'dev',
    watchPaths: ['src/**/*.tsx', 'src/**/*.ts', 'src/**/*.jsx', 'src/**/*.js', 'src/**/*.css'],
    envVars: {
      NODE_ENV: 'development',
      VITE_HMR_HOST: 'localhost',
      VITE_HMR_PORT: '5173',
      CHOKIDAR_USEPOLLING: 'true'
    }
  },
  'python-analysis': {
    packagePath: 'packages/python-analysis',
    devScript: 'dev',
    watchPaths: ['src/**/*.py'],
    envVars: {
      PYTHONUNBUFFERED: '1',
      WATCHDOG_POLLING: 'true',
      RELOAD: 'true'
    }
  }
};

// Create nodemon configuration for Node.js services
function createNodemonConfig(serviceName, config) {
  const nodemonConfig = {
    watch: config.watchPaths,
    ext: 'ts,js,json',
    ignore: [
      'node_modules/**/*',
      'dist/**/*',
      '**/*.test.ts',
      '**/*.test.js',
      'coverage/**/*'
    ],
    exec: 'npm run build && npm start',
    env: {
      ...config.envVars,
      NODE_ENV: 'development'
    },
    delay: 1000,
    verbose: true,
    legacyWatch: true,
    polling: true
  };

  const configPath = path.join(config.packagePath, 'nodemon.json');
  fs.writeFileSync(configPath, JSON.stringify(nodemonConfig, null, 2));
  success(`Created nodemon configuration for ${serviceName}`);
}

// Create development script for services
function createDevScript(serviceName, config) {
  const packageJsonPath = path.join(config.packagePath, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    error(`Package.json not found for ${serviceName}`);
    return;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Update scripts
  packageJson.scripts = packageJson.scripts || {};
  
  if (serviceName === 'python-analysis') {
    packageJson.scripts.dev = 'python -m uvicorn src.adms_analysis.main:app --reload --host 0.0.0.0 --port 8001';
  } else {
    packageJson.scripts.dev = 'nodemon';
    packageJson.scripts['dev:debug'] = 'nodemon --inspect=0.0.0.0:9229';
  }

  // Add development dependencies
  if (serviceName !== 'python-analysis') {
    packageJson.devDependencies = packageJson.devDependencies || {};
    packageJson.devDependencies.nodemon = '^3.0.1';
    packageJson.devDependencies['@types/node'] = '^20.4.5';
  }

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  success(`Updated package.json for ${serviceName}`);
}

// Create Docker development override
function createDockerDevOverride() {
  const overrideConfig = {
    version: '3.8',
    services: {
      'auth-service': {
        volumes: [
          './packages/auth-service:/app/packages/auth-service',
          './packages/shared:/app/packages/shared',
          '/app/packages/auth-service/node_modules',
          '/app/packages/shared/node_modules'
        ],
        environment: {
          NODE_ENV: 'development',
          HOT_RELOAD: 'true',
          CHOKIDAR_USEPOLLING: 'true'
        },
        command: 'npm run dev'
      },
      'document-service': {
        volumes: [
          './packages/document-service:/app/packages/document-service',
          './packages/shared:/app/packages/shared',
          '/app/packages/document-service/node_modules',
          '/app/packages/shared/node_modules'
        ],
        environment: {
          NODE_ENV: 'development',
          HOT_RELOAD: 'true',
          CHOKIDAR_USEPOLLING: 'true'
        },
        command: 'npm run dev'
      },
      'web-client': {
        volumes: [
          './packages/web-client:/app/packages/web-client',
          './packages/shared:/app/packages/shared',
          '/app/packages/web-client/node_modules',
          '/app/packages/shared/node_modules'
        ],
        environment: {
          NODE_ENV: 'development',
          VITE_HMR_HOST: 'localhost',
          CHOKIDAR_USEPOLLING: 'true'
        },
        ports: ['5173:5173'],
        command: 'npm run dev'
      },
      'python-analysis': {
        volumes: [
          './packages/python-analysis/src:/app/src',
          './packages/python-analysis/tests:/app/tests'
        ],
        environment: {
          PYTHONUNBUFFERED: '1',
          RELOAD: 'true'
        },
        command: 'python -m uvicorn src.adms_analysis.main:app --reload --host 0.0.0.0 --port 8001'
      }
    }
  };

  const yamlContent = `# Docker Compose override for development hot reload
# Override do Docker Compose para hot reload em desenvolvimento

version: '3.8'

services:
  auth-service:
    volumes:
      - ./packages/auth-service:/app/packages/auth-service
      - ./packages/shared:/app/packages/shared
      - /app/packages/auth-service/node_modules
      - /app/packages/shared/node_modules
    environment:
      NODE_ENV: development
      HOT_RELOAD: "true"
      CHOKIDAR_USEPOLLING: "true"
      CHOKIDAR_INTERVAL: "1000"
    command: npm run dev

  document-service:
    volumes:
      - ./packages/document-service:/app/packages/document-service
      - ./packages/shared:/app/packages/shared
      - /app/packages/document-service/node_modules
      - /app/packages/shared/node_modules
    environment:
      NODE_ENV: development
      HOT_RELOAD: "true"
      CHOKIDAR_USEPOLLING: "true"
      CHOKIDAR_INTERVAL: "1000"
    command: npm run dev

  web-client:
    volumes:
      - ./packages/web-client:/app/packages/web-client
      - ./packages/shared:/app/packages/shared
      - /app/packages/web-client/node_modules
      - /app/packages/shared/node_modules
    environment:
      NODE_ENV: development
      VITE_HMR_HOST: localhost
      CHOKIDAR_USEPOLLING: "true"
    ports:
      - "5173:5173"
    command: npm run dev

  python-analysis:
    volumes:
      - ./packages/python-analysis/src:/app/src
      - ./packages/python-analysis/tests:/app/tests
    environment:
      PYTHONUNBUFFERED: "1"
      RELOAD: "true"
    command: python -m uvicorn src.adms_analysis.main:app --reload --host 0.0.0.0 --port 8001
`;

  fs.writeFileSync('docker-compose.override.yml', yamlContent);
  success('Created Docker Compose override for hot reload');
}

// Create VS Code debugging configuration
function createVSCodeDebugConfig() {
  const vscodeDir = '.vscode';
  if (!fs.existsSync(vscodeDir)) {
    fs.mkdirSync(vscodeDir);
  }

  const launchConfig = {
    version: '0.2.0',
    configurations: [
      {
        name: 'Debug Auth Service (Docker)',
        type: 'node',
        request: 'attach',
        port: 9229,
        address: 'localhost',
        localRoot: '${workspaceFolder}/packages/auth-service',
        remoteRoot: '/app/packages/auth-service',
        protocol: 'inspector',
        restart: true,
        sourceMaps: true,
        outFiles: ['${workspaceFolder}/packages/auth-service/dist/**/*.js']
      },
      {
        name: 'Debug Document Service (Docker)',
        type: 'node',
        request: 'attach',
        port: 9230,
        address: 'localhost',
        localRoot: '${workspaceFolder}/packages/document-service',
        remoteRoot: '/app/packages/document-service',
        protocol: 'inspector',
        restart: true,
        sourceMaps: true,
        outFiles: ['${workspaceFolder}/packages/document-service/dist/**/*.js']
      },
      {
        name: 'Debug Python Analysis (Docker)',
        type: 'python',
        request: 'attach',
        connect: {
          host: 'localhost',
          port: 5678
        },
        pathMappings: [
          {
            localRoot: '${workspaceFolder}/packages/python-analysis/src',
            remoteRoot: '/app/src'
          }
        ]
      }
    ]
  };

  fs.writeFileSync(path.join(vscodeDir, 'launch.json'), JSON.stringify(launchConfig, null, 2));
  success('Created VS Code debug configuration');
}

// Install development dependencies
function installDevDependencies() {
  step('Installing development dependencies...');

  const services = ['auth-service', 'document-service', 'web-client'];
  
  for (const service of services) {
    const packagePath = `packages/${service}`;
    if (fs.existsSync(packagePath)) {
      try {
        step(`Installing dependencies for ${service}...`);
        execSync(`npm install --prefix ${packagePath} nodemon@^3.0.1 @types/node@^20.4.5`, { 
          stdio: 'inherit' 
        });
        success(`Dependencies installed for ${service}`);
      } catch (err) {
        error(`Failed to install dependencies for ${service}: ${err.message}`);
      }
    }
  }
}

// Create file watcher configuration
function createFileWatcherConfig() {
  const watcherConfig = {
    version: 1,
    projects: [
      {
        name: 'Advanced DMS Development',
        rootPath: '.',
        paths: [
          'packages/*/src/**/*.{ts,js,tsx,jsx}',
          'packages/*/src/**/*.{py}',
          'packages/shared/src/**/*.ts'
        ],
        ignore: [
          'node_modules/**',
          'dist/**',
          'build/**',
          '**/*.test.{ts,js}',
          'coverage/**'
        ],
        commands: [
          {
            match: 'packages/auth-service/src/**/*.{ts,js}',
            command: 'docker compose restart auth-service',
            runInTerminal: false
          },
          {
            match: 'packages/document-service/src/**/*.{ts,js}',
            command: 'docker compose restart document-service',
            runInTerminal: false
          },
          {
            match: 'packages/web-client/src/**/*.{ts,tsx,js,jsx}',
            command: 'echo "Hot reload handled by Vite"',
            runInTerminal: false
          },
          {
            match: 'packages/python-analysis/src/**/*.py',
            command: 'echo "Hot reload handled by uvicorn"',
            runInTerminal: false
          },
          {
            match: 'packages/shared/src/**/*.ts',
            command: 'docker compose restart auth-service document-service',
            runInTerminal: false
          }
        ]
      }
    ]
  };

  fs.writeFileSync('.watcherconfig.json', JSON.stringify(watcherConfig, null, 2));
  success('Created file watcher configuration');
}

// Main setup function
function setupHotReload() {
  step('Setting up hot reload for development environment...');

  // Create configurations for each service
  Object.entries(serviceConfigs).forEach(([serviceName, config]) => {
    step(`Configuring ${serviceName}...`);
    
    if (serviceName !== 'python-analysis') {
      createNodemonConfig(serviceName, config);
    }
    
    createDevScript(serviceName, config);
  });

  // Create Docker override
  createDockerDevOverride();

  // Create VS Code debug configuration
  createVSCodeDebugConfig();

  // Create file watcher configuration
  createFileWatcherConfig();

  // Install development dependencies
  installDevDependencies();

  success('Hot reload setup completed!');
  
  log('\n📋 Next steps:', 'cyan');
  log('1. Run: docker compose up -d');
  log('2. Your changes will automatically reload in containers');
  log('3. Use VS Code debug configurations to debug services');
  log('4. Check logs: docker compose logs -f <service-name>');
  
  log('\n🔧 Available commands:', 'cyan');
  log('- npm run docker:dev     # Start with hot reload');
  log('- npm run dev:auth       # Run auth service locally');
  log('- npm run dev:document   # Run document service locally');
  log('- npm run dev:web        # Run web client locally');
  log('- npm run dev:python     # Run python service locally');
}

// Main execution
if (require.main === module) {
  setupHotReload();
}

module.exports = {
  setupHotReload,
  createNodemonConfig,
  createDevScript,
  createDockerDevOverride
};