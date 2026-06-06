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

import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import partsRoutes from './routes/parts.routes';
import { rfqRouter } from './routes/rfq.routes'; // ✅ import dari file terpisah
import { unitsRouter } from './routes/units.routes'; // ✅ Loyalty Engine - Unit HM Tracker
import pmBundlesRouter from './routes/pm-bundles.routes'; // ✅ Bundle PM SANY
import { runPmBundlesMigration } from './scripts/run-pm-bundles-migration';
import { seedSkt105sData } from './scripts/seed-skt105s';
import {
  leadsRouter,
  analyticsRouter,
  pdfRouter,
  settingsRouter,
  rfqStatusRouter,
} from './routes/all-routes';

const app = express();
const PORT = parseInt(process.env.PORT || '4000');
const API = process.env.API_PREFIX || '/api/v1';

app.set('trust proxy', 1);

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

// ========== PERBAIKAN CORS ==========
const allowedOrigins = [
  'https://truthful-spontaneity-production.up.railway.app',
  'https://oscarpart-production.up.railway.app',
  'https://oscarpart.vercel.app',
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      logger.warn(`CORS blocked origin: ${origin}`);
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-Id'],
}));

app.options('*', (req, res) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Id');
  res.sendStatus(200);
});
// ====================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(compression());
app.use(globalRateLimit);
app.use(auditMiddleware);

// ========== TEMPORARY ENDPOINT – HAPUS SETELAH DIGUNAKAN ==========
app.post('/admin/truncate-parts', async (_req, res) => {
  try {
    const { db } = await import('./config/database');
    await db.query('TRUNCATE parts CASCADE;');
    res.json({ success: true, message: 'Semua data parts (dan relasi) telah dihapus.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.get('/reset-admin-pass', async (_req, res) => {
  try {
    const bcrypt = await import('bcrypt');
    const hashed = await bcrypt.hash('Admin@Oscar2026!', 10);
    const { db } = await import('./config/database');
    await db.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [hashed, '365ff4b1-afce-4bdf-bbc0-ff923b12d224']);
    res.json({ success: true, message: 'Password reset berhasil' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
// =================================================================

app.get('/health', async (_req, res) => {
  try {
    const { db } = await import('./config/database');
    await db.query('SELECT 1');
    res.json({ status: 'healthy', timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
  } catch {
    res.status(503).json({ status: 'unhealthy' });
  }
});

app.get('/debug-env', (_req, res) => {
  res.json({
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET ? 'SET' : 'MISSING',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ? 'SET' : 'MISSING',
    FONNTE_TOKEN: process.env.FONNTE_TOKEN ? 'SET' : 'MISSING',
    FONNTE_ADMIN_NUMBER: process.env.FONNTE_ADMIN_NUMBER || 'MISSING',
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
  });
});

// Routes
app.use(`${API}/auth`, authRoutes);
app.use(`${API}/admin`, adminRoutes);
app.use(`${API}/parts`, partsRoutes);
app.use(`${API}/rfq`, rfqRouter);              // ✅ menggunakan rfqRouter dari file terpisah
app.use(`${API}/units`, unitsRouter);           // ✅ Loyalty Engine - Unit & HM Tracker
app.use(`${API}/pm-bundles`, pmBundlesRouter);           // ✅ Bundle PM SANY
app.use(`${API}/admin/leads`, leadsRouter);
app.use(`${API}/admin/analytics`, analyticsRouter);
app.use(`${API}/admin/pdf`, pdfRouter);
app.use(`${API}/admin/settings`, settingsRouter);
// rfqStatusRouter sudah di-handle oleh rfqRouter? Tidak, itu endpoint berbeda untuk update status. Biarkan tetap.
app.use(`${API}/rfq/status`, rfqStatusRouter); // ubah path agar tidak bentrok

// 404 handler
app.use((_req, res) => res.status(404).json({ success: false, error: 'NOT_FOUND' }));

// Error handler
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
  await runPmBundlesMigration();  // ✅ Run pm_bundles migration
  await seedSkt105sData();           // ✅ Seed SKT105S PM items (idempotent)
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
