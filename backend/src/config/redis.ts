import { createClient, RedisClientType } from 'redis';
import logger from './logger';

let redisClient: RedisClientType;

export async function createRedisClient(): Promise<RedisClientType> {
  const config: Record<string, unknown> = {
    socket: {
      host:           process.env.REDIS_HOST || 'localhost',
      port:           parseInt(process.env.REDIS_PORT || '6379'),
      reconnectStrategy: (retries: number) => {
        if (retries > 10) {
          logger.error('Redis: max reconnection attempts reached');
          return new Error('Max Redis reconnection attempts reached');
        }
        return Math.min(retries * 100, 3000);
      },
    },
  };

  if (process.env.REDIS_PASSWORD) {
    config.password = process.env.REDIS_PASSWORD;
  }

  if (process.env.REDIS_TLS === 'true') {
    (config.socket as Record<string, unknown>).tls = true;
  }

  redisClient = createClient(config) as RedisClientType;

  redisClient.on('error', (err: Error) => {
    logger.error('Redis client error:', err);
  });

  redisClient.on('connect', () => {
    logger.info('Redis client connected');
  });

  redisClient.on('reconnecting', () => {
    logger.warn('Redis client reconnecting...');
  });

  await redisClient.connect();
  return redisClient;
}

export function getRedisClient(): RedisClientType {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call createRedisClient() first.');
  }
  return redisClient;
}

// ============================================================
// Typed cache helpers
// ============================================================

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const value = await redisClient.get(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null; // Cache miss is never fatal
  }
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds: number = 300
): Promise<void> {
  try {
    await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
  } catch {
    // Cache write failure is never fatal
  }
}

export async function cacheDelete(key: string): Promise<void> {
  try {
    await redisClient.del(key);
  } catch {
    // Ignore
  }
}

export async function cacheDeletePattern(pattern: string): Promise<void> {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch {
    // Ignore
  }
}

export default { getRedisClient, cacheGet, cacheSet, cacheDelete, cacheDeletePattern };
