#!/usr/bin/env node
// Development Docker operations script
// Script de operações Docker para desenvolvimento

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Utility functions
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function step(message) {
  log(`🔧 ${message}`, 'cyan');
}

// Check if Docker is available
function checkDockerAvailability() {
  try {
    execSync('docker --version', { stdio: 'ignore' });
    execSync('docker compose version', { stdio: 'ignore' });
    return true;
  } catch (err) {
    return false;
  }
}

// Check if Docker daemon is running
function checkDockerDaemon() {
  try {
    execSync('docker info', { stdio: 'ignore' });
    return true;
  } catch (err) {
    return false;
  }
}

// Get container status
function getContainerStatus(containerName) {
  try {
    const result = execSync(`docker ps -a --filter "name=${containerName}" --format "{{.Status}}"`, { 
      encoding: 'utf8' 
    }).trim();
    return result || 'not found';
  } catch (err) {
    return 'error';
  }
}

// Get service health
function getServiceHealth(serviceName) {
  try {
    const result = execSync(`docker compose -f docker-compose.dev.yml ps ${serviceName} --format "{{.Health}}"`, { 
      encoding: 'utf8' 
    }).trim();
    return result || 'unknown';
  } catch (err) {
    return 'error';
  }
}

// List all services
function listServices() {
  const services = [
    { name: 'postgres', container: 'adms-postgres-dev', port: '5433' },
    { name: 'redis', container: 'adms-redis-dev', port: '6379' },
    { name: 'elasticsearch', container: 'adms-elasticsearch-dev', port: '9200' },
    { name: 'minio', container: 'adms-minio-dev', port: '9000' },
    { name: 'auth-service', container: 'adms-auth-service-dev', port: '3001' },
    { name: 'document-service', container: 'adms-document-service-dev', port: '3002' },
    { name: 'python-analysis', container: 'adms-python-analysis-dev', port: '8001' },
    { name: 'web-client', container: 'adms-web-client-dev', port: '3000' }
  ];

  log('\n📊 Service Status:', 'bright');
  log('==================', 'bright');

  services.forEach(service => {
    const status = getContainerStatus(service.container);
    const health = getServiceHealth(service.name);
    
    let statusColor = 'red';
    let statusIcon = '❌';
    
    if (status.includes('Up')) {
      statusColor = 'green';
      statusIcon = '✅';
    } else if (status.includes('Exited')) {
      statusColor = 'yellow';
      statusIcon = '⚠️';
    }

    log(`${statusIcon} ${service.name.padEnd(20)} Port: ${service.port.padEnd(6)} Status: ${status}`, statusColor);
    
    if (health && health !== 'unknown' && health !== 'error') {
      log(`   Health: ${health}`, health === 'healthy' ? 'green' : 'yellow');
    }
  });
}

// Start development environment
async function startDevelopment(options = {}) {
  step('Starting development environment...');

  const composeFile = 'docker-compose.dev.yml';
  
  if (!fs.existsSync(composeFile)) {
    error(`Docker compose file ${composeFile} not found`);
    return false;
  }

  try {
    const buildFlag = options.build ? '--build' : '';
    const detachFlag = options.detach ? '-d' : '';
    
    step('Starting services...');
    execSync(`docker compose -f ${composeFile} up ${buildFlag} ${detachFlag}`, { 
      stdio: 'inherit' 
    });
    
    if (options.detach) {
      success('Development environment started in background');
      
      // Wait a bit for services to start
      step('Waiting for services to initialize...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      listServices();
    }
    
    return true;
  } catch (err) {
    error(`Failed to start development environment: ${err.message}`);
    return false;
  }
}

// Stop development environment
function stopDevelopment(options = {}) {
  step('Stopping development environment...');

  try {
    const volumeFlag = options.volumes ? '-v' : '';
    const removeOrphansFlag = '--remove-orphans';
    
    execSync(`docker compose -f docker-compose.dev.yml down ${volumeFlag} ${removeOrphansFlag}`, { 
      stdio: 'inherit' 
    });
    
    success('Development environment stopped');
    return true;
  } catch (err) {
    error(`Failed to stop development environment: ${err.message}`);
    return false;
  }
}

// Restart specific service
function restartService(serviceName) {
  step(`Restarting ${serviceName}...`);

  try {
    execSync(`docker compose -f docker-compose.dev.yml restart ${serviceName}`, { 
      stdio: 'inherit' 
    });
    
    success(`${serviceName} restarted successfully`);
    return true;
  } catch (err) {
    error(`Failed to restart ${serviceName}: ${err.message}`);
    return false;
  }
}

// View logs
function viewLogs(serviceName, options = {}) {
  step(`Viewing logs for ${serviceName || 'all services'}...`);

  try {
    const followFlag = options.follow ? '-f' : '';
    const tailFlag = options.tail ? `--tail ${options.tail}` : '';
    const service = serviceName || '';
    
    const command = `docker compose -f docker-compose.dev.yml logs ${followFlag} ${tailFlag} ${service}`;
    
    if (options.follow) {
      // Use spawn for interactive logs
      const child = spawn('docker', ['compose', '-f', 'docker-compose.dev.yml', 'logs', '-f', service], {
        stdio: 'inherit'
      });
      
      // Handle Ctrl+C
      process.on('SIGINT', () => {
        child.kill('SIGINT');
        process.exit(0);
      });
    } else {
      execSync(command, { stdio: 'inherit' });
    }
    
    return true;
  } catch (err) {
    error(`Failed to view logs: ${err.message}`);
    return false;
  }
}

// Clean up Docker resources
function cleanup(options = {}) {
  step('Cleaning up Docker resources...');

  try {
    // Stop and remove containers
    stopDevelopment({ volumes: true });
    
    if (options.images) {
      step('Removing development images...');
      try {
        execSync('docker images --filter "reference=adms-*" -q | xargs docker rmi -f', { 
          stdio: 'inherit' 
        });
      } catch (err) {
        warning('No development images to remove');
      }
    }
    
    if (options.system) {
      step('Running system prune...');
      execSync('docker system prune -f', { stdio: 'inherit' });
    }
    
    success('Cleanup completed');
    return true;
  } catch (err) {
    error(`Cleanup failed: ${err.message}`);
    return false;
  }
}

// Interactive menu
async function showMenu() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  function question(prompt) {
    return new Promise(resolve => {
      rl.question(prompt, resolve);
    });
  }

  while (true) {
    log('\n🐳 Advanced DMS - Development Docker Manager', 'bright');
    log('=============================================', 'bright');
    log('1. Start development environment');
    log('2. Start with build');
    log('3. Stop development environment');
    log('4. Stop and remove volumes');
    log('5. Restart service');
    log('6. View service status');
    log('7. View logs');
    log('8. Follow logs');
    log('9. Cleanup resources');
    log('0. Exit');
    
    const choice = await question('\nSelect an option: ');
    
    switch (choice) {
      case '1':
        await startDevelopment({ detach: true });
        break;
      case '2':
        await startDevelopment({ build: true, detach: true });
        break;
      case '3':
        stopDevelopment();
        break;
      case '4':
        stopDevelopment({ volumes: true });
        break;
      case '5':
        const service = await question('Enter service name: ');
        restartService(service);
        break;
      case '6':
        listServices();
        break;
      case '7':
        const logService = await question('Enter service name (or press Enter for all): ');
        viewLogs(logService || null);
        break;
      case '8':
        const followService = await question('Enter service name (or press Enter for all): ');
        viewLogs(followService || null, { follow: true });
        break;
      case '9':
        const cleanupChoice = await question('Remove images too? (y/N): ');
        cleanup({ images: cleanupChoice.toLowerCase() === 'y' });
        break;
      case '0':
        log('Goodbye! 👋', 'green');
        rl.close();
        return;
      default:
        warning('Invalid option');
    }
    
    if (choice !== '8') { // Don't pause after follow logs
      await question('\nPress Enter to continue...');
    }
  }
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  
  // Check Docker availability
  if (!checkDockerAvailability()) {
    error('Docker or Docker Compose is not installed or not in PATH');
    process.exit(1);
  }
  
  if (!checkDockerDaemon()) {
    error('Docker daemon is not running. Please start Docker Desktop or Docker service.');
    process.exit(1);
  }
  
  success('Docker is available and running');
  
  // Parse command line arguments
  if (args.length === 0) {
    await showMenu();
    return;
  }
  
  const command = args[0];
  
  switch (command) {
    case 'start':
      const buildFlag = args.includes('--build');
      await startDevelopment({ build: buildFlag, detach: true });
      break;
    case 'stop':
      const volumeFlag = args.includes('--volumes');
      stopDevelopment({ volumes: volumeFlag });
      break;
    case 'restart':
      const serviceName = args[1];
      if (!serviceName) {
        error('Please specify a service name');
        process.exit(1);
      }
      restartService(serviceName);
      break;
    case 'logs':
      const logServiceName = args[1];
      const followFlag = args.includes('--follow') || args.includes('-f');
      viewLogs(logServiceName, { follow: followFlag });
      break;
    case 'status':
      listServices();
      break;
    case 'cleanup':
      const imagesFlag = args.includes('--images');
      const systemFlag = args.includes('--system');
      cleanup({ images: imagesFlag, system: systemFlag });
      break;
    case 'menu':
      await showMenu();
      break;
    default:
      log('Usage: node scripts/dev-docker.js [command] [options]', 'yellow');
      log('\nCommands:');
      log('  start [--build]     Start development environment');
      log('  stop [--volumes]    Stop development environment');
      log('  restart <service>   Restart specific service');
      log('  logs <service> [-f] View logs');
      log('  status              Show service status');
      log('  cleanup [--images]  Clean up resources');
      log('  menu                Show interactive menu');
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  error(`Uncaught exception: ${err.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  error(`Unhandled rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

// Run main function
if (require.main === module) {
  main().catch(err => {
    error(`Script failed: ${err.message}`);
    process.exit(1);
  });
}

module.exports = {
  startDevelopment,
  stopDevelopment,
  restartService,
  viewLogs,
  listServices,
  cleanup
};