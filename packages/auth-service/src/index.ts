// Advanced Document Management System - Authentication Service
// Sistema de Gestão Documental Avançado - Serviço de Autenticação
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from './config/environment';
import { errorHandler } from './middleware/error-handler';
import { requestLogger } from './middleware/request-logger';
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/users';
import { healthRoutes } from './routes/health';
import { DatabaseService } from './services/database';
import { RedisService } from './services/redis';

// Initialize logger - will be mocked in tests
let logger: any;
try {
  const { createLogger } = require('@adms/shared');
  logger = createLogger({
    service: 'auth-service',
    level: config.isDevelopment() ? 'debug' : 'info'
  });
} catch (error) {
  // Fallback logger for development/testing
  logger = {
    info: console.log,
    warn: console.warn,
    error: console.error,
    debug: console.debug
  };
}

// Create Express app
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS configuration
app.use(cors({
  origin: config.get('CORS_ORIGINS')?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Compression
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.get('RATE_LIMIT_MAX') || 100,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Health check (before authentication)
app.use('/health', healthRoutes);

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
      path: req.originalUrl
    }
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}, starting graceful shutdown...`);
  try {
    // Close database connections
    await DatabaseService.disconnect();
    await RedisService.disconnect();
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown', { error });
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const startServer = async () => {
  try {
    // Initialize database
    await DatabaseService.connect();
    logger.info('Database connected successfully');

    // Initialize Redis
    await RedisService.connect();
    logger.info('Redis connected successfully');

    // Start HTTP server
    const port = config.get('PORT') || 3001;
    const host = config.get('HOST') || '0.0.0.0';
    
    app.listen(port, host, () => {
      logger.info(`🚀 Auth Service started successfully`, {
        port,
        host,
        environment: config.getEnvironment(),
        version: config.get('APP_VERSION') || '1.0.0'
      });
    });
  } catch (error) {
    logger.error('Failed to start auth service', { error });
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
  process.exit(1);
});

// Start the server only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;