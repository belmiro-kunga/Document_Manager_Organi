// Redis service for Authentication Service
// Serviço Redis para o Serviço de Autenticação
import Redis from 'ioredis';
import { createLogger } from '@adms/shared';
import { config } from '../config/environment';

const logger = createLogger({ service: 'auth-service-redis' });

/**
 * Redis service class
 */
export class RedisService {
  private static instance: RedisService;
  private client: Redis | null = null;
  private isConnected = false;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  /**
   * Connect to Redis
   */
  public async connect(): Promise<void> {
    if (this.isConnected && this.client) {
      return;
    }

    try {
      const redisUrl = config.getRedisUrl();
      
      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        enableReadyCheck: true,
        lazyConnect: true,
        keepAlive: 30000,
        connectTimeout: 10000,
        commandTimeout: 5000,
        db: parseInt(config.get('REDIS_DB') || '0'),
        keyPrefix: config.get('REDIS_KEY_PREFIX') || 'adms:auth:',
      });

      // Setup event handlers
      this.client.on('connect', () => {
        logger.info('Redis connecting...');
      });

      this.client.on('ready', () => {
        this.isConnected = true;
        logger.info('Redis connected successfully', {
          host: config.get('REDIS_HOST'),
          port: config.get('REDIS_PORT'),
          db: config.get('REDIS_DB')
        });
      });

      this.client.on('error', (error) => {
        logger.error('Redis connection error', { error });
        this.isConnected = false;
      });

      this.client.on('close', () => {
        logger.warn('Redis connection closed');
        this.isConnected = false;
      });

      this.client.on('reconnecting', (delay) => {
        logger.info('Redis reconnecting...', { delay });
      });

      // Connect to Redis
      await this.client.connect();

      // Test connection
      await this.client.ping();
      logger.info('Redis ping successful');

    } catch (error) {
      logger.error('Failed to connect to Redis', { error });
      throw error;
    }
  }

  /**
   * Disconnect from Redis
   */
  public async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.quit();
        this.isConnected = false;
        logger.info('Redis disconnected successfully');
      } catch (error) {
        logger.error('Error disconnecting from Redis', { error });
        throw error;
      }
    }
  }

  /**
   * Get Redis client
   */
  public getClient(): Redis {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis not connected');
    }
    return this.client;
  }

  /**
   * Set key-value pair with optional expiration
   */
  public async set(key: string, value: string | object, ttlSeconds?: number): Promise<void> {
    if (!this.client) {
      throw new Error('Redis not connected');
    }

    try {
      const serializedValue = typeof value === 'object' ? JSON.stringify(value) : value;
      
      if (ttlSeconds) {
        await this.client.setex(key, ttlSeconds, serializedValue);
      } else {
        await this.client.set(key, serializedValue);
      }

      logger.debug('Redis SET operation', { key, ttl: ttlSeconds });
    } catch (error) {
      logger.error('Redis SET failed', { key, error });
      throw error;
    }
  }

  /**
   * Get value by key
   */
  public async get<T = string>(key: string, parseJson = false): Promise<T | null> {
    if (!this.client) {
      throw new Error('Redis not connected');
    }

    try {
      const value = await this.client.get(key);
      
      if (value === null) {
        return null;
      }

      if (parseJson) {
        try {
          return JSON.parse(value) as T;
        } catch {
          return value as T;
        }
      }

      return value as T;
    } catch (error) {
      logger.error('Redis GET failed', { key, error });
      throw error;
    }
  }

  /**
   * Delete key(s)
   */
  public async del(key: string | string[]): Promise<number> {
    if (!this.client) {
      throw new Error('Redis not connected');
    }

    try {
      const keys = Array.isArray(key) ? key : [key];
      const result = await this.client.del(...keys);
      logger.debug('Redis DEL operation', { keys, deleted: result });
      return result;
    } catch (error) {
      logger.error('Redis DEL failed', { key, error });
      throw error;
    }
  }

  /**
   * Check if key exists
   */
  public async exists(key: string): Promise<boolean> {
    if (!this.client) {
      throw new Error('Redis not connected');
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis EXISTS failed', { key, error });
      throw error;
    }
  }

  /**
   * Set expiration for key
   */
  public async expire(key: string, seconds: number): Promise<boolean> {
    if (!this.client) {
      throw new Error('Redis not connected');
    }

    try {
      const result = await this.client.expire(key, seconds);
      return result === 1;
    } catch (error) {
      logger.error('Redis EXPIRE failed', { key, seconds, error });
      throw error;
    }
  }

  /**
   * Get time to live for key
   */
  public async ttl(key: string): Promise<number> {
    if (!this.client) {
      throw new Error('Redis not connected');
    }

    try {
      return await this.client.ttl(key);
    } catch (error) {
      logger.error('Redis TTL failed', { key, error });
      throw error;
    }
  }

  /**
   * Increment counter
   */
  public async incr(key: string): Promise<number> {
    if (!this.client) {
      throw new Error('Redis not connected');
    }

    try {
      return await this.client.incr(key);
    } catch (error) {
      logger.error('Redis INCR failed', { key, error });
      throw error;
    }
  }

  /**
   * Increment counter by amount
   */
  public async incrby(key: string, increment: number): Promise<number> {
    if (!this.client) {
      throw new Error('Redis not connected');
    }

    try {
      return await this.client.incrby(key, increment);
    } catch (error) {
      logger.error('Redis INCRBY failed', { key, increment, error });
      throw error;
    }
  }

  /**
   * Add to set
   */
  public async sadd(key: string, ...members: string[]): Promise<number> {
    if (!this.client) {
      throw new Error('Redis not connected');
    }

    try {
      return await this.client.sadd(key, ...members);
    } catch (error) {
      logger.error('Redis SADD failed', { key, members, error });
      throw error;
    }
  }

  /**
   * Get set members
   */
  public async smembers(key: string): Promise<string[]> {
    if (!this.client) {
      throw new Error('Redis not connected');
    }

    try {
      return await this.client.smembers(key);
    } catch (error) {
      logger.error('Redis SMEMBERS failed', { key, error });
      throw error;
    }
  }

  /**
   * Remove from set
   */
  public async srem(key: string, ...members: string[]): Promise<number> {
    if (!this.client) {
      throw new Error('Redis not connected');
    }

    try {
      return await this.client.srem(key, ...members);
    } catch (error) {
      logger.error('Redis SREM failed', { key, members, error });
      throw error;
    }
  }

  /**
   * Check if member exists in set
   */
  public async sismember(key: string, member: string): Promise<boolean> {
    if (!this.client) {
      throw new Error('Redis not connected');
    }

    try {
      const result = await this.client.sismember(key, member);
      return result === 1;
    } catch (error) {
      logger.error('Redis SISMEMBER failed', { key, member, error });
      throw error;
    }
  }

  /**
   * Add to hash
   */
  public async hset(key: string, field: string, value: string | object): Promise<number> {
    if (!this.client) {
      throw new Error('Redis not connected');
    }

    try {
      const serializedValue = typeof value === 'object' ? JSON.stringify(value) : value;
      return await this.client.hset(key, field, serializedValue);
    } catch (error) {
      logger.error('Redis HSET failed', { key, field, error });
      throw error;
    }
  }

  /**
   * Get from hash
   */
  public async hget<T = string>(key: string, field: string, parseJson = false): Promise<T | null> {
    if (!this.client) {
      throw new Error('Redis not connected');
    }

    try {
      const value = await this.client.hget(key, field);
      
      if (value === null) {
        return null;
      }

      if (parseJson) {
        try {
          return JSON.parse(value) as T;
        } catch {
          return value as T;
        }
      }

      return value as T;
    } catch (error) {
      logger.error('Redis HGET failed', { key, field, error });
      throw error;
    }
  }

  /**
   * Get all hash fields and values
   */
  public async hgetall<T = Record<string, string>>(key: string, parseJson = false): Promise<T | null> {
    if (!this.client) {
      throw new Error('Redis not connected');
    }

    try {
      const result = await this.client.hgetall(key);
      
      if (Object.keys(result).length === 0) {
        return null;
      }

      if (parseJson) {
        const parsed: any = {};
        for (const [field, value] of Object.entries(result)) {
          try {
            parsed[field] = JSON.parse(value);
          } catch {
            parsed[field] = value;
          }
        }
        return parsed as T;
      }

      return result as T;
    } catch (error) {
      logger.error('Redis HGETALL failed', { key, error });
      throw error;
    }
  }

  /**
   * Delete hash field
   */
  public async hdel(key: string, ...fields: string[]): Promise<number> {
    if (!this.client) {
      throw new Error('Redis not connected');
    }

    try {
      return await this.client.hdel(key, ...fields);
    } catch (error) {
      logger.error('Redis HDEL failed', { key, fields, error });
      throw error;
    }
  }

  /**
   * Get keys matching pattern
   */
  public async keys(pattern: string): Promise<string[]> {
    if (!this.client) {
      throw new Error('Redis not connected');
    }

    try {
      return await this.client.keys(pattern);
    } catch (error) {
      logger.error('Redis KEYS failed', { pattern, error });
      throw error;
    }
  }

  /**
   * Flush database
   */
  public async flushdb(): Promise<void> {
    if (!this.client) {
      throw new Error('Redis not connected');
    }

    try {
      await this.client.flushdb();
      logger.warn('Redis database flushed');
    } catch (error) {
      logger.error('Redis FLUSHDB failed', { error });
      throw error;
    }
  }

  /**
   * Check Redis health
   */
  public async healthCheck(): Promise<{ healthy: boolean; latency: number; error?: string }> {
    const start = Date.now();
    try {
      await this.client?.ping();
      const latency = Date.now() - start;
      return { healthy: true, latency };
    } catch (error) {
      const latency = Date.now() - start;
      return { 
        healthy: false, 
        latency, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get Redis info
   */
  public async info(section?: string): Promise<string> {
    if (!this.client) {
      throw new Error('Redis not connected');
    }

    try {
      return await this.client.info(section);
    } catch (error) {
      logger.error('Redis INFO failed', { section, error });
      throw error;
    }
  }

  /**
   * Session management utilities
   */
  public async setSession(sessionId: string, data: object, ttlSeconds = 86400): Promise<void> {
    await this.set(`session:${sessionId}`, data, ttlSeconds);
  }

  public async getSession<T = any>(sessionId: string): Promise<T | null> {
    return await this.get<T>(`session:${sessionId}`, true);
  }

  public async deleteSession(sessionId: string): Promise<void> {
    await this.del(`session:${sessionId}`);
  }

  /**
   * Rate limiting utilities
   */
  public async checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const now = Date.now();
    const windowStart = Math.floor(now / (windowSeconds * 1000)) * windowSeconds * 1000;
    const rateLimitKey = `rate_limit:${key}:${windowStart}`;

    const current = await this.incr(rateLimitKey);
    
    if (current === 1) {
      await this.expire(rateLimitKey, windowSeconds);
    }

    const remaining = Math.max(0, limit - current);
    const resetTime = windowStart + (windowSeconds * 1000);

    return {
      allowed: current <= limit,
      remaining,
      resetTime
    };
  }

  /**
   * Cache utilities
   */
  public async cache<T>(key: string, fetcher: () => Promise<T>, ttlSeconds = 3600): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key, true);
    if (cached !== null) {
      return cached;
    }

    // Fetch data and cache it
    const data = await fetcher();
    await this.set(key, data, ttlSeconds);
    return data;
  }

  /**
   * Lock utilities for distributed locking
   */
  public async acquireLock(key: string, ttlSeconds = 30): Promise<string | null> {
    const lockKey = `lock:${key}`;
    const lockValue = `${Date.now()}-${Math.random()}`;
    
    const result = await this.client?.set(lockKey, lockValue, 'EX', ttlSeconds, 'NX');
    return result === 'OK' ? lockValue : null;
  }

  public async releaseLock(key: string, lockValue: string): Promise<boolean> {
    const lockKey = `lock:${key}`;
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    
    const result = await this.client?.eval(script, 1, lockKey, lockValue);
    return result === 1;
  }
}

// Export singleton instance
const redisServiceInstance = RedisService.getInstance();
export { redisServiceInstance as RedisService };

// Static methods for convenience
export const connectRedis = () => redisServiceInstance.connect();
export const disconnectRedis = () => redisServiceInstance.disconnect();
export const getRedisClient = () => redisServiceInstance.getClient();