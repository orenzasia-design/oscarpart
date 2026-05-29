// ============================================================
// rfq.routes.ts
// ============================================================
import { Router } from 'express';
import { authenticate, optionalAuth, requireRole } from '../middleware/auth.middleware';
import { uploadRateLimit } from '../middleware/rate-limit.middleware';
import {
  createDraft, updateItems, uploadFile, uploadMiddleware,
  submit, getOne, downloadTemplate, myRfqs, adminList,
} from '../controllers/rfq.controller';

const rfqRouter = Router();

// Public — download blank template
rfqRouter.get('/template', downloadTemplate);

// Optional auth — create draft (works for logged-in and anonymous)
rfqRouter.post('/draft', optionalAuth, createDraft);

// Upload XLSX/CSV — approved+ or anonymous (anonymous gets stock but no prices)
rfqRouter.post(
  '/upload',
  optionalAuth,
  uploadRateLimit,
  (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (err) {
        res.status(422).json({ success: false, error: 'FILE_ERROR', message: err.message });
        return;
      }
      next();
    });
  },
  uploadFile
);

// Update items in draft
rfqRouter.post('/:id/items', optionalAuth, updateItems);

// Submit RFQ
rfqRouter.post('/:id/submit', optionalAuth, submit);

// Customer: their own RFQs
rfqRouter.get('/my', authenticate, requireRole('approved'), myRfqs);

// Get single RFQ (admin or owner)
rfqRouter.get('/:id', optionalAuth, getOne);

// Admin: list all
rfqRouter.get('/', authenticate, requireRole('admin'), adminList);

export { rfqRouter };

// ============================================================
// leads.routes.ts
// ============================================================
import { Router as LeadRouter } from 'express';
import { list, getOne as getOneLead, update, stats } from '../controllers/leads.controller';

const leadsRouter = LeadRouter();
leadsRouter.use(authenticate, requireRole('admin'));

leadsRouter.get('/',            list);
leadsRouter.get('/stats',       stats);
leadsRouter.get('/:id',         getOneLead);
leadsRouter.patch('/:id',       update);

export { leadsRouter };

// ============================================================
// analytics.routes.ts
// ============================================================
import { Router as AnalyticsRouter } from 'express';
import analyticsCtrl from '../controllers/analytics.controller';

const analyticsRouter = AnalyticsRouter();
analyticsRouter.use(authenticate, requireRole('admin'));

analyticsRouter.get('/kpis',            analyticsCtrl.kpis);
analyticsRouter.get('/search-trends',   analyticsCtrl.searchTrends);
analyticsRouter.get('/parts-not-found', analyticsCtrl.partsNotFound);
analyticsRouter.get('/rfq-trends',      analyticsCtrl.rfqTrends);
analyticsRouter.get('/top-customers',   analyticsCtrl.topCustomers);
analyticsRouter.get('/pipeline',        analyticsCtrl.revenuePipeline);
analyticsRouter.get('/top-brands',      analyticsCtrl.topBrands);
analyticsRouter.get('/activity-feed',   analyticsCtrl.activityFeed);
analyticsRouter.get('/search-volume',   analyticsCtrl.searchVolume);

export { analyticsRouter };

// ============================================================
// pdf.routes.ts
// ============================================================
import { Router as PdfRouter } from 'express';
import { generateRfqPdf } from '../services/pdf.service';
import logger from '../config/logger';

const pdfRouter = PdfRouter();
pdfRouter.use(authenticate, requireRole('admin'));

pdfRouter.get('/rfq/:rfqId', async (req, res) => {
  try {
    const buffer = await generateRfqPdf(req.params.rfqId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="OSCARPART-${req.params.rfqId}.pdf"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === 'RFQ_NOT_FOUND') { res.status(404).json({ success: false, error: msg }); return; }
    logger.error('PDF generate error:', err);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

export { pdfRouter };

// ============================================================
// settings.routes.ts
// ============================================================
import { Router as SettingsRouter } from 'express';
import { query as dbQuery } from '../config/database';

const settingsRouter = SettingsRouter();
settingsRouter.use(authenticate, requireRole('superadmin'));

settingsRouter.get('/', async (_req, res) => {
  const result = await dbQuery('SELECT key, value, value_type, description FROM settings ORDER BY key');
  res.json({ success: true, data: result.rows });
});

settingsRouter.patch('/:key', async (req, res) => {
  try {
    const { value } = req.body;
    await dbQuery(
      `UPDATE settings SET value = $1, updated_by = $2, updated_at = NOW() WHERE key = $3`,
      [value, req.user!.sub, req.params.key]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

export { settingsRouter };

// ============================================================
// Patch RFQ status (admin)
// ============================================================
import { Router as StatusRouter } from 'express';
const rfqStatusRouter = StatusRouter();
rfqStatusRouter.use(authenticate, requireRole('admin'));
rfqStatusRouter.patch('/:id/status', async (req, res) => {
  const { status } = req.body;
  const valid = ['submitted','processing','quoted','closed','cancelled'];
  if (!valid.includes(status)) {
    res.status(422).json({ success: false, error: 'INVALID_STATUS' });
    return;
  }
  try {
    const { query: dbQuery } = await import('../config/database');
    await dbQuery(
      `UPDATE rfq_sessions SET status = $1, updated_at = NOW() WHERE id = $2`,
      [status, req.params.id]
    );
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});
export { rfqStatusRouter };
