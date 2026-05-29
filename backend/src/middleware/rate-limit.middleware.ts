import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { getRedisClient } from '../config/redis';
import logger from '../config/logger';

// ============================================================
// Generic rate limit response
// ============================================================

const rateLimitHandler = (req: Request, res: Response) => {
  logger.warn('Rate limit hit', {
    ip:   req.ip,
    path: req.path,
    user: req.user?.sub,
  });

  res.status(429).json({
    success: false,
    error:   'RATE_LIMIT_EXCEEDED',
    message: 'Terlalu banyak permintaan. Silakan coba lagi beberapa saat.',
    retryAfter: res.getHeader('Retry-After'),
  });
};

// ============================================================
// In-memory store factory (fallback when Redis unavailable)
// For production, swap to RedisStore
// ============================================================

function createLimiter(options: {
  windowMs:   number;
  max:        number;
  keyPrefix?: string;
  skipIf?:    (req: Request) => boolean;
}) {
  return rateLimit({
    windowMs:         options.windowMs,
    max:              options.max,
    standardHeaders:  true,
    legacyHeaders:    false,
    handler:          rateLimitHandler,
    keyGenerator: (req: Request) => {
      const prefix = options.keyPrefix || 'rl';
      const userId = req.user?.sub;
      // Rate limit per user if authenticated, else per IP
      return userId ? `${prefix}:user:${userId}` : `${prefix}:ip:${req.ip}`;
    },
    skip: options.skipIf,
  });
}

// ============================================================
// Search rate limits (critical — protect 100k+ part DB)
// ============================================================

export const searchRateLimitPublic = createLimiter({
  windowMs:  60 * 1000,  // 1 minute
  max:       30,
  keyPrefix: 'rl:search',
});

export const searchRateLimitAuth = createLimiter({
  windowMs:  60 * 1000,
  max:       60,
  keyPrefix: 'rl:search',
  skipIf:    (req) => {
    const role = req.user?.role;
    return role === 'admin' || role === 'superadmin';
  },
});

// ============================================================
// Auth rate limits (brute-force protection)
// ============================================================

export const loginRateLimit = createLimiter({
  windowMs:  15 * 60 * 1000,  // 15 minutes
  max:       10,
  keyPrefix: 'rl:login',
  keyGenerator: (req: Request) => `rl:login:ip:${req.ip}`,  // Always by IP for login
} as Parameters<typeof createLimiter>[0]);

export const registerRateLimit = createLimiter({
  windowMs:  60 * 60 * 1000,  // 1 hour
  max:       5,
  keyPrefix: 'rl:register',
});

export const refreshRateLimit = createLimiter({
  windowMs:  5 * 60 * 1000,   // 5 minutes
  max:       10,
  keyPrefix: 'rl:refresh',
});

// ============================================================
// Upload rate limit
// ============================================================

export const uploadRateLimit = createLimiter({
  windowMs:  60 * 60 * 1000,  // 1 hour
  max:       20,
  keyPrefix: 'rl:upload',
});

// ============================================================
// Global API rate limit (catch-all)
// ============================================================

export const globalRateLimit = createLimiter({
  windowMs:  60 * 1000,
  max:       200,
  keyPrefix: 'rl:global',
  skipIf:    (req) => {
    return req.user?.role === 'superadmin';
  },
});

export default {
  searchRateLimitPublic,
  searchRateLimitAuth,
  loginRateLimit,
  registerRateLimit,
  refreshRateLimit,
  uploadRateLimit,
  globalRateLimit,
};
