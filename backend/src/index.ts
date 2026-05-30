import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { testDatabaseConnection } from './config/database';
import { createRedisClient } from './config/redis';
import logger from './config/logger';
import { globalRateLimit } from './middleware/rate-limit.middleware';
import { auditMiddleware } from './middleware/audit.middleware';

import authRoutes  from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import partsRoutes from './routes/parts.routes';
import {
  rfqRouter,
  leadsRouter,
  analyticsRouter,
  pdfRouter,
  settingsRouter,
  rfqStatusRouter,
} from './routes/all-routes';

const app  = express();
console.log('🔍 Env check:', {
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET ? 'EXISTS' : 'UNDEFINED',
  NODE_ENV: process.env.NODE_ENV
});
const PORT = parseInt(process.env.PORT || '4000');
const API  = process.env.API_PREFIX || '/api/v1';

app.set('trust proxy', 1);

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({
  origin:         process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials:    true,
  methods:        ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Session-Id'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(compression());
app.use(globalRateLimit);
app.use(auditMiddleware);

// Health check
app.get('/health', async (_req, res) => {
  try {
    const { db } = await import('./config/database');
    await db.query('SELECT 1');
    res.json({ status: 'healthy', timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
  } catch {
    res.status(503).json({ status: 'unhealthy' });
  }
});

// Debug endpoint untuk cek environment variables
app.get('/debug-env', (_req, res) => {
  res.json({
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET ? 'SET' : 'MISSING',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ? 'SET' : 'MISSING',
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
  });
});

// Routes
app.use(`${API}/auth`,      authRoutes);
app.use(`${API}/admin`,     adminRoutes);
app.use(`${API}/parts`,     partsRoutes);
app.use(`${API}/rfq`,       rfqRouter);
app.use(`${API}/admin/leads`,     leadsRouter);
app.use(`${API}/admin/analytics`, analyticsRouter);
app.use(`${API}/admin/pdf`,       pdfRouter);
app.use(`${API}/admin/settings`,  settingsRouter);
app.use(`${API}/rfq`,            rfqStatusRouter);

app.use((_req, res) => res.status(404).json({ success: false, error: 'NOT_FOUND' }));
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
  });
});

async function bootstrap(): Promise<void> {
  logger.info('🚀 Starting OSCARPART API...');
  await testDatabaseConnection();
  try {
    await createRedisClient();
  } catch (err) {
    logger.warn('Redis not available, continuing without cache:', err);
  }
  app.listen(PORT, () => {
    logger.info(`✅ OSCARPART API running on :${PORT} [${process.env.NODE_ENV}]`);
    logger.info(`   Endpoints: ${API}/auth | ${API}/parts | ${API}/rfq | ${API}/admin/*`);
  });
}

process.on('SIGTERM', async () => {
  const { db } = await import('./config/database');
  await db.end();
  process.exit(0);
});

bootstrap().catch((err) => { logger.error('Bootstrap failed:', err); process.exit(1); });

export default app;
// cache bust 31/05/2026  2:07:09,06 