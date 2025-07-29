// Health check routes for Authentication Service
// Rotas de verificação de saúde para o Serviço de Autenticação
import { Router, Request, Response } from 'express';
import { DatabaseService } from '../services/database';
import { RedisService } from '../services/redis';
import { config } from '../config/environment';
import { createLogger } from '@adms/shared';

const router = Router();
const logger = createLogger({ service: 'auth-service-health' });

/**
 * Basic health check
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const timestamp = new Date().toISOString();
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();

    res.status(200).json({
      status: 'healthy',
      service: 'auth-service',
      version: config.get('APP_VERSION') || '1.0.0',
      environment: config.getEnvironment(),
      timestamp,
      uptime: Math.floor(uptime),
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024)
      }
    });
  } catch (error) {
    logger.error('Health check failed', { error });
    res.status(503).json({
      status: 'unhealthy',
      service: 'auth-service',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

/**
 * Detailed health check with dependencies
 */
router.get('/detailed', async (req: Request, res: Response) => {
  try {
    const timestamp = new Date().toISOString();
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    // Check database health
    const dbHealth = await DatabaseService.healthCheck();
    const dbStats = DatabaseService.getStats();

    // Check Redis health
    const redisHealth = await RedisService.healthCheck();

    // Overall health status
    const isHealthy = dbHealth.healthy && redisHealth.healthy;
    const status = isHealthy ? 'healthy' : 'unhealthy';
    const statusCode = isHealthy ? 200 : 503;

    const healthData = {
      status,
      service: 'auth-service',
      version: config.get('APP_VERSION') || '1.0.0',
      environment: config.getEnvironment(),
      timestamp,
      uptime: Math.floor(uptime),
      system: {
        memory: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024),
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          external: Math.round(memoryUsage.external / 1024 / 1024),
          usage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system
        },
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      },
      dependencies: {
        database: {
          status: dbHealth.healthy ? 'healthy' : 'unhealthy',
          latency: dbHealth.latency,
          error: dbHealth.error,
          pool: dbStats ? {
            total: dbStats.totalCount,
            idle: dbStats.idleCount,
            waiting: dbStats.waitingCount
          } : null
        },
        redis: {
          status: redisHealth.healthy ? 'healthy' : 'unhealthy',
          latency: redisHealth.latency,
          error: redisHealth.error
        }
      }
    };

    res.status(statusCode).json(healthData);

    // Log health check results
    if (!isHealthy) {
      logger.warn('Detailed health check failed', {
        database: dbHealth,
        redis: redisHealth
      });
    }

  } catch (error) {
    logger.error('Detailed health check failed', { error });
    res.status(503).json({
      status: 'unhealthy',
      service: 'auth-service',
      timestamp: new Date().toISOString(),
      error: 'Detailed health check failed'
    });
  }
});

/**
 * Readiness probe
 */
router.get('/ready', async (req: Request, res: Response) => {
  try {
    // Check if all critical dependencies are ready
    const dbHealth = await DatabaseService.healthCheck();
    const redisHealth = await RedisService.healthCheck();

    const isReady = dbHealth.healthy && redisHealth.healthy;

    if (isReady) {
      res.status(200).json({
        status: 'ready',
        service: 'auth-service',
        timestamp: new Date().toISOString(),
        dependencies: {
          database: 'ready',
          redis: 'ready'
        }
      });
    } else {
      res.status(503).json({
        status: 'not_ready',
        service: 'auth-service',
        timestamp: new Date().toISOString(),
        dependencies: {
          database: dbHealth.healthy ? 'ready' : 'not_ready',
          redis: redisHealth.healthy ? 'ready' : 'not_ready'
        }
      });
    }
  } catch (error) {
    logger.error('Readiness check failed', { error });
    res.status(503).json({
      status: 'not_ready',
      service: 'auth-service',
      timestamp: new Date().toISOString(),
      error: 'Readiness check failed'
    });
  }
});

/**
 * Liveness probe
 */
router.get('/live', (req: Request, res: Response) => {
  // Simple liveness check - just verify the service is running
  res.status(200).json({
    status: 'alive',
    service: 'auth-service',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime())
  });
});

/**
 * Metrics endpoint
 */
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const uptime = process.uptime();

    // Get database stats
    const dbStats = DatabaseService.getStats();

    // Get Redis info (basic metrics)
    let redisInfo = null;
    try {
      const info = await RedisService.info('memory');
      redisInfo = parseRedisInfo(info);
    } catch (error) {
      logger.warn('Failed to get Redis metrics', { error });
    }

    const metrics = {
      service: 'auth-service',
      timestamp: new Date().toISOString(),
      uptime,
      memory: {
        rss_bytes: memoryUsage.rss,
        heap_total_bytes: memoryUsage.heapTotal,
        heap_used_bytes: memoryUsage.heapUsed,
        external_bytes: memoryUsage.external,
        heap_usage_percent: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
      },
      cpu: {
        user_microseconds: cpuUsage.user,
        system_microseconds: cpuUsage.system
      },
      database: dbStats ? {
        pool_total: dbStats.totalCount,
        pool_idle: dbStats.idleCount,
        pool_waiting: dbStats.waitingCount,
        pool_usage_percent: Math.round(((dbStats.totalCount - dbStats.idleCount) / dbStats.totalCount) * 100)
      } : null,
      redis: redisInfo
    };

    res.status(200).json(metrics);
  } catch (error) {
    logger.error('Metrics collection failed', { error });
    res.status(500).json({
      error: 'Failed to collect metrics',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Configuration info (non-sensitive)
 */
router.get('/info', (req: Request, res: Response) => {
  const info = {
    service: 'auth-service',
    version: config.get('APP_VERSION') || '1.0.0',
    environment: config.getEnvironment(),
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    features: {
      registration: config.getFeatureFlags().registration,
      emailVerification: config.getFeatureFlags().emailVerification,
      passwordReset: config.getFeatureFlags().passwordReset,
      socialLogin: config.getFeatureFlags().socialLogin,
      twoFactor: config.getFeatureFlags().twoFactor
    },
    security: {
      jwtIssuer: config.getJwtConfig().issuer,
      jwtAudience: config.getJwtConfig().audience,
      sessionName: config.getSessionConfig().name,
      maxLoginAttempts: config.getSecurityConfig().maxLoginAttempts,
      twoFactorEnabled: config.getSecurityConfig().twoFactorEnabled
    },
    timestamp: new Date().toISOString()
  };

  res.status(200).json(info);
});

/**
 * Parse Redis INFO response
 */
function parseRedisInfo(info: string): any {
  const lines = info.split('\r\n');
  const result: any = {};

  for (const line of lines) {
    if (line.includes(':')) {
      const [key, value] = line.split(':');
      if (key && value) {
        // Convert numeric values
        const numValue = parseFloat(value);
        result[key] = isNaN(numValue) ? value : numValue;
      }
    }
  }

  return {
    used_memory_bytes: result.used_memory || 0,
    used_memory_peak_bytes: result.used_memory_peak || 0,
    connected_clients: result.connected_clients || 0,
    total_commands_processed: result.total_commands_processed || 0,
    keyspace_hits: result.keyspace_hits || 0,
    keyspace_misses: result.keyspace_misses || 0
  };
}

export { router as healthRoutes };